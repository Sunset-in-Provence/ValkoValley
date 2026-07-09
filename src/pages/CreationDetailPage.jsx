/**
 * 创作详情页 — 展示作品内容 + 图片 + 视频
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent, text-danger,
 *   rounded-card, rounded-button, rounded-full, shadow-card, font-display, font-body, border-border
 */
import { useState, useEffect, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { renderMarkdown } from '@/lib/markdown'
import VideoEmbed from '@/components/creation/VideoEmbed'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import toast from 'react-hot-toast'
import ReportButton from '@/components/report/ReportButton'
import { ArrowLeft, User, Clock, Eye, Edit3, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

const ratingLabels = { general: '全年龄', '15plus': '15+', '18plus': '18+' }
const ratingColors = {
  general: 'bg-success/10 text-success',
  '15plus': 'bg-warning/10 text-warning',
  '18plus': 'bg-danger/10 text-danger',
}

export default function CreationDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [creation, setCreation] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('creations')
      .select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)')
      .eq('id', id).eq('is_deleted', false).single()
    setCreation(data || null)
    setLoading(false)
    // 增加阅读量
    if (data) {
      supabase.from('creations').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id).then()
    }
  }, [id])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleDelete() {
    if (!confirm('确定删除此创作？')) return
    const { error } = await supabase.from('creations').update({ is_deleted: true }).eq('id', id).eq('author_id', user.id)
    if (error) { toast.error('删除失败') }
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

  const isOwn = user?.id === creation.author_id
  const typeTag = creation.tags?.find((t) => ['原创', '二创'].includes(t))
  const customTags = creation.tags?.filter((t) => !['原创', '二创'].includes(t)) || []

  return (
    <div>
      <Link to="/creation" className="flex items-center gap-1 text-muted text-sm mb-4 no-underline hover:text-accent">
        <ArrowLeft size={14} /> 返回创作区
      </Link>

      <article className="bg-surface rounded-card shadow-card">
        <div className="p-6 md:p-8">
          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-2 text-xs mb-4">
            <span className={cn('px-2 py-0.5 rounded-full', ratingColors[creation.rating] || 'bg-hover text-muted')}>
              {ratingLabels[creation.rating] || creation.rating}
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
              <h3 className="text-secondary text-sm font-medium mb-3">📷 附图</h3>
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
              <h3 className="text-secondary text-sm font-medium mb-3">🎬 视频</h3>
              <VideoEmbed urls={creation.video_urls} />
            </div>
          )}

          {/* 操作栏 */}
          <div className="flex items-center gap-3 pt-4 border-t border-border">
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
    </div>
  )
}
