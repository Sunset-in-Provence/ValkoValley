/**
 * 管理员审核面板 — 审核 + 直接管理弹幕留言
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { Shield, MessageSquare, Check, X, AlertTriangle, RefreshCw, Trash2, Plus } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminReviewPanel() {
  const { user } = useAuth()
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [reportCount, setReportCount] = useState(0)
  const [newText, setNewText] = useState('')
  const [showManage, setShowManage] = useState(false)

  async function fetch() {
    const [{ data: p }, { data: a }, { count }] = await Promise.all([
      supabase.from('guestbook').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('guestbook').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(50),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    if (p) setPending(p)
    if (a) setApproved(a)
    if (count != null) setReportCount(count)
  }

  useEffect(() => { fetch() }, [])

  async function handleApprove(id, action) {
    const { error } = await supabase.from('guestbook').update({
      status: action, reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) toast.error('操作失败')
    else {
      toast.success(action === 'approved' ? '已通过' : '已拒绝')
      fetch()
    }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除这条弹幕？')) return
    const { error } = await supabase.from('guestbook').delete().eq('id', id)
    if (error) toast.error('删除失败: ' + error.message)
    else { toast.success('已删除'); fetch() }
  }

  async function handleAdd() {
    const trimmed = newText.trim()
    if (!trimmed) { toast.error('请输入内容'); return }
    if (trimmed.length > 200) { toast.error('不能超过 200 字'); return }
    const { error } = await supabase.from('guestbook').insert({
      author_id: user.id,
      content: trimmed,
      status: 'approved',
      reviewed_at: new Date().toISOString(),
    })
    if (error) toast.error('添加失败: ' + error.message)
    else { toast.success('弹幕已添加'); setNewText(''); fetch() }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mb-8">
      <div className="bg-surface rounded-card shadow-card p-5 border-2 border-warning/30">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-warning font-display text-lg">
            <Shield size={20} /> 管理员审核面板
          </h2>
          <button onClick={fetch} className="flex items-center gap-1 text-muted text-xs hover:text-accent">
            <RefreshCw size={12} /> 刷新
          </button>
        </div>

        {/* 留言审核 */}
        <div className="mb-4">
          <h3 className="text-secondary text-sm font-medium mb-2 flex items-center gap-1">
            <MessageSquare size={14} /> 留言审核 <span className="text-muted">({pending.length} 待审)</span>
          </h3>
          {pending.length === 0 ? (
            <p className="text-muted text-xs py-3">暂无待审核留言</p>
          ) : (
            <div className="space-y-2">
              {pending.map((msg) => (
                <div key={msg.id} className="bg-hover rounded-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-primary text-sm">「{msg.content}」</p>
                    <p className="text-muted text-[10px] mt-0.5">{new Date(msg.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApprove(msg.id, 'approved')}
                      className="bg-success/10 text-success text-xs px-3 py-1.5 rounded-button hover:bg-success/20 flex items-center gap-1">
                      <Check size={13} /> 通过
                    </button>
                    <button onClick={() => handleApprove(msg.id, 'rejected')}
                      className="bg-danger/10 text-danger text-xs px-3 py-1.5 rounded-button hover:bg-danger/20 flex items-center gap-1">
                      <X size={13} /> 拒绝
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 直接添加弹幕 */}
        <div className="mb-4 pb-4 border-b border-border">
          <h3 className="text-secondary text-sm font-medium mb-2 flex items-center gap-1">
            <Plus size={14} /> 直接添加弹幕
          </h3>
          <div className="flex gap-2">
            <input
              type="text" value={newText} onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
              placeholder="输入弹幕内容，回车添加…" maxLength={200}
              className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent"
            />
            <button onClick={handleAdd}
              className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 flex items-center gap-1">
              <Plus size={14} /> 添加
            </button>
          </div>
        </div>

        {/* 已通过弹幕管理 */}
        <div className="mb-4">
          <button onClick={() => setShowManage(!showManage)}
            className="text-secondary text-sm font-medium flex items-center gap-1 hover:text-accent">
            <MessageSquare size={14} /> 已通过弹幕管理 ({approved.length})
            <span className="text-muted text-xs ml-1">{showManage ? '▲' : '▼'}</span>
          </button>
          {showManage && (
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {approved.length === 0 ? (
                <p className="text-muted text-xs py-2">暂无已通过弹幕</p>
              ) : (
                approved.map((msg) => (
                  <div key={msg.id} className="bg-hover rounded-card p-2.5 flex items-center justify-between">
                    <p className="text-primary text-sm truncate flex-1 mr-2">「{msg.content}」</p>
                    <button onClick={() => handleDelete(msg.id)}
                      className="text-muted hover:text-danger flex items-center gap-1 text-xs shrink-0">
                      <Trash2 size={12} /> 删除
                    </button>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* 举报 */}
        <div>
          <h3 className="text-secondary text-sm font-medium mb-2 flex items-center gap-1">
            <AlertTriangle size={14} /> 举报审核
          </h3>
          <p className="text-muted text-xs">
            {reportCount === 0 ? '暂无待处理举报' : `📋 ${reportCount} 条举报待处理`}
          </p>
        </div>
      </div>
    </div>
  )
}
