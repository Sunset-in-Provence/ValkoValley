/**
 * 通用举报按钮 — 帖子/评论/创作/用户 均可使用
 * UI 变量映射：text-muted, text-warning, rounded-button
 */
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import toast from 'react-hot-toast'
import { AlertTriangle } from 'lucide-react'

const REASON_OPTIONS = [
  '违规内容（含人身攻击/辱骂）',
  '恶意引战/挑衅',
  '侵犯版权/盗用作品',
  '发布他人隐私信息',
  '发布广告/垃圾信息',
  '冒充他人身份',
  '其他违规行为',
]

export default function ReportButton({ targetType, targetId, className = '' }) {
  const { user } = useAuth()
  const [show, setShow] = useState(false)
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit() {
    const finalReason = reason === '其他违规行为' ? customReason : reason
    if (!finalReason.trim()) { toast.error('请填写举报理由'); return }

    setSubmitting(true)
    const { error } = await supabase.from('reports').insert({
      reporter_id: user.id,
      target_type: targetType,
      target_id: targetId,
      reason: finalReason.trim(),
    })

    setSubmitting(false)
    if (error) {
      toast.error('提交失败: ' + error.message)
    } else {
      toast.success('举报已提交，管理员会尽快处理')
      setShow(false)
      setReason('')
      setCustomReason('')
    }
  }

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className={`flex items-center gap-1 text-muted hover:text-warning transition-colors ${className}`}
        title="举报"
      >
        <AlertTriangle size={14} /> 举报
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/60 backdrop-blur-sm" onClick={() => setShow(false)}>
          <div className="bg-surface rounded-card shadow-elevated p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-accent text-lg mb-4">提交举报</h3>

            <div className="space-y-2 mb-4">
              {REASON_OPTIONS.map((r) => (
                <label key={r} className="flex items-center gap-2 text-secondary text-sm cursor-pointer hover:text-accent">
                  <input type="radio" name="reason" value={r} checked={reason === r}
                    onChange={(e) => setReason(e.target.value)} className="accent-accent" />
                  {r}
                </label>
              ))}
            </div>

            {reason === '其他违规行为' && (
              <textarea
                value={customReason} onChange={(e) => setCustomReason(e.target.value)}
                placeholder="请详细描述违规行为..." rows={3} required
                className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm resize-none focus:outline-none focus:border-accent mb-4"
              />
            )}

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShow(false)}
                className="border border-border text-secondary px-4 py-2 rounded-button text-sm hover:bg-hover">
                取消
              </button>
              <button onClick={handleSubmit} disabled={!reason || submitting}
                className="bg-danger text-text-inverse px-4 py-2 rounded-button text-sm font-medium hover:opacity-90 disabled:opacity-40">
                {submitting ? '提交中...' : '确认举报'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
