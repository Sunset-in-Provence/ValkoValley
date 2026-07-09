/**
 * 点赞按钮 — 支持帖子和创作
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LikeButton({ targetType, targetId, initialCount = 0, size = 'sm' }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    async function check() {
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('target_type', targetType)
        .eq('target_id', targetId)
        .maybeSingle()
      setLiked(!!data)
    }
    check()
  }, [user, targetType, targetId])

  async function toggle() {
    if (!user) { toast.error('请先登录'); return }
    setLoading(true)

    if (liked) {
      await supabase.from('likes').delete()
        .eq('user_id', user.id).eq('target_type', targetType).eq('target_id', targetId)
      setCount((c) => c - 1)
      setLiked(false)
    } else {
      const { error } = await supabase.from('likes').insert({ user_id: user.id, target_type, target_id })
      if (!error) {
        setCount((c) => c + 1)
        setLiked(true)
      }
    }
    setLoading(false)
  }

  const iconSize = size === 'lg' ? 18 : 14
  const textSize = size === 'lg' ? 'text-sm' : 'text-xs'

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-1 transition-colors ${textSize} ${
        liked ? 'text-danger' : 'text-muted hover:text-danger'
      }`}
    >
      <Heart size={iconSize} fill={liked ? 'currentColor' : 'none'} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
