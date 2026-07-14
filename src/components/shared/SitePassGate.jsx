/**
 * 网站访问密码门 — 每周自动轮换密码 + 设备授权检查
 */
import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const STORAGE_KEY = 'valkovalley-gate-pass'

function hashWeek(seed, week, year) {
  let h = seed
  for (let i = 0; i < 20; i++) h = ((h * 1103515245 + (week + year) * 12345) >>> 0) % 2147483647
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let result = ''
  for (let i = 0; i < 8; i++) { h = ((h * 1103515245 + 12345) >>> 0) % 2147483647; result += chars[h % chars.length] }
  return result
}

function getISOWeek(d) {
  // ISO周：周一为起始，包含1月4日的周为第1周
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7)
  const week1 = new Date(date.getFullYear(), 0, 4)
  return 1 + Math.round(((date - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7)
}

function getWeeklyPassword() {
  const now = new Date()
  return hashWeek(246813579, getISOWeek(now), now.getFullYear())
}

export default function SitePassGate({ children }) {
  const [authorized, setAuthorized] = useState(null) // null=loading
  const [passed, setPassed] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === getWeeklyPassword()
  })
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  // /apply 页面放行，不拦截
  if (window.location.pathname === '/apply') return children

  useEffect(() => {
    // 已经输过密码就跳过检查
    if (passed) { setAuthorized(true); return }

    let timeout = setTimeout(() => setAuthorized(true), 4000) // 4秒兜底

    async function check() {
      try {
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
          setAuthorized(true); setPassed(true); return
        }
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user) { setAuthorized(true); setPassed(true); return }

        const { data: settings } = await supabase.from('site_settings').select('value').eq('key', 'invite_only').maybeSingle()
        const inviteRequired = !settings || settings.value !== 'false'
        if (!inviteRequired || localStorage.getItem('vv-authorized') === '1') {
          localStorage.setItem('vv-authorized', '1')
        }
      } catch {}
      setAuthorized(true)
    }
    check()
    return () => clearTimeout(timeout)
  }, [])

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <p className="text-muted text-sm">加载中...</p>
      </div>
    )
  }

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
