import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { getDeviceId } from '@/lib/fingerprint'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

function hashWeek(seed, week, year) {
  let h = seed
  for (let i = 0; i < 20; i++) h = ((h * 1103515245 + (week + year) * 12345) >>> 0) % 2147483647
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 8; i++) { h = ((h * 1103515245 + 12345) >>> 0) % 2147483647; result += chars[h % chars.length] }
  return result
}

function getWeeklyPassword() {
  const now = new Date()
  const d = new Date(now); d.setHours(0,0,0,0); d.setDate(d.getDate()+3-(d.getDay()+6)%7)
  const w1 = new Date(d.getFullYear(),0,4); const w = 1+Math.round(((d-w1)/86400000-3+(w1.getDay()+6)%7)/7)
  return hashWeek(246813579, w, now.getFullYear())
}

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
      // 新设备也存上本周密码标记，跳过密码门
      sessionStorage.setItem('valkovalley-gate-pass', getWeeklyPassword())
      setStatus('success')
      setTimeout(() => navigate('/'), 1500)
    }
    process()
  }, [token, navigate])

  if (status === 'loading') return <div className="min-h-screen bg-primary flex items-center justify-center"><LoadingSpinner size="lg" /></div>
  if (status === 'error') return <div className="min-h-screen bg-primary flex items-center justify-center"><p className="text-danger">授权链接无效或已过期</p></div>
  return <div className="min-h-screen bg-primary flex items-center justify-center"><p className="text-success">设备已授权，正在跳转...</p></div>
}
