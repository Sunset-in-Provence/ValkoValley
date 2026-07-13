import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { Heart } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LikeButton({ targetType, targetId, initialCount = 0, ownerId }) {
  const { user } = useAuth()
  const [liked, setLiked] = useState(false)
  const [count, setCount] = useState(initialCount)

  useEffect(() => {
    if (!user) return
    async function check() {
      const { data } = await supabase.from('likes').select('id')
        .eq('user_id', user.id).eq('target_type', targetType).eq('target_id', targetId).maybeSingle()
      setLiked(!!data)
    }
    check()
  }, [user, targetType, targetId])

  async function toggle() {
    if (!user) { toast.error('请先登录'); return }
    const { data, error } = await supabase.rpc('toggle_like', { _target_type: targetType, _target_id: targetId })
    if (error) { toast.error('操作失败'); return }
    if (data) {
      setLiked(true); setCount((c) => c + 1)
      // 通知内容作者
      if (ownerId && ownerId !== user.id) {
        supabase.from('notifications').insert({
          user_id: ownerId, type: 'system', title: '新的点赞', content: '有人赞了你的内容',
        }).then()
      }
    }
    else { setLiked(false); setCount((c) => Math.max(0, c - 1)) }
  }

  return (
    <button onClick={toggle} className={`flex items-center gap-1 text-xs transition-colors ${liked ? 'text-danger' : 'text-muted hover:text-danger'}`}>
      <Heart size={14} fill={liked ? 'currentColor' : 'none'} />
      {count > 0 && <span>{count}</span>}
    </button>
  )
}
