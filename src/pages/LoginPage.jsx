/**
 * 登录页面
 * UI 变量映射：bg-primary, bg-surface, bg-hover,
 *   text-primary, text-secondary, text-accent, text-muted,
 *   rounded-card, rounded-button, rounded-input, shadow-elevated,
 *   border-border, font-display
 */
import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  const from = location.state?.from || '/discussion'

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !password) {
      toast.error('请填写邮箱和密码')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (error) {
      if (error.message.includes('Invalid login')) {
        toast.error('邮箱或密码错误')
      } else {
        toast.error(error.message)
      }
    } else {
      toast.success('登录成功！欢迎回来 🎉')
      navigate(from, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-surface rounded-card shadow-elevated p-8">
          <div className="text-center mb-6">
            <LogIn size={28} className="text-accent mx-auto mb-2" />
            <h1 className="font-display text-accent text-2xl">登录 ValkoValley</h1>
            <p className="text-muted text-sm mt-1">狼和铃兰的幸福归来</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-secondary text-sm font-medium mb-1 block">邮箱</label>
              <input
                type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com" required
                className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <div>
              <label className="text-secondary text-sm font-medium mb-1 block">密码</label>
              <input
                type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码" required
                className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-accent text-text-inverse rounded-button py-2.5 font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="flex items-center justify-between mt-4 text-xs">
            <Link to="/register" className="text-accent no-underline hover:underline">
              还没有账号？立即注册
            </Link>
            <button onClick={async () => {
              if (!email.trim()) { toast.error('请先输入邮箱'); return }
              const { error } = await supabase.auth.resetPasswordForEmail(email.trim())
              if (error) toast.error(error.message)
              else toast.success('重置邮件已发送，请查看邮箱')
            }} className="text-muted hover:text-accent no-underline">
              忘记密码？
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
