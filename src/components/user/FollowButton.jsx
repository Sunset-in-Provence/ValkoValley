import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import toast from 'react-hot-toast'

export default function FollowButton({ targetUserId, targetUserName }) {
  const { user, profile } = useAuth()
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data: f }, { count }] = await Promise.all([
        supabase.from('follows').select('*').eq('follower_id', user.id).eq('following_id', targetUserId).maybeSingle(),
        supabase.from('follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId),
      ])
      setFollowing(!!f)
      setFollowerCount(count || 0)
    }
    load()
  }, [user, targetUserId])

  async function toggle() {
    if (!user) return
    if (following) {
      await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId)
      setFollowing(false)
      setFollowerCount((c) => c - 1)
    } else {
      const { error } = await supabase.from('follows').insert({ follower_id: user.id, following_id: targetUserId })
      if (error) { toast.error('操作失败'); return }
      setFollowing(true)
      setFollowerCount((c) => c + 1)
      supabase.rpc('notify_user', { _user_id: targetUserId, _title: '新关注', _content: `${profile?.display_name || '用户'} 关注了你`, _link: null }).then()
    }
  }

  return (
    <button onClick={toggle}
      className={`text-xs ${following ? 'text-muted' : 'text-accent'} hover:underline shrink-0`}>
      {following ? '已关注' : '+ 关注'} {followerCount > 0 && <span className="text-muted">{followerCount}</span>}
    </button>
  )
}
