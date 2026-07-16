/**
 * 用户帖子列表 Tab
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, shadow-card
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import PostCard from '@/components/discussion/PostCard'
import EmptyState from '@/components/shared/EmptyState'
import { MessageSquare } from 'lucide-react'

export default function UserPostsTab({ userId }) {
  const { user, isAdmin } = useAuth()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      let query = supabase
        .from('posts')
        .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
        .eq('author_id', userId).eq('is_deleted', false)
      // 本人或管理员可以看到被隐藏的帖子
      if (user?.id !== userId && !isAdmin) query = query.neq('hidden', true)
      const { data } = await query.order('created_at', { ascending: false })

      if (data) {
        // 获取评论数
        const postIds = data.map((p) => p.id)
        const { data: counts } = await supabase
          .from('comments')
          .select('post_id').in('post_id', postIds).eq('is_deleted', false)
        const countMap = {}; const likeMap = {}
        counts?.forEach((c) => { countMap[c.post_id] = (countMap[c.post_id] || 0) + 1 })
        const { data: likes } = await supabase.from('likes').select('target_id').eq('target_type', 'post').in('target_id', postIds)
        likes?.forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })
        setPosts(data.map((p) => ({ ...p, comment_count: countMap[p.id] || 0, like_count: likeMap[p.id] || 0 })))
      }
      setLoading(false)
    }
    fetch()
  }, [userId])

  if (loading) return null // handled by parent
  if (posts.length === 0) {
    return <EmptyState icon={MessageSquare} title="暂无帖子" description="该用户还没有发布过讨论帖" />
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => <PostCard key={post.id} post={post} />)}
    </div>
  )
}
