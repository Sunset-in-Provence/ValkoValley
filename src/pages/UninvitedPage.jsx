import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { getDeviceId } from '@/lib/fingerprint'
import toast from 'react-hot-toast'

function hashWeek(seed, week, year) {
  let h = seed
  for (let i = 0; i < 20; i++) h = ((h * 1103515245 + (week + year) * 12345) >>> 0) % 2147483647
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let r = ''
  for (let i = 0; i < 8; i++) { h = ((h * 1103515245 + 12345) >>> 0) % 2147483647; r += chars[h % chars.length] }
  return r
}

function getWeeklyPassword() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
  return hashWeek(135792468, weekNum, now.getFullYear())
}

export default function UninvitedPage() {
  const [secret, setSecret] = useState('')
  const [showSecret, setShowSecret] = useState(false)

  async function handleSecret(e) {
    e.preventDefault()
    if (secret.trim().toUpperCase() === getWeeklyPassword() + 'ADMIN') {
      const deviceId = getDeviceId()
      await supabase.from('authorized_devices').upsert({ device_id: deviceId, invite_token: 'admin-self' }, { onConflict: 'device_id' })
      toast.success('设备已授权，刷新页面进入')
      window.location.reload()
    } else {
      toast.error('密钥错误')
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl mb-6 select-none" style={{ fontSize: 120, lineHeight: 1 }}>
          🤣
        </div>
        <p className="text-muted text-lg">这里什么都没有哦</p>
        <p className="text-muted text-xs mt-8 opacity-30 cursor-default select-none"
          onDoubleClick={() => setShowSecret(!showSecret)}>
          {showSecret ? '👇' : '　'}
        </p>
        {showSecret && (
          <form onSubmit={handleSecret} className="mt-2 flex gap-2 justify-center">
            <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)}
              placeholder="管理员密钥" autoFocus
              className="bg-hover border border-border rounded-input px-3 py-1.5 text-primary text-xs focus:outline-none focus:border-accent" />
            <button type="submit"
              className="bg-accent text-text-inverse px-3 py-1.5 rounded-button text-xs hover:opacity-90">
              授权设备
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
