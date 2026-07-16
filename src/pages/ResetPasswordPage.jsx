import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { Lock, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!password || !confirm) { toast.error('请填写密码'); return }
    if (password !== confirm) { toast.error('两次输入的密码不一致'); return }
    if (password.length < 6) { toast.error('密码至少 6 位'); return }

    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) { toast.error('重置失败: ' + error.message) }
    else {
      setDone(true)
      await supabase.auth.signOut()
      toast.success('密码已重置，请使用新密码登录')
      setTimeout(() => navigate('/login'), 2000)
    }
  }

  if (done) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle size={48} className="text-success mx-auto mb-4" />
          <h1 className="font-display text-accent text-2xl mb-2">密码已重置</h1>
          <p className="text-secondary text-sm">正在跳转到登录页...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-surface rounded-card shadow-elevated p-8 w-full max-w-sm">
        <Lock size={32} className="text-accent mx-auto mb-4" />
        <h1 className="font-display text-accent text-xl text-center mb-6">重设密码</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">新密码</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="至少 6 位" required minLength={6}
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">确认新密码</label>
            <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
              placeholder="再次输入新密码" required minLength={6}
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-accent text-text-inverse py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-50">
            {loading ? '重置中...' : '确认重置'}
          </button>
        </form>
      </div>
    </div>
  )
}
