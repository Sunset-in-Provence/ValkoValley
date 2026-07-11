/**
 * 网站访问密码门 — 每周自动轮换密码 + 设备授权检查
 */
import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { getDeviceId } from '@/lib/fingerprint'
import UninvitedPage from '@/pages/UninvitedPage'

const STORAGE_KEY = 'valkovalley-gate-pass'

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
  const start = new Date(now.getFullYear(), 0, 1)
  const weekNum = Math.ceil(((now - start) / 86400000 + start.getDay() + 1) / 7)
  return hashWeek(135792468, weekNum, now.getFullYear())
}

export default function SitePassGate({ children }) {
  const [authorized, setAuthorized] = useState(null) // null=loading
  const [passed, setPassed] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === getWeeklyPassword()
  })
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  useEffect(() => {
    async function check() {
      const deviceId = getDeviceId()
      const { data } = await supabase.from('authorized_devices').select('id').eq('device_id', deviceId).maybeSingle()
      setAuthorized(!!data)
    }
    check()
  }, [])

  if (authorized === null) return null
  if (!authorized) return <UninvitedPage />

  const currentPassword = getWeeklyPassword()

  function handleSubmit(e) {
    e.preventDefault()
    if (input.trim().toUpperCase() === currentPassword) {
      sessionStorage.setItem(STORAGE_KEY, currentPassword)
      setPassed(true)
    } else {
      setError(true)
      setInput('')
    }
  }

  if (passed) return children

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-surface rounded-card shadow-elevated p-8 w-full max-w-sm text-center">
        <Lock size={40} className="text-accent mx-auto mb-4" />
        <h1 className="font-display text-accent text-2xl mb-2">ValkoValley</h1>
        <p className="text-secondary text-sm mb-6">本网站为邀请制私有社区，请输入访问密码</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" value={input}
            onChange={(e) => { setInput(e.target.value); setError(false) }}
            placeholder="输入访问密码" autoFocus
            className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent text-center" />
          {error && <p className="text-danger text-xs">密码错误</p>}
          <button type="submit"
            className="w-full bg-accent text-text-inverse py-2.5 rounded-button font-medium text-sm hover:opacity-90">
            进入
          </button>
        </form>
      </div>
    </div>
  )
}
