/**
 * 邀请链接落地页 /go/:token
 * 记录设备 → 授权 → 跳转首页
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { getDeviceId } from '@/lib/fingerprint'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function InviteGoPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    async function process() {
      // 验证邀请链接
      const { data: link } = await supabase.from('invite_links')
        .select('*').eq('token', token).eq('is_active', true).maybeSingle()

      if (!link || link.used_count >= link.max_uses) {
        setStatus('error')
        return
      }

      // 授权设备
      const deviceId = getDeviceId()
      await supabase.from('authorized_devices').upsert({ device_id: deviceId, invite_token: token }, { onConflict: 'device_id' })

      // 扣减使用次数（RPC绕过RLS）
      await supabase.rpc('use_invite_link', { _token: token })

      setStatus('success')
      setTimeout(() => navigate('/'), 1500)
    }
    process()
  }, [token, navigate])

  if (status === 'loading') {
    return <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center"><LoadingSpinner size="lg" /><p className="text-muted text-sm mt-4">验证邀请中...</p></div>
    </div>
  }

  if (status === 'error') {
    return <div className="min-h-screen bg-primary flex items-center justify-center">
      <p className="text-danger text-lg">邀请链接无效或已过期</p>
    </div>
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center">
      <div className="text-center">
        <p className="text-success text-lg mb-2">邀请验证成功！</p>
        <p className="text-muted text-sm">正在跳转...</p>
      </div>
    </div>
  )
}
