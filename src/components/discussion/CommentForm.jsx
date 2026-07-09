/**
 * 评论表单 — 发布评论/回复
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, border-border
 */
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { loadBannedWords, checkBannedWords } from '@/lib/bannedWords'
import toast from 'react-hot-toast'

export default function CommentForm({ postId = null, creationId = null, parentId = null, replyToId = null, depth = 0, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim()) return

    const words = await loadBannedWords(supabase)
    const hits = checkBannedWords(content, words)
    if (hits.length > 0) { toast.error(`内容包含违规词：${hits.slice(0, 3).join('、')}`); return }

    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      post_id: postId,
      creation_id: creationId,
      parent_id: parentId,
      reply_to_id: replyToId,
      author_id: user.id,
      content: content.trim(),
      depth,
    })

    setSubmitting(false)
    if (error) {
      toast.error('评论失败: ' + error.message)
    } else {
      toast.success(parentId ? '回复成功' : '评论成功')
      setContent('')
      if (onSuccess) onSuccess()
      if (onCancel) onCancel() // 关闭回复框
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? '写下回复...' : '写下评论...'}
        rows={3}
        className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm resize-none focus:outline-none focus:border-accent"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!content.trim() || submitting}
          className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-xs font-medium hover:opacity-90 disabled:opacity-40"
        >
          {submitting ? '发送中...' : '发送'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-muted text-xs hover:text-secondary"
          >
            取消
          </button>
        )}
      </div>
    </form>
  )
}
