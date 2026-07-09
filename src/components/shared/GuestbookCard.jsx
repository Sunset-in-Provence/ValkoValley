/**
 * 首页右下角留言按钮 — 点击弹窗输入，需登录后使用
 */
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { MessageSquare, Send, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function GuestbookCard() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!user) return null

  async function handleSubmit(e) {
    e.preventDefault()
    const trimmed = content.trim()
    if (!trimmed) { toast.error('请输入留言内容'); return }
    if (trimmed.length > 200) { toast.error('留言不能超过 200 字'); return }

    setSubmitting(true)
    const { error } = await supabase.from('guestbook').insert({
      author_id: user.id,
      content: trimmed,
    })
    setSubmitting(false)

    if (error) {
      toast.error('提交失败: ' + error.message)
    } else {
      toast.success('留言已提交，审核通过后将展示')
      setContent('')
      setOpen(false)
    }
  }

  return (
    <>
      {/* 浮动按钮 */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-30 w-12 h-12 bg-accent text-text-inverse rounded-full shadow-elevated flex items-center justify-center hover:opacity-90 transition-all hover:scale-105"
        title="滚动留言板"
      >
        <MessageSquare size={20} />
      </button>

      {/* 弹窗 */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="relative bg-surface rounded-card shadow-elevated p-5 w-full max-w-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="flex items-center gap-1.5 text-accent text-sm font-medium">
                <MessageSquare size={16} /> 滚动留言板
              </h3>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-primary">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="写下你想说的话…审核通过后将展示在首页"
                maxLength={200}
                rows={3}
                className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm placeholder:text-muted resize-none focus:outline-none focus:border-accent"
              />
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs">{content.length}/200</span>
                <button
                  type="submit"
                  disabled={submitting || !content.trim()}
                  className="flex items-center gap-1 bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm hover:opacity-90 disabled:opacity-40 transition-all"
                >
                  <Send size={14} />
                  {submitting ? '提交中' : '发送'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
