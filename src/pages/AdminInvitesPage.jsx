import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Plus, Shuffle, Copy, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminInvitesPage() {
  const { user } = useAuth()
  const [codes, setCodes] = useState([])
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')

  async function fetch() {
    setLoading(true)
    const [{ data: c }, { data: l }] = await Promise.all([
      supabase.from('invite_codes').select('*').order('created_at', { ascending: false }),
      supabase.from('invite_links').select('*').order('created_at', { ascending: false }),
    ])
    setCodes(c || [])
    setLinks(l || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  // ---- 邀请码 ----
  async function handleCodeGen() {
    const code = newCode.trim().toUpperCase()
    if (!code) { toast.error('请输入邀请码'); return }
    const { error } = await supabase.from('invite_codes').insert({ code, created_by: user.id, max_uses: 1 })
    if (error) { toast.error(error.code === '23505' ? '该码已存在' : '创建失败') }
    else { toast.success('邀请码已生成: ' + code); setNewCode(''); fetch() }
  }

  async function handleCodeRandom() {
    const code = 'VV' + Math.random().toString(36).slice(2, 8).toUpperCase()
    const { error } = await supabase.from('invite_codes').insert({ code, created_by: user.id, max_uses: 1 })
    if (error) toast.error('生成失败')
    else { toast.success('邀请码已生成: ' + code); fetch() }
  }

  async function handleCodeToggle(id, active) {
    await supabase.from('invite_codes').update({ is_active: active }).eq('id', id)
    fetch()
  }

  // ---- 邀请链接 ----
  async function handleLinkGen() {
    const token = Math.random().toString(36).slice(2, 14)
    const { error } = await supabase.from('invite_links').insert({ token, created_by: user.id, max_uses: 1 })
    if (error) toast.error('生成失败')
    else { toast.success('链接已生成'); fetch() }
  }

  function copyLink(token) {
    const url = window.location.origin + '/go/' + token
    navigator.clipboard.writeText(url).then(() => toast.success('链接已复制'))
  }

  async function handleLinkToggle(id, active) {
    await supabase.from('invite_links').update({ is_active: active }).eq('id', id)
    fetch()
  }

  const codeUnused = codes.filter((c) => c.used_count === 0 && c.is_active)
  const linkUnused = links.filter((l) => l.used_count === 0 && l.is_active)

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回管理后台
      </Link>

      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-4">邀请管理</h1>

        {loading ? <LoadingSpinner size="lg" /> : (
          <>
            {/* ===== 邀请链接 ===== */}
            <div className="mb-8 pb-6 border-b border-border">
              <h2 className="text-accent text-sm font-display mb-3 flex items-center gap-1">
                <Link2 size={16} /> 邀请链接（一次性）
              </h2>
              <div className="flex gap-2 mb-4">
                <button onClick={handleLinkGen}
                  className="border border-border text-secondary px-4 py-2 rounded-button text-sm hover:bg-hover flex items-center gap-1">
                  <Shuffle size={14} /> 随机生成链接
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-hover rounded-card p-3 text-center">
                  <p className="text-success text-xl font-display">{linkUnused.length}</p>
                  <p className="text-muted text-xs">未使用</p>
                </div>
                <div className="bg-hover rounded-card p-3 text-center">
                  <p className="text-muted text-xl font-display">{links.length - linkUnused.length}</p>
                  <p className="text-muted text-xs">已用/已禁</p>
                </div>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {links.map((l) => (
                  <div key={l.id} className="border border-border rounded-card p-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-primary text-xs font-mono">{l.token}</span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full',
                        l.used_count >= l.max_uses ? 'bg-danger/10 text-danger' : l.is_active ? 'bg-success/10 text-success' : 'bg-hover text-muted')}>
                        {l.used_count >= l.max_uses ? '已使用' : l.is_active ? '可用' : '已禁用'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => copyLink(l.token)}
                        className="text-accent text-xs hover:underline flex items-center gap-0.5">
                        <Copy size={11} /> 复制
                      </button>
                      <button onClick={() => handleLinkToggle(l.id, !l.is_active)}
                        className={l.is_active ? 'text-warning text-xs hover:underline' : 'text-success text-xs hover:underline'}>
                        {l.is_active ? '禁用' : '启用'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ===== 邀请码 ===== */}
            <div>
              <h2 className="text-accent text-sm font-display mb-3">邀请码（一次性）</h2>
              <div className="flex gap-2 mb-4">
                <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleCodeGen() }}
                  placeholder="输入邀请码" className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
                <button onClick={handleCodeGen} className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 flex items-center gap-1"><Plus size={14} /> 添加</button>
                <button onClick={handleCodeRandom} className="border border-border text-secondary px-4 py-2 rounded-button text-sm hover:bg-hover flex items-center gap-1"><Shuffle size={14} /> 随机</button>
              </div>

              <div className="space-y-1.5">
                {codes.map((c) => (
                  <div key={c.id} className="border border-border rounded-card p-2.5 flex items-center justify-between">
                    <div>
                      <span className="text-primary text-sm font-mono font-bold">{c.code}</span>
                      <span className={cn('ml-2 text-xs px-1.5 py-0.5 rounded-full',
                        c.used_count >= c.max_uses ? 'bg-danger/10 text-danger' : c.is_active ? 'bg-success/10 text-success' : 'bg-hover text-muted')}>
                        {c.used_count >= c.max_uses ? '已使用' : c.is_active ? '可用' : '已禁用'}
                      </span>
                    </div>
                    <button onClick={() => handleCodeToggle(c.id, !c.is_active)}
                      className={c.is_active ? 'text-warning text-xs hover:underline' : 'text-success text-xs hover:underline'}>
                      {c.is_active ? '禁用' : '启用'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
