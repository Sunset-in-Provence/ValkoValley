/**
 * 讨论区主页 — 帖子列表 + 排序 + 搜索
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import PostCard from '@/components/discussion/PostCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { MessageSquare, Plus, Clock, Flame, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function DiscussionPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('time')  // 'time' | 'hot'
  const [timeOrder, setTimeOrder] = useState('desc') // 'desc' | 'asc'
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchPosts()
    const y = sessionStorage.getItem('scroll-discussion')
    if (y) { setTimeout(() => window.scrollTo(0, parseInt(y)), 100); sessionStorage.removeItem('scroll-discussion') }
  }, [sort, timeOrder])

  async function fetchPosts() {
    setLoading(true)
    const { data, error } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false)

    if (error || !data) { setLoading(false); return }

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
      const age = Math.max((Date.now() - new Date(p.created_at).getTime()) / 3600000, 0.1) // hours
      const hotness = (l + c) / age
      return { ...p, comment_count: c, like_count: l, hotness }
    })

    if (sort === 'time') {
      enriched.sort((a, b) => timeOrder === 'desc'
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at))
    } else {
      enriched.sort((a, b) => b.hotness - a.hotness)
    }

    setPosts(enriched)
    setLoading(false)
  }

  function handleTimeClick() {
    if (sort === 'time') {
      setTimeOrder((prev) => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSort('time')
      setTimeOrder('desc')
    }
  }

  const filtered = posts.filter((p) =>
    !search.trim() || p.title.toLowerCase().includes(search.trim().toLowerCase())
  )

  return (
    <div>
      <div className="sticky top-14 z-30 bg-primary/95 backdrop-blur-sm pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-accent text-2xl">讨论区</h1>
          <Link to="/discussion/new"
            className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90 whitespace-nowrap">
            <Plus size={16} /> 发帖
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={handleTimeClick}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors',
              sort === 'time' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
            <Clock size={12} /> 按时间排序
            {sort === 'time' && (timeOrder === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}
          </button>
          <button onClick={() => setSort('hot')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors',
              sort === 'hot' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
            <Flame size={12} /> 按热度排序
          </button>
        </div>
        {/* 搜索 */}
        <div className="relative">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索帖子标题…"
            className="w-full bg-surface border border-border rounded-input pl-4 pr-4 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={MessageSquare} title={search ? '未找到匹配的帖子' : '还没有帖子'}
          description={search ? '' : '成为第一个发起讨论的人吧！'}
          action={!search && <Link to="/discussion/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">发布第一篇帖子</Link>} />
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => <PostCard key={post.id} post={post} />)}
        </div>
      )}
    </div>
  )
}
