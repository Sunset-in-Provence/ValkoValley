/**
 * 收藏按钮 — 通用（帖子 / 创作）
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { Bookmark } from 'lucide-react'
import toast from 'react-hot-toast'

export default function BookmarkButton({ targetType, targetId, size = 'md', ownerId, title }) {
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase.from('bookmarks')
      .select('id').eq('user_id', user.id)
      .eq('target_type', targetType).eq('target_id', targetId)
      .maybeSingle()
      .then(({ data }) => setBookmarked(!!data))
  }, [user, targetType, targetId])

  async function toggle() {
    if (!user) { toast.error('请先登录'); return }
    setLoading(true)
    if (bookmarked) {
      const { error } = await supabase.from('bookmarks').delete()
        .eq('user_id', user.id).eq('target_type', targetType).eq('target_id', targetId)
      if (error) toast.error('取消收藏失败')
      else setBookmarked(false)
    } else {
      const { error } = await supabase.from('bookmarks').insert({
        user_id: user.id, target_type: targetType, target_id: targetId,
      })
      if (error) {
        if (error.code === '23505') { setBookmarked(true) } // already bookmarked
        else toast.error('收藏失败')
      } else {
        setBookmarked(true)
        // 通知作者（不是自己收藏自己的）
        if (ownerId && ownerId !== user.id) {
          supabase.rpc('notify_user', {
            _user_id: ownerId,
            _title: '内容被收藏',
            _content: `有人收藏了你的${targetType === 'post' ? '帖子' : '作品'}「${title || ''}」`,
            _link: `/${targetType === 'post' ? 'discussion' : 'creation'}/${targetId}`,
          }).then()
        }
      }
    }
    setLoading(false)
  }

  const iconSize = size === 'lg' ? 18 : 14

  return (
    <button onClick={toggle} disabled={loading}
      className={`flex items-center gap-1 transition-colors ${
        bookmarked ? 'text-warning hover:text-warning/80' : 'text-muted hover:text-warning'
      }`}
      title={bookmarked ? '取消收藏' : '收藏'}>
      <Bookmark size={iconSize} fill={bookmarked ? 'currentColor' : 'none'} />
    </button>
  )
}
