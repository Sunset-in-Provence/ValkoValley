/**
 * 帖子卡片 — 讨论区列表项
 */
import { Link } from 'react-router-dom'
import { MessageSquare, User, Clock } from 'lucide-react'
import LikeButton from '@/components/shared/LikeButton'

export default function PostCard({ post }) {
  const author = post.author || {}
  const commentCount = post.comment_count || 0

  return (
    <div className="bg-surface rounded-card shadow-card p-5 hover:shadow-elevated transition-shadow group">
      <Link to={`/discussion/${post.id}`} className="no-underline" onClick={() => sessionStorage.setItem('scroll-discussion', window.scrollY)}>
        <h3 className="font-display text-accent text-base mb-2 group-hover:underline line-clamp-1">
          {post.title}
        </h3>
        <p className="text-secondary text-sm line-clamp-2 mb-3">
          {post.content?.replace(/[#*`>\[\]()!-]/g, '').slice(0, 150) || '(无内容)'}
        </p>
      </Link>

      <div className="flex items-center gap-4 text-xs text-muted">
        <Link to={`/user/${author.username || 'unknown'}`} className="flex items-center gap-1 no-underline hover:text-accent">
          <User size={12} /> {author.display_name || author.username || '未知用户'}
        </Link>
        <span className="flex items-center gap-1">
          <Clock size={12} /> {new Date(post.created_at).toLocaleDateString('zh-CN')}
        </span>
        <span className="flex items-center gap-1">
          <MessageSquare size={12} /> {commentCount}
        </span>
        <LikeButton targetType="post" targetId={post.id} initialCount={post.like_count || 0} ownerId={post.author_id} />
      </div>
    </div>
  )
}
