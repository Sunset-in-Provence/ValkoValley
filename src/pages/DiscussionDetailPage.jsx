/**
 * 帖子详情页 — 正文 + 楼中楼评论区
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, shadow-card, font-display, font-body,
 *   border-border
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { renderMarkdown } from '@/lib/markdown'
import CommentItem from '@/components/discussion/CommentItem'
import CommentForm from '@/components/discussion/CommentForm'
import ReportButton from '@/components/report/ReportButton'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import toast from 'react-hot-toast'
import {
  ArrowLeft, User, Clock, MessageSquare,
  Edit3, Trash2
} from 'lucide-react'

export default function DiscussionDetailPage() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)

    // 获取帖子
    const { data: postData, error: postError } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('id', id)
      .eq('is_deleted', false)
      .single()

    if (postError || !postData) {
      setPost(null)
      setLoading(false)
      return
    }
    setPost(postData)

    // 获取评论（含作者信息）
    const { data: commentData } = await supabase
      .from('comments')
      .select('*, author:profiles!comments_author_id_fkey(username, display_name, avatar_url)')
      .eq('post_id', id)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true })

    // 为回复型评论找到被回复者的用户名
    const enriched = (commentData || []).map((c) => {
      if (c.reply_to_id) {
        const target = commentData?.find((x) => x.id === c.reply_to_id)
        c.reply_to = target?.author || null
      }
      return c
    })

    setComments(enriched)
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDeletePost() {
    if (!confirm('确定删除此帖子？')) return
    const { error } = await supabase
      .from('posts')
      .update({ is_deleted: true })
      .eq('id', id)
      .eq('author_id', user.id)

    if (error) { toast.error('删除失败') }
    else {
      toast.success('帖子已删除')
      navigate('/discussion')
    }
  }

  // 一级评论（depth=0）
  const topLevelComments = comments.filter((c) => !c.parent_id)

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!post) {
    return (
      <div>
        <Link to="/discussion" className="flex items-center gap-1 text-muted text-sm mb-6 no-underline hover:text-accent">
          <ArrowLeft size={14} /> 返回讨论区
        </Link>
        <EmptyState title="帖子不存在" description="该帖子可能已被删除" />
      </div>
    )
  }

  const isOwn = user?.id === post.author_id

  return (
    <div>
      {/* 返回链接 */}
      <Link to="/discussion" className="flex items-center gap-1 text-muted text-sm mb-4 no-underline hover:text-accent">
        <ArrowLeft size={14} /> 返回讨论区
      </Link>

      {/* ============ 帖子主体 ============ */}
      <article className="bg-surface rounded-card shadow-card mb-6">
        <div className="p-6">
          {/* 标题 */}
          <h1 className="font-display text-accent text-xl mb-4">{post.title}</h1>

          {/* 作者 + 时间 */}
          <div className="flex items-center gap-4 text-xs text-muted mb-4 pb-4 border-b border-border">
            <Link to={`/user/${post.author?.username || 'unknown'}`}
              className="flex items-center gap-1.5 no-underline hover:text-accent">
              <span className="w-6 h-6 rounded-full bg-hover flex items-center justify-center">
                <User size={14} className="text-muted" />
              </span>
              <span>{post.author?.display_name || post.author?.username || '未知'}</span>
            </Link>
            <span className="flex items-center gap-1">
              <Clock size={12} /> {new Date(post.created_at).toLocaleString('zh-CN')}
            </span>
            {post.updated_at && post.updated_at !== post.created_at && (
              <span className="text-muted">(已编辑)</span>
            )}
            <span className="flex items-center gap-1">
              <MessageSquare size={12} /> {comments.length} 条评论
            </span>
          </div>

          {/* 正文 */}
          <div className="prose max-w-none text-secondary font-body text-sm leading-relaxed">
            {renderMarkdown(post.content)}
          </div>

          {/* 操作按钮 */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
            {isOwn && (
              <>
                <button
                  onClick={() => navigate(`/discussion/${id}/edit`)}
                  className="flex items-center gap-1 text-muted text-xs hover:text-accent transition-colors"
                >
                  <Edit3 size={12} /> 编辑
                </button>
                <button
                  onClick={handleDeletePost}
                  className="flex items-center gap-1 text-muted text-xs hover:text-danger transition-colors"
                >
                  <Trash2 size={12} /> 删除
                </button>
              </>
            )}
            {/* 举报按钮 */}
            {!isOwn && (
              <ReportButton targetType="post" targetId={id} className="text-xs" />
            )}
          </div>
        </div>
      </article>

      {/* ============ 评论区 ============ */}
      <section className="bg-surface rounded-card shadow-card p-6">
        <h2 className="font-display text-accent text-lg mb-4">
          评论 ({comments.length})
        </h2>

        {/* 发评表单 */}
        <div className="mb-6 pb-6 border-b border-border">
          <CommentForm
            postId={id}
            onSuccess={fetchData}
          />
        </div>

        {/* 评论列表（楼中楼） */}
        {topLevelComments.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">
            暂无评论，来发表第一条评论吧
          </p>
        ) : (
          <div>
            {topLevelComments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                postId={id}
                allComments={comments}
                onRefresh={fetchData}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
