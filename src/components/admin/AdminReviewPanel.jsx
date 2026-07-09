/**
 * 管理员审核面板 — 直接嵌入页面，不弹窗不隐藏
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Shield, MessageSquare, Check, X, AlertTriangle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminReviewPanel() {
  const [messages, setMessages] = useState([])
  const [reportCount, setReportCount] = useState(0)

  async function fetch() {
    const [{ data: msgs }, { count }] = await Promise.all([
      supabase.from('guestbook').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    if (msgs) setMessages(msgs)
    if (count != null) setReportCount(count)
  }

  useEffect(() => { fetch() }, [])

  async function handleMsg(id, action) {
    const { error } = await supabase.from('guestbook').update({
      status: action, reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) toast.error('操作失败')
    else {
      toast.success(action === 'approved' ? '已通过' : '已拒绝')
      setMessages((prev) => prev.filter((m) => m.id !== id))
    }
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
            <MessageSquare size={14} /> 滚动留言审核 <span className="text-muted">({messages.length} 待审)</span>
          </h3>
          {messages.length === 0 ? (
            <p className="text-muted text-xs py-3">暂无待审核留言</p>
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-hover rounded-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-primary text-sm">「{msg.content}」</p>
                    <p className="text-muted text-[10px] mt-0.5">{new Date(msg.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleMsg(msg.id, 'approved')}
                      className="bg-success/10 text-success text-xs px-3 py-1.5 rounded-button hover:bg-success/20 flex items-center gap-1">
                      <Check size={13} /> 通过
                    </button>
                    <button onClick={() => handleMsg(msg.id, 'rejected')}
                      className="bg-danger/10 text-danger text-xs px-3 py-1.5 rounded-button hover:bg-danger/20 flex items-center gap-1">
                      <X size={13} /> 拒绝
                    </button>
                  </div>
                </div>
              ))}
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
