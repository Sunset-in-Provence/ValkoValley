/**
 * 网站访问密码门 — 输入正确密码才能进入
 */
import { useState, useEffect } from 'react'
import { Lock } from 'lucide-react'

const STORAGE_KEY = 'valkovalley-gate-pass'
const SITE_PASSWORD = 'VALKOVALLEY2026' // 可随时修改

export default function SitePassGate({ children }) {
  const [passed, setPassed] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY) === '1'
  })
  const [input, setInput] = useState('')
  const [error, setError] = useState(false)

  function handleSubmit(e) {
    e.preventDefault()
    if (input.trim().toUpperCase() === SITE_PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, '1')
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
