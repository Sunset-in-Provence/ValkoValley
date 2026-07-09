/**
 * 评论项组件 — 支持楼中楼（最深 3 层）
 *
 * 嵌套结构：
 *   depth=0: 一级评论（直接回复帖子）
 *   depth=1: 二级评论（回复一级评论）
 *   depth=2: 三级评论（回复二级评论，最深）
 *
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   text-danger, rounded-card, rounded-button, border-border, font-body
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { sanitizeText } from '@/lib/sanitize'
import CommentForm from './CommentForm'
import toast from 'react-hot-toast'
import { User, Clock, Reply, Trash2 } from 'lucide-react'

const MAX_DEPTH = 2 // 最深 3 层 (0, 1, 2)

export default function CommentItem({ comment, postId, allComments = [], onRefresh }) {
  const { user } = useAuth()
  const [showReply, setShowReply] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const isOwn = user?.id === comment.author_id
  const author = comment.author || {}
  const canReply = comment.depth < MAX_DEPTH

  // 找到所有回复本评论的子评论
  const childComments = allComments.filter((c) => c.parent_id === comment.id && !c.is_deleted)

  async function handleDelete() {
    if (!confirm('确定删除这条评论？')) return
    const { error } = await supabase
      .from('comments')
      .update({ is_deleted: true })
      .eq('id', comment.id)
      .eq('author_id', user.id)

    if (error) { toast.error('删除失败') }
    else {
      toast.success('评论已删除')
      if (onRefresh) onRefresh()
    }
  }

  const indentClass = comment.depth === 0
    ? ''
    : comment.depth === 1
      ? 'ml-8 border-l-2 border-border pl-4'
      : 'ml-16 border-l-2 border-border pl-4'

  return (
    <div className={indentClass}>
      <div className="py-3">
        {/* 评论者信息 */}
        <div className="flex items-center gap-2 mb-1.5">
          <Link
            to={`/user/${author.username || 'unknown'}`}
            className="flex items-center gap-1.5 no-underline hover:underline"
          >
            <span className="w-5 h-5 rounded-full bg-hover flex items-center justify-center">
              <User size={12} className="text-muted" />
            </span>
            <span className="text-secondary text-xs font-medium">
              {author.display_name || author.username || '未知用户'}
            </span>
          </Link>
          <span className="text-muted text-xs">
            <Clock size={10} className="inline mr-0.5" />
            {new Date(comment.created_at).toLocaleDateString('zh-CN')}
          </span>
          {comment.depth > 0 && comment.reply_to && (
            <span className="text-muted text-xs">
              回复 @{comment.reply_to.username || '用户'}
            </span>
          )}
        </div>

        {/* 评论内容 */}
        <div className="text-secondary text-sm font-body leading-relaxed">
          {sanitizeText(comment.content)}
        </div>

        {/* 操作栏 */}
        <div className="flex items-center gap-3 mt-2">
          {canReply && (
            <button
              onClick={() => setShowReply(!showReply)}
              className="flex items-center gap-1 text-muted text-xs hover:text-accent transition-colors"
            >
              <Reply size={12} />
              回复
            </button>
          )}
          {isOwn && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-muted text-xs hover:text-danger transition-colors"
            >
              <Trash2 size={12} />
              删除
            </button>
          )}
          {childComments.length > 0 && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="text-muted text-xs hover:text-secondary transition-colors"
            >
              {collapsed ? `展开 ${childComments.length} 条回复` : '折叠回复'}
            </button>
          )}
        </div>

        {/* 回复表单 */}
        {showReply && (
          <div className="mt-3">
            <CommentForm
              postId={postId}
              parentId={comment.depth === 0 ? comment.id : (comment.parent_id || comment.id)}
              replyToId={comment.id}
              depth={Math.min(comment.depth + 1, MAX_DEPTH)}
              onSuccess={() => { setShowReply(false); if (onRefresh) onRefresh() }}
              onCancel={() => setShowReply(false)}
            />
          </div>
        )}
      </div>

      {/* 子评论（递归渲染） */}
      {!collapsed && childComments.length > 0 && (
        <div>
          {childComments.map((child) => (
            <CommentItem
              key={child.id}
              comment={child}
              postId={postId}
              allComments={allComments}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  )
}
