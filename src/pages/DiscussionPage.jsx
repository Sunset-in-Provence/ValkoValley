/**
 * 讨论区主页 — 帖子列表 + 排序 + 搜索
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import PostCard from '@/components/discussion/PostCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { MessageSquare, Plus, Clock, Flame, ArrowUp, ArrowDown } from 'lucide-react'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { key: 'newest', label: '最新', icon: Clock, order: 'desc' },
  { key: 'oldest', label: '最早', icon: Clock, order: 'asc' },
  { key: 'top', label: '最多赞', icon: ArrowUp, order: 'desc' },
  { key: 'hot', label: '最热', icon: Flame, order: 'desc' },
]

export default function DiscussionPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPosts() }, [sort])

  async function fetchPosts() {
    setLoading(true)
    let query = supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false)

    const { data, error } = await query
    if (error || !data) { setLoading(false); return }

    // 获取评论数和点赞数
    const postIds = data.map((p) => p.id)
    const [{ data: comments }, { data: likes }] = await Promise.all([
      supabase.from('comments').select('post_id').in('post_id', postIds).eq('is_deleted', false),
      supabase.from('likes').select('target_id').eq('target_type', 'post').in('target_id', postIds),
    ])

    const commentMap = {}; comments?.forEach((c) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1 })
    const likeMap = {}; likes?.forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })

    let enriched = data.map((p) => {
      const c = commentMap[p.id] || 0
      const l = likeMap[p.id] || 0
      const age = (Date.now() - new Date(p.created_at).getTime()) / 3600000 // hours
      const hotness = age > 0 ? (l * 2 + c * 3) / Math.pow(age + 1, 1.2) : l * 2 + c * 3
      return { ...p, comment_count: c, like_count: l, hotness }
    })

    // 排序
    if (sort === 'newest') enriched.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    else if (sort === 'oldest') enriched.sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    else if (sort === 'top') enriched.sort((a, b) => b.like_count - a.like_count)
    else if (sort === 'hot') enriched.sort((a, b) => b.hotness - a.hotness)

    setPosts(enriched)
    setLoading(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-accent text-2xl">📝 讨论区</h1>
        <Link to="/discussion/new"
          className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90">
          <Plus size={16} /> 发帖
        </Link>
      </div>

      {/* 排序 */}
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {SORT_OPTIONS.map(({ key, label, icon: Icon, order }) => (
          <button key={key} onClick={() => setSort(key)}
            className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs transition-colors',
              sort === key ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
            <Icon size={12} />
            {label}
            {sort === key && (order === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <div className="relative mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索帖子标题…"
          className="w-full bg-surface border border-border rounded-input pl-4 pr-4 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : posts.length === 0 ? (
        <EmptyState icon={MessageSquare} title="还没有帖子" description="成为第一个发起讨论的人吧！"
          action={<Link to="/discussion/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">发布第一篇帖子</Link>} />
      ) : (
        <div className="space-y-3">
          {posts.filter((p) => !search.trim() || p.title.toLowerCase().includes(search.trim().toLowerCase()))
            .map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
