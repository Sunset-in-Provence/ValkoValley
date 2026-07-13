import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Plus, Shuffle, Copy, Flower } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function AdminInvitesPage() {
  const { user } = useAuth()
  const [codes, setCodes] = useState([])
  const [loading, setLoading] = useState(true)
  const [newCode, setNewCode] = useState('')
  const [batchCount, setBatchCount] = useState(5)

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

  async function handleBatch() {
    let added = 0
    for (let i = 0; i < batchCount; i++) {
      const code = 'VV' + Math.random().toString(36).slice(2, 8).toUpperCase()
      const { error } = await supabase.from('invite_codes').insert({ code, created_by: user.id, max_uses: 1 })
      if (!error) added++
    }
    toast.success(`已生成 ${added} 个邀请码`)
    fetch()
  }

  function copyCode(code, id) {
    navigator.clipboard.writeText(code).then(async () => {
      toast.success('已复制: ' + code)
      await supabase.rpc('increment_copy_count', { _id: id })
      fetch()
    })
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

      <div className="bg-surface rounded-card shadow-card p-4 sm:p-6 w-full">
        <h1 className="font-display text-accent text-2xl mb-4">邀请码管理</h1>

        {loading ? <LoadingSpinner size="lg" /> : (
          <>
            {/* 手动生成 */}
            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <input type="text" value={newCode} onChange={(e) => setNewCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleGenerate() }}
                placeholder="输入邀请码" className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
              <div className="flex gap-2">
                <button onClick={handleGenerate} className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 flex items-center gap-1 whitespace-nowrap"><Plus size={14} /> 添加</button>
              </div>
            </div>

            {/* 批量生成 */}
            <div className="flex items-center gap-2 mb-4">
              <span className="text-secondary text-xs whitespace-nowrap">批量生成</span>
              <input type="number" value={batchCount} onChange={(e) => setBatchCount(Math.min(50, Math.max(1, Number(e.target.value))))}
                className="w-16 bg-hover border border-border rounded-input px-2 py-1.5 text-primary text-sm text-center focus:outline-none focus:border-accent" />
              <span className="text-secondary text-xs">个</span>
              <button onClick={handleBatch}
                className="border border-border text-secondary px-4 py-1.5 rounded-button text-sm hover:bg-hover flex items-center gap-1 whitespace-nowrap">
                <Shuffle size={14} /> 随机生成
              </button>
            </div>

            {/* 铃兰兑换记录 */}
            <LilyExchangeLog />

            {/* 统计 */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-hover rounded-card p-3 text-center">
                <p className="text-muted text-xl font-display">{codes.length}</p>
                <p className="text-muted text-[10px]">总数</p>
              </div>
              <div className="bg-hover rounded-card p-3 text-center">
                <p className="text-success text-xl font-display">{unused.length}</p>
                <p className="text-muted text-[10px]">可用</p>
              </div>
              <div className="bg-hover rounded-card p-3 text-center">
                <p className="text-warning text-xl font-display">{codes.length - unused.length}</p>
                <p className="text-muted text-[10px]">已用/已禁</p>
              </div>
            </div>

            {/* 列表 */}
            <div className="space-y-1 max-h-96 overflow-y-auto">
              {codes.map((c) => (
                <div key={c.id} className="border border-border rounded-card p-2.5 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <button onClick={() => copyCode(c.code, c.id)}
                      className="text-primary text-sm font-mono font-bold hover:text-accent flex items-center gap-1">
                      {c.code} <Copy size={12} className="text-muted" />
                      <span className="text-muted text-[10px] ml-1">{(c.copy_count || 0) > 0 ? `复制${c.copy_count}次` : '未复制'}</span>
                    </button>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded-full',
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
          </>
        )}
      </div>
    </div>
  )
}

function LilyExchangeLog() {
  const [items, setItems] = useState([])
  const [show, setShow] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('lily_mailbox').select('*, user:profiles!lily_mailbox_user_id_fkey(display_name, username)').order('created_at', { ascending: false }).limit(50)
      if (!data) { setItems([]); return }
      // 查每个码的使用状态
      const codes = data.map((e) => e.code)
      const { data: ic } = await supabase.rpc('get_invite_code_status', { _codes: codes })
      const statusMap = {}
      ic?.forEach((r) => { statusMap[r.code] = r })
      setItems(data.map((e) => ({ ...e, status: statusMap[e.code] })))
    }
    load()
  }, [])


  return (
    <div className="mb-4">
      <button onClick={() => setShow(!show)} className="text-warning text-sm font-medium flex items-center gap-1 hover:underline">
        <Flower size={14} /> 铃兰兑换记录 ({items.length}) {show ? '收起' : '展开'}
      </button>
      {show && (
        <div className="mt-2 space-y-1 max-h-64 overflow-y-auto">
          {items.length === 0 && <p className="text-muted text-xs py-3 text-center">暂无兑换记录</p>}
          {items.map((e) => (
            <div key={e.id} className="bg-hover rounded-card p-2 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-secondary">{e.user?.display_name || e.user?.username || '用户'}</span>
                <span className="text-primary font-mono font-bold">{e.code}</span>
                <span className="text-muted">{new Date(e.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px]">
                <span className={`px-1.5 py-0.5 rounded-full ${e.status?.used ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'}`}>
                  {e.status?.used ? '已使用' : '未使用'}
                </span>
                {e.status?.used_by_email && <span className="text-muted">使用邮箱：{e.status.used_by_email}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
