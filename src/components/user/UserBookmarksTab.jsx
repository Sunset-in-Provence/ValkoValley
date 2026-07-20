/**
 * 用户收藏 Tab — 公开/私有双模式
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import PostCard from '@/components/discussion/PostCard'
import CreationCard from '@/components/creation/CreationCard'
import EmptyState from '@/components/shared/EmptyState'
import { Bookmark } from 'lucide-react'

export default function UserBookmarksTab({ userId, isOwn }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetch() {
      const { data } = await supabase.from('bookmarks')
        .select('target_type, target_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (!data || data.length === 0) { setItems([]); setLoading(false); return }

      const postIds = data.filter((b) => b.target_type === 'post').map((b) => b.target_id)
      const creationIds = data.filter((b) => b.target_type === 'creation').map((b) => b.target_id)

      const [postsRes, creationsRes] = await Promise.all([
        postIds.length > 0 ? supabase.from('posts')
          .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
          .in('id', postIds).eq('is_deleted', false) : { data: [] },
        creationIds.length > 0 ? supabase.from('creations')
          .select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)')
          .in('id', creationIds).eq('is_deleted', false) : { data: [] },
      ])

      const merged = [
        ...(postsRes.data || []).map((p) => ({ ...p, _type: 'post' })),
        ...(creationsRes.data || []).map((c) => ({ ...c, _type: 'creation' })),
      ]
      // 按收藏时间排序
      const timeMap = {}
      data.forEach((b) => { timeMap[`${b.target_type}:${b.target_id}`] = b.created_at })
      merged.sort((a, b) => new Date(timeMap[`${b._type}:${b.id}`]) - new Date(timeMap[`${a._type}:${a.id}`]) || 0)

      setItems(merged)
      setLoading(false)
    }
    fetch()
  }, [userId])

  if (loading) return null
  if (items.length === 0) {
    return <EmptyState icon={Bookmark} title={isOwn ? '还没有收藏' : '该用户暂无公开收藏'} description={isOwn ? '在帖子和作品中点击收藏按钮即可' : ''} />
  }

  return (
    <div className="space-y-3">
      {items.map((item) =>
        item._type === 'post'
          ? <PostCard key={`p-${item.id}`} post={item} />
          : <CreationCard key={`c-${item.id}`} creation={item} />
      )}
    </div>
  )
}
