/**
 * 帖子卡片 — 讨论区列表项
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, shadow-card, font-display, border-border
 */
import { Link } from 'react-router-dom'
import { MessageSquare, User, Clock } from 'lucide-react'

export default function PostCard({ post }) {
  const author = post.author || {}
  const commentCount = post.comment_count || 0

  return (
    <Link
      to={`/discussion/${post.id}`}
      className="block bg-surface rounded-card shadow-card p-5 no-underline hover:shadow-elevated transition-shadow group"
    >
      {/* 标题 */}
      <h3 className="font-display text-accent text-base mb-2 group-hover:underline line-clamp-1">
        {post.title}
      </h3>

      {/* 内容预览（纯文本截取） */}
      <p className="text-secondary text-sm line-clamp-2 mb-3">
        {post.content?.replace(/[#*`>\[\]()!-]/g, '').slice(0, 150) || '(无内容)'}
      </p>

      {/* 元信息 */}
      <div className="flex items-center gap-4 text-xs text-muted">
        <span className="flex items-center gap-1">
          <User size={12} />
          {author.display_name || author.username || '未知用户'}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {new Date(post.created_at).toLocaleDateString('zh-CN')}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} />
          {commentCount} 条评论
        </span>
      </div>
    </Link>
  )
}
