import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Plus, Shuffle } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminInvitesPage() {
  const { user } = useAuth()
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('invite_codes').select('*').order('created_at', { ascending: false })
    setCodes(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function handleGenerate() {
    const code = newCode.trim().toUpperCase()
    if (!code) { toast.error('请输入邀请码'); return }
    const { error } = await supabase.from('invite_codes').insert({ code, created_by: user.id, max_uses: 1 })
    if (error) { toast.error(error.code === '23505' ? '该码已存在' : '创建失败') }
    else { toast.success('邀请码已生成: ' + code); setNewCode(''); fetch() }
  }

  async function handleRandom() {
    const code = 'VV' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabase.from('invite_codes').insert({ code, created_by: user.id, max_uses: 1 })
    if (error) toast.error('生成失败')
    else { toast.success('邀请码已生成: ' + code); fetch() }
  }

  async function handleToggle(id, active) {
    await supabase.from('invite_codes').update({ is_active: active }).eq('id', id)
    fetch()
  }

  const unused = codes.filter((c) => c.used_count === 0 && c.is_active)

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回管理后台
      </Link>

      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-4">邀请码管理</h1>

        <div className="flex gap-2 mb-4">
          <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate() }}
            placeholder="输入邀请码" className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
          <button onClick={handleGenerate} className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 flex items-center gap-1"><Plus size={14} /> 添加</button>
          <button onClick={handleRandom} className="border border-border text-secondary px-4 py-2 rounded-button text-sm hover:bg-hover flex items-center gap-1"><Shuffle size={14} /> 随机</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-hover rounded-card p-4 text-center">
            <p className="text-muted text-2xl font-display">{codes.length}</p>
            <p className="text-muted text-xs mt-1">总数</p>
          </div>
          <div className="bg-hover rounded-card p-4 text-center">
            <p className="text-success text-2xl font-display">{unused.length}</p>
            <p className="text-muted text-xs mt-1">可用</p>
          </div>
          <div className="bg-hover rounded-card p-4 text-center">
            <p className="text-warning text-2xl font-display">{codes.length - unused.length}</p>
            <p className="text-muted text-xs mt-1">已用/已禁</p>
          </div>
        </div>

        {loading ? <LoadingSpinner size="lg" /> : (
          <div className="space-y-2">
            {codes.map((c) => (
              <div key={c.id} className="border border-border rounded-card p-3 flex items-center justify-between">
                <div>
                  <span className="text-primary text-sm font-mono font-bold">{c.code}</span>
                  <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded-full',
                    c.used_count >= c.max_uses ? 'bg-danger/10 text-danger' : c.is_active ? 'bg-success/10 text-success' : 'bg-hover text-muted')}>
                    {c.used_count >= c.max_uses ? '已使用' : c.is_active ? '可用' : '已禁用'}
                  </span>
                </div>
                <button onClick={() => handleToggle(c.id, !c.is_active)}
                  className={c.is_active ? 'text-warning text-xs hover:underline' : 'text-success text-xs hover:underline'}>
                  {c.is_active ? '禁用' : '启用'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
