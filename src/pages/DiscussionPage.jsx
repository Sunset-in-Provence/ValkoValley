/**
 * 讨论区主页 — 帖子列表 + 排序
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, shadow-card, font-display, border-border
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import PostCard from '@/components/discussion/PostCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { MessageSquare, Plus, Clock, MessageCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { key: 'latest', label: '最新发布', icon: Clock },
  { key: 'comments', label: '最多评论', icon: MessageCircle },
]

export default function DiscussionPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('latest')

  useEffect(() => { fetchPosts() }, [sort])

  async function fetchPosts() {
    setLoading(true)
    // 在 Supabase 中获取帖子及评论数
    let query = supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false)

    if (sort === 'latest') {
      query = query.order('created_at', { ascending: false })
    } else {
      // 按评论数排序：先获取每条帖子的评论数
      const { data, error } = await supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
        .eq('is_deleted', false)

      if (!error && data) {
        // 获取所有帖子的评论数
        const postIds = data.map((p) => p.id)
        const { data: counts } = await supabase
          .from('comments')
          .select('post_id')
          .in('post_id', postIds)
          .eq('is_deleted', false)

        const countMap = {}
        counts?.forEach((c) => { countMap[c.post_id] = (countMap[c.post_id] || 0) + 1 })

        const sorted = data
          .map((p) => ({ ...p, comment_count: countMap[p.id] || 0 }))
          .sort((a, b) => b.comment_count - a.comment_count)

        setPosts(sorted)
      }
      setLoading(false)
      return
    }

    const { data, error } = await query
    if (!error && data) {
      // 获取评论数
      const postIds = data.map((p) => p.id)
      const { data: counts } = await supabase
        .from('comments')
        .select('post_id')
        .in('post_id', postIds)
        .eq('is_deleted', false)

      const countMap = {}
      counts?.forEach((c) => { countMap[c.post_id] = (countMap[c.post_id] || 0) + 1 })
      setPosts(data.map((p) => ({ ...p, comment_count: countMap[p.id] || 0 })))
    }
    setLoading(false)
  }

  return (
    <div>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-accent text-2xl">📝 讨论区</h1>
        <Link
          to="/discussion/new"
          className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90"
        >
          <Plus size={16} /> 发帖
        </Link>
      </div>

      {/* 排序切换 */}
      <div className="flex items-center gap-2 mb-4">
        {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setSort(key)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors',
              sort === key
                ? 'bg-accent text-text-inverse'
                : 'bg-surface text-secondary border border-border hover:bg-hover'
            )}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      {/* 帖子列表 */}
      {loading ? (
        <div className="flex justify-center py-16">
          <LoadingSpinner size="lg" />
        </div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="还没有帖子"
          description="成为第一个发起讨论的人吧！"
          action={
            <Link
              to="/discussion/new"
              className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline"
            >
              发布第一篇帖子
            </Link>
          }
        />
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  )
}
