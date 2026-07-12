/**
 * 单条举报卡片 — 管理员审核用
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted,
 *   text-success, text-danger, text-warning, text-accent,
 *   rounded-card, rounded-button, shadow-card, border-border
 */
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { Link } from 'react-router-dom'
import { User, Clock, FileText, Palette, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const targetLabels = { post: '帖子', comment: '评论', creation: '创作', user: '用户' }
const targetIcons = { post: MessageSquare, comment: MessageSquare, creation: Palette, user: User }

const statusColors = {
  pending: 'bg-warning/10 text-warning',
  resolved: 'bg-success/10 text-success',
  dismissed: 'bg-hover text-muted',
}

export default function ReportCard({ report, onAction }) {
  const [acting, setActing] = useState(false)
  const Icon = targetIcons[report.target_type] || FileText

  async function handleAction(actionType) {
    if (acting) return
    setActing(true)

    if (actionType === 'delete_content') {
      // 软删除被举报内容
      const tableMap = { post: 'posts', comment: 'comments', creation: 'creations' }
      const table = tableMap[report.target_type]
      if (table) {
        await supabase.from(table).update({ is_deleted: true }).eq('id', report.target_id)
      }
    }

    if (actionType === 'ban_user') {
      const tableMap = { post: 'posts', comment: 'comments', creation: 'creations' }
      const table = tableMap[report.target_type]
      if (table) {
        const { data } = await supabase.from(table).select('author_id').eq('id', report.target_id).single()
        if (data?.author_id) {
          await supabase.from('profiles').update({ is_banned: true, ban_expires_at: null }).eq('id', data.author_id)
        }
      } else if (report.target_type === 'user') {
        await supabase.from('profiles').update({ is_banned: true, ban_expires_at: null }).eq('id', report.target_id)
      }
      toast.success('用户已永久封禁')
    }

    // 更新举报状态
    const { error } = await supabase.from('reports').update({
      status: actionType === 'dismiss' ? 'dismissed' : 'resolved',
      action_taken: actionType,
      reviewer_id: (await supabase.auth.getUser()).data.user?.id,
      resolved_at: new Date().toISOString(),
    }).eq('id', report.id)

    setActing(false)
    if (error) { toast.error('操作失败: ' + error.message) }
    else {
      toast.success(actionType === 'delete_content' ? '内容已删除' : actionType === 'ban_user' ? '用户已封禁' : '举报已驳回')
      if (onAction) onAction()
    }
  }

  return (
    <div className={cn('bg-surface rounded-card border p-4 transition-colors',
      report.status === 'pending' ? 'border-border' : 'border-border'
    )}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-muted" />
          <span className="text-secondary text-xs font-medium">{targetLabels[report.target_type]}</span>
          <span className={cn('px-1.5 py-0.5 rounded-full text-[10px]', statusColors[report.status])}>
            {report.status === 'pending' ? '待处理' : report.status === 'resolved' ? '已处理' : '已驳回'}
          </span>
        </div>
        <span className="text-muted text-xs flex items-center gap-1">
          <Clock size={11} /> {new Date(report.created_at).toLocaleString('zh-CN')}
        </span>
      </div>

      <p className="text-secondary text-sm mb-3">{report.reason}</p>

        <div className="flex items-center gap-2 text-xs text-muted mt-2">
          {report.target_type === 'post' && (
            <Link to={`/discussion/${report.target_id}`} target="_blank" className="text-accent hover:underline">查看被举报内容</Link>
          )}
          {report.target_type === 'creation' && (
            <Link to={`/creation/${report.target_id}`} target="_blank" className="text-accent hover:underline">查看被举报内容</Link>
          )}
        </div>

        {report.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t border-border mt-2">
            <button onClick={() => handleAction('dismiss')} disabled={acting}
              className="text-muted text-xs px-3 py-1.5 rounded-button border border-border hover:bg-hover disabled:opacity-50">
              驳回
            </button>
            <button onClick={() => handleAction('delete_content')} disabled={acting}
              className="text-warning text-xs px-3 py-1.5 rounded-button border border-warning/30 hover:bg-warning/5 disabled:opacity-50">
              删除内容
            </button>
            <button onClick={() => handleAction('ban_user')} disabled={acting}
              className="text-danger text-xs px-3 py-1.5 rounded-button border border-danger/30 hover:bg-danger/5 disabled:opacity-50">
              封禁用户
            </button>
          </div>
        )}
    </div>
  )
}
