/**
 * 首页右下角留言按钮 — 普通用户弹窗输入，管理员审核+管理
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { MessageSquare, Send, X, Shield, Check, Trash2, Plus, RefreshCw, AlertTriangle } from 'lucide-react'
import { loadBannedWords, checkBannedWords } from '@/lib/bannedWords'
import toast from 'react-hot-toast'

const PRESETS = [
  '铃兰花开，幸福归来',
  '你除了巧克力还喜欢什么',
  '就算你变成小虫子我也会来找你，我可以把你装在杯子里',
  '不管结局是什么，我都要亲自去看看',
]

export default function GuestbookCard() {
  const { user, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 管理员状态
  const [pending, setPending] = useState([])
  const [approved, setApproved] = useState([])
  const [reportCount, setReportCount] = useState(0)
  const [activeTab, setActiveTab] = useState(isAdmin ? 'review' : 'write')
  const [newText, setNewText] = useState('')

  async function fetchAdmin() {
    const [{ data: p }, { data: a }, { count }] = await Promise.all([
      supabase.from('guestbook').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('guestbook').select('*').eq('status', 'approved').order('created_at', { ascending: false }).limit(50),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    if (p) setPending(p)
    if (a) setApproved(a)
    if (count != null) setReportCount(count)
  }

  useEffect(() => { if (open && isAdmin) fetchAdmin() }, [open, isAdmin])

  const totalBadge = isAdmin ? pending.length + reportCount : null

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) { toast.error('请输入留言内容'); return }
    if (trimmed.length > 200) { toast.error('留言不能超过 200 字'); return }

    const words = await loadBannedWords(supabase)
    const hits = checkBannedWords(trimmed, words)
    if (hits.length > 0) { toast.error(`内容包含违规词：${hits.slice(0, 3).join('、')}`); return }

    setSubmitting(true)
    const { error } = await supabase.from('guestbook').insert({
      author_id: user.id, content: trimmed,
    })
    setSubmitting(false)
    if (error) { toast.error('提交失败: ' + error.message) }
    else { toast.success('留言已提交，审核通过后将展示'); setContent('') }
  }

  async function handleApprove(id, action) {
    const { error } = await supabase.from('guestbook').update({
      status: action, reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) toast.error('操作失败')
    else { toast.success(action === 'approved' ? '已通过' : '已拒绝'); fetchAdmin() }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除？')) return
    const { error } = await supabase.from('guestbook').delete().eq('id', id)
    if (error) toast.error('删除失败')
    else { toast.success('已删除'); fetchAdmin() }
  }

  async function handleAdd() {
    const trimmed = newText.trim()
    if (!trimmed) { toast.error('请输入内容'); return }
    const words = await loadBannedWords(supabase)
    if (checkBannedWords(trimmed, words).length > 0) { toast.error('内容包含违规词'); return }
    const { error } = await supabase.from('guestbook').insert({
      author_id: user.id, content: trimmed, status: 'approved', reviewed_at: new Date().toISOString(),
    })
    if (error) toast.error('添加失败')
    else { toast.success('弹幕已添加'); setNewText(''); fetchAdmin() }
  }

  if (!user) return null

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 bg-accent text-text-inverse rounded-full shadow-elevated flex items-center justify-center hover:opacity-90 transition-all hover:scale-105"
        title="滚动留言板"
      >
        <MessageSquare size={20} />
        {totalBadge && totalBadge > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-text-inverse text-[10px] rounded-full flex items-center justify-center font-bold">
            {totalBadge > 9 ? '9+' : totalBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-surface rounded-card shadow-elevated w-full max-w-md max-h-[85vh] overflow-y-auto">
            {/* 头部 */}
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface z-10">
              <h3 className="flex items-center gap-1.5 text-accent text-sm font-medium">
                <MessageSquare size={16} /> 滚动留言板
              </h3>
              <div className="flex items-center gap-2">
                {isAdmin && (
                  <div className="flex gap-0.5">
                    <button onClick={() => setActiveTab('write')}
                      className={`px-2 py-1 rounded-button text-[11px] ${activeTab === 'write' ? 'bg-accent text-text-inverse' : 'text-muted hover:text-secondary'}`}>
                      写留言
                    </button>
                    <button onClick={() => setActiveTab('review')}
                      className={`px-2 py-1 rounded-button text-[11px] flex items-center gap-0.5 ${activeTab === 'review' ? 'bg-accent text-text-inverse' : 'text-muted hover:text-secondary'}`}>
                      <Shield size={11} /> 审核{pending.length > 0 && `(${pending.length})`}
                    </button>
                    <button onClick={() => setActiveTab('manage')}
                      className={`px-2 py-1 rounded-button text-[11px] ${activeTab === 'manage' ? 'bg-accent text-text-inverse' : 'text-muted hover:text-secondary'}`}>
                      管理
                    </button>
                  </div>
                )}
                <button onClick={() => setOpen(false)} className="text-muted hover:text-primary"><X size={18} /></button>
              </div>
            </div>

            <div className="p-4">
              {/* ===== 写留言（所有用户） ===== */}
              {activeTab === 'write' && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <textarea value={content} onChange={(e) => setContent(e.target.value)}
                    placeholder="写下你想说的话…审核通过后将展示在首页" maxLength={200} rows={3}
                    className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm placeholder:text-muted resize-none focus:outline-none focus:border-accent" />
                  <div className="flex items-center justify-between">
                    <span className="text-muted text-xs">{content.length}/200</span>
                    <button type="submit" disabled={submitting || !content.trim()}
                      className="flex items-center gap-1 bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm hover:opacity-90 disabled:opacity-40">
                      <Send size={14} /> {submitting ? '提交中' : '发送'}
                    </button>
                  </div>
                </form>
              )}

              {/* ===== 审核（管理员） ===== */}
              {activeTab === 'review' && isAdmin && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-secondary text-xs font-medium">待审核留言 ({pending.length})</h4>
                    <button onClick={fetchAdmin} className="text-muted hover:text-accent"><RefreshCw size={12} /></button>
                  </div>
                  {pending.length === 0 ? (
                    <p className="text-muted text-xs text-center py-4">暂无待审核</p>
                  ) : (
                    pending.map((msg) => (
                      <div key={msg.id} className="bg-hover rounded-card p-2.5 flex items-center justify-between">
                        <p className="text-primary text-xs flex-1 mr-2">「{msg.content}」</p>
                        <div className="flex gap-1.5">
                          <button onClick={() => handleApprove(msg.id, 'approved')}
                            className="bg-success/10 text-success text-[11px] px-2 py-0.5 rounded-button"><Check size={11} /> 通过</button>
                          <button onClick={() => handleApprove(msg.id, 'rejected')}
                            className="bg-danger/10 text-danger text-[11px] px-2 py-0.5 rounded-button"><X size={11} /> 拒绝</button>
                        </div>
                      </div>
                    ))
                  )}

                  {reportCount > 0 && (
                    <div className="bg-danger/5 rounded-card p-3 text-center">
                      <p className="text-danger text-xs flex items-center justify-center gap-1">
                        <AlertTriangle size={12} /> {reportCount} 条举报待处理
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* ===== 管理（管理员） ===== */}
              {activeTab === 'manage' && isAdmin && (
                <div className="space-y-3">
                  {/* 添加弹幕 */}
                  <div>
                    <h4 className="text-secondary text-xs font-medium mb-2 flex items-center gap-1">
                      <Plus size={12} /> 添加弹幕
                    </h4>
                    <div className="flex gap-1.5">
                      <input type="text" value={newText} onChange={(e) => setNewText(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
                        placeholder="输入弹幕内容…" maxLength={200}
                        className="flex-1 bg-hover border border-border rounded-input px-2.5 py-1.5 text-primary text-xs placeholder:text-muted focus:outline-none focus:border-accent" />
                      <button onClick={handleAdd}
                        className="bg-accent text-text-inverse px-3 py-1.5 rounded-button text-xs hover:opacity-90">
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>

                  {/* 预设快捷添加 */}
                  <div>
                    <h4 className="text-secondary text-xs font-medium mb-1.5">预设弹幕</h4>
                    <div className="flex flex-wrap gap-1">
                      {PRESETS.map((p) => (
                        <button key={p} onClick={async () => {
                          const words = await loadBannedWords(supabase)
                          if (checkBannedWords(p, words).length > 0) return
                          const { error } = await supabase.from('guestbook').insert({
                            author_id: user.id, content: p, status: 'approved', reviewed_at: new Date().toISOString(),
                          })
                          if (error) toast.error('添加失败')
                          else { toast.success('已添加'); fetchAdmin() }
                        }}
                          className="bg-hover text-secondary text-[11px] px-2 py-1 rounded-full hover:bg-accent/10 hover:text-accent transition-colors">
                          「{p}」
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 已通过列表 */}
                  <div>
                    <h4 className="text-secondary text-xs font-medium mb-2 flex items-center gap-1">
                      <MessageSquare size={12} /> 已通过 ({approved.length})
                    </h4>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {approved.map((msg) => (
                        <div key={msg.id} className="bg-hover rounded-card p-2 flex items-center justify-between">
                          <p className="text-primary text-xs truncate flex-1 mr-2">「{msg.content}」</p>
                          <button onClick={() => handleDelete(msg.id)}
                            className="text-muted hover:text-danger"><Trash2 size={12} /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
