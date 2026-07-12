import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { getDeviceId } from '@/lib/fingerprint'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function InviteGoPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function process() {
      const deviceId = getDeviceId()

      // 如果设备已授权，直接跳转
      const { data: existing } = await supabase.from('authorized_devices')
        .select('id').eq('device_id', deviceId).maybeSingle()
      if (existing) { setStatus('success'); setTimeout(() => navigate('/'), 500); return }

      // 校验并扣减邀请链接
      const { data: ok } = await supabase.rpc('use_invite_link', { _token: token })
      if (!ok) { setStatus('error'); return }

      // 授权设备
      await supabase.from('authorized_devices').upsert({ device_id: deviceId, invite_token: token }, { onConflict: 'device_id' })

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
