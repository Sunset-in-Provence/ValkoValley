/**
 * 创作详情页 — 展示作品 + 评论区 + 点赞
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { renderMarkdown } from '@/lib/markdown'
import VideoEmbed from '@/components/creation/VideoEmbed'
import CommentItem from '@/components/discussion/CommentItem'
import CommentForm from '@/components/discussion/CommentForm'
import LikeButton from '@/components/shared/LikeButton'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import toast from 'react-hot-toast'
import ReportButton from '@/components/report/ReportButton'
import { ArrowLeft, User, Clock, Eye, Edit3, Trash2, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

const contentTypeLabels = { text: '📝 文', image: '🖼️ 图', video: '🎬 视频' }
const contentTypeColors = {
  text: 'bg-info/10 text-info',
  image: 'bg-success/10 text-success',
  video: 'bg-warning/10 text-warning',
}

export default function CreationDetailPage() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [creation, setCreation] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('creations')
      .select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)')
      .eq('id', id).eq('is_deleted', false).single()
    setCreation(data || null)

    if (data) {
      // 增加阅读量
      supabase.from('creations').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id).then()
      // 加载评论
      const { data: commentData } = await supabase
        .from('comments')
        .select('*, author:profiles!comments_author_id_fkey(username, display_name, avatar_url)')
        .eq('creation_id', id)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
      if (commentData) {
        const enriched = commentData.map((c) => {
          if (c.reply_to_id) {
            const target = commentData.find((x) => x.id === c.reply_to_id)
            c.reply_to = target?.author || null
          }
          return c
        })
        setComments(enriched)
      }
    }
    setLoading(false)
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    if (!confirm('确定删除此创作？')) return
    const { data, error } = await supabase.rpc('delete_own_creation', { creation_id: id })
    if (error) { toast.error('删除失败: ' + error.message) }
    else if (!data) { toast.error('无权限删除此创作') }
    else { toast.success('创作已删除'); navigate('/creation') }
  }

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
  }

  if (!creation) {
    return (
      <div>
        <Link to="/creation" className="flex items-center gap-1 text-muted text-sm mb-6 no-underline hover:text-accent">
          <ArrowLeft size={14} /> 返回创作区
        </Link>
        <EmptyState title="创作不存在" description="该作品可能已被删除" />
      </div>
    )
  }

  const isOwn = user?.id === creation.author_id || isAdmin
  const typeTag = creation.tags?.find((t) => ['原创', '二创'].includes(t))
  const customTags = creation.tags?.filter((t) => !['原创', '二创'].includes(t)) || []
  const topLevelComments = comments.filter((c) => !c.parent_id)

  return (
    <div>
      <Link to="/creation" className="flex items-center gap-1 text-muted text-sm mb-4 no-underline hover:text-accent">
        <ArrowLeft size={14} /> 返回创作区
      </Link>

      <article className="bg-surface rounded-card shadow-card mb-6">
        <div className="p-6 md:p-8">
          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
            <span className={cn('px-2 py-0.5 rounded-full', contentTypeColors[creation.content_type] || 'bg-hover text-muted')}>
              {contentTypeLabels[creation.content_type] || creation.content_type}
            </span>
            {typeTag && (
              <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full">{typeTag}</span>
            )}
            {customTags.map((t) => (
              <span key={t} className="bg-hover text-muted px-2 py-0.5 rounded-full">{t}</span>
            ))}
            <span className="flex items-center gap-1 ml-auto"><User size={12} />
              <Link to={`/user/${creation.author?.username || 'unknown'}`} className="text-accent no-underline hover:underline">
                {creation.author?.display_name || creation.author?.username || '未知'}
              </Link>
            </span>
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(creation.created_at).toLocaleString('zh-CN')}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {creation.view_count || 0}</span>
          </div>

          {/* 标题 */}
          <h1 className="font-display text-accent text-2xl mb-6">{creation.title}</h1>

          {/* 正文 */}
          <div className="prose max-w-none text-secondary font-body text-sm leading-relaxed mb-8">
            {renderMarkdown(creation.content)}
          </div>

          {/* 图片 */}
          {creation.image_urls?.length > 0 && (
            <div className="mb-8">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {creation.image_urls.map((url, i) => (
                  <img key={i} src={url} alt={`附图 ${i + 1}`}
                    className="rounded-card w-full aspect-square object-cover cursor-pointer hover:opacity-90"
                    loading="lazy" onClick={() => window.open(url, '_blank')} />
                ))}
              </div>
            </div>
          )}

          {/* 视频 */}
          {creation.video_urls?.length > 0 && (
            <div className="mb-8">
              <VideoEmbed urls={creation.video_urls} />
            </div>
          )}

          {/* 操作栏 */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
            <LikeButton targetType="creation" targetId={id} size="lg" />
            {isOwn && (
              <>
                <button onClick={() => navigate(`/creation/${id}/edit`)}
                  className="flex items-center gap-1 text-muted text-xs hover:text-accent"><Edit3 size={12} /> 编辑</button>
                <button onClick={handleDelete}
                  className="flex items-center gap-1 text-muted text-xs hover:text-danger"><Trash2 size={12} /> 删除</button>
              </>
            )}
            {!isOwn && (
              <ReportButton targetType="creation" targetId={id} className="text-xs" />
            )}
          </div>
        </div>
      </article>

      {/* 评论区 */}
      <section className="bg-surface rounded-card shadow-card p-6">
        <h2 className="font-display text-accent text-lg mb-4 flex items-center gap-2">
          <MessageSquare size={18} /> 评论 ({comments.length})
        </h2>
        <div className="mb-6 pb-6 border-b border-border">
          <CommentForm creationId={id} onSuccess={fetchData} />
        </div>
        {topLevelComments.length === 0 ? (
          <p className="text-muted text-sm text-center py-8">暂无评论，来发表第一条评论吧</p>
        ) : (
          <div>
            {topLevelComments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} creationId={id} allComments={comments} onRefresh={fetchData} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
