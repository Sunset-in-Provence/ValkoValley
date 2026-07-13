import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { getDeviceId } from '@/lib/fingerprint'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

export default function AuthDevicePage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    async function process() {
      const { data } = await supabase.from('device_tokens').select('*').eq('token', token).eq('used', false).gt('expires_at', new Date().toISOString()).maybeSingle()
      if (!data) { setStatus('error'); return }
      const deviceId = getDeviceId()
      await supabase.from('authorized_devices').upsert({ device_id: deviceId, invite_token: 'device-transfer' }, { onConflict: 'device_id' })
      localStorage.setItem('vv-authorized', '1')
      await supabase.from('device_tokens').update({ used: true }).eq('id', data.id)
      setStatus('success')
      setTimeout(() => navigate('/'), 1500)
    }
    process()
  }, [token, navigate])

  if (status === 'loading') return <div className="min-h-screen bg-primary flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (status === 'error') return <div className="min-h-screen bg-primary flex items-center justify-center"><p className="text-danger">授权链接无效或已过期</p></div>
  return <div className="min-h-screen bg-primary flex items-center justify-center"><p className="text-success">设备已授权，正在跳转...</p></div>
}
