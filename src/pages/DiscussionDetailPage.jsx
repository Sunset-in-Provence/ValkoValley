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
import LikeButton from '@/components/shared/LikeButton'
import ImageViewer from '@/components/shared/ImageViewer'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import toast from 'react-hot-toast'
import {
  ArrowLeft, User, Clock, MessageSquare,
  Edit3, Trash2, Pin
} from 'lucide-react'

export default function DiscussionDetailPage() {
  const { id } = useParams()
  const { user, isAdmin, profile } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)

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
    const { data, error } = await supabase.rpc('delete_own_post', { post_id: id })

    if (error) { toast.error('删除失败: ' + error.message) }
    else if (!data) { toast.error('无权限删除此帖子') }
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

  const isOwn = user?.id === post.author_id || isAdmin

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

          {/* 附图 */}
          {post.image_urls?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {post.image_urls.map((url, i) => (
                <img key={i} src={url} alt={`附图 ${i + 1}`}
                  className="max-w-xs max-h-48 object-cover rounded-card cursor-pointer hover:opacity-90" loading="lazy"
                  onClick={() => { setViewerOpen(true); setViewerIndex(i) }} />
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border">
            <LikeButton targetType="post" targetId={id} size="lg" ownerId={post.author_id} title={post.title} />
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
                {isAdmin && (
                  <button onClick={async () => {
                    if (!post.is_pinned) {
                      // 新置顶：先取消所有旧置顶
                      await supabase.from('posts').update({ is_pinned: false }).eq('is_pinned', true)
                    }
                    await supabase.from('posts').update({ is_pinned: !post.is_pinned }).eq('id', id)
                    setPost((p) => ({ ...p, is_pinned: !p.is_pinned }))
                    toast.success(post.is_pinned ? '已取消置顶' : '已置顶（替换旧置顶）')
                  }}
                    className="flex items-center gap-1 text-muted text-xs hover:text-accent transition-colors">
                    <Pin size={12} /> {post.is_pinned ? '取消置顶' : '置顶'}
                  </button>
                )}
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
            onSuccess={() => {
              fetchData()
              if (post.author_id !== user.id) {
                const displayName = profile?.display_name || profile?.username || '用户'
                supabase.rpc('notify_user', { _user_id: post.author_id, _title: '新评论', _content: `${displayName} 评论了你的作品「${post.title}」`, _link: `/discussion/${id}` }).then()
              }
            }}
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
                postAuthorId={post.author_id}
                allComments={comments}
                onRefresh={fetchData}
              />
            ))}
          </div>
        )}
      </section>
      {viewerOpen && post.image_urls?.length > 0 && (
        <ImageViewer images={post.image_urls} current={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onPrev={() => setViewerIndex((i) => (i - 1 + post.image_urls.length) % post.image_urls.length)}
          onNext={() => setViewerIndex((i) => (i + 1) % post.image_urls.length)} />
      )}
    </div>
  )
}
