/**
 * 档案馆条目详情页
 */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { renderMarkdown } from '@/lib/markdown'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import toast from 'react-hot-toast'
import { ArrowLeft, Eye, Calendar, User, Edit3, Trash2, Download } from 'lucide-react'

const catLabels = {
  lore_official: '官方设定', lore_rumor: '坊间传闻',
  gallery_promo: '宣图', gallery_card: '卡面', gallery_card_day: '日卡', gallery_card_month: '月卡', gallery_text: '文案',
  video_pv_concept: '概念短片', video_pv_game: '不驯者的游戏', video_pv_instinct: '本能沦陷法则',
  video_story: '卡面剧情', video_other: '其它',
  music_official: '官方', music_fan: '同人',
}

export default function LibraryDetailPage() {
  const { id } = useParams()
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const canEdit = !!user

  async function handleDelete() {
    if (!window.confirm('确定删除此条目？')) return
    const { data, error } = await supabase.rpc('delete_library_entry', { _id: id })
    if (error) { toast.error('删除失败: ' + error.message); return }
    if (!data) { toast.error('删除失败：无权限或条目不存在'); return }
    toast.success('已删除')
    setTimeout(() => navigate('/library'), 300)
  }

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('library_entries')
        .select('*, author:profiles!library_entries_author_id_fkey(username, display_name)')
        .eq('id', id).eq('status', 'published').single()
      setEntry(data || null)
      setLoading(false)
      if (data) {
        supabase.from('library_entries').update({ view_count: (data.view_count || 0) + 1 }).eq('id', id).then()
      }
    }
    load()
  }, [id])

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  if (!entry) {
    return (
      <div>
        <Link to="/library" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-6 no-underline hover:text-accent shadow-card">
          <ArrowLeft size={16} /> 返回档案馆
        </Link>
        <div className="bg-surface rounded-card shadow-card p-6">
          <p className="text-muted text-sm">条目不存在或未发布</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/library" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-6 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回档案馆
      </Link>

      <article className="bg-surface rounded-card shadow-card">
        {entry.cover_url && (
          <div className="aspect-video rounded-t-card overflow-hidden">
            <img src={entry.cover_url} alt={entry.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 md:p-8">
          <div className="flex flex-wrap items-center gap-3 text-muted text-xs mb-4">
            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full">{catLabels[entry.category] || entry.category}</span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(entry.created_at).toLocaleDateString('zh-CN')}</span>
            <span className="flex items-center gap-1"><User size={12} /> {entry.author?.display_name || entry.author?.username || '管理员'}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {entry.view_count || 0} 次阅读</span>
          </div>

          <h1 className="font-display text-accent text-2xl mb-6">{entry.title}</h1>

          <div className="prose max-w-none text-secondary text-sm leading-relaxed mb-8">
            {renderMarkdown(entry.content)}
          </div>

          {/* 图片 */}
          {entry.image_urls?.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {entry.image_urls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`附图 ${i + 1}`}
                      className="rounded-card w-24 h-24 md:w-32 md:h-32 object-cover cursor-pointer hover:opacity-90"
                      loading="lazy" onClick={() => window.open(url, '_blank')} />
                    <a href={url} download className="absolute bottom-1 right-1 bg-surface/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity sm:opacity-100" title="下载">
                      <Download size={12} className="text-muted" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 歌词 */}
          {entry.lyrics && (
            <div className="mb-6">
              <h3 className="font-display text-accent text-sm mb-2">歌词</h3>
              <div className="bg-hover rounded-card p-4 max-h-60 overflow-y-auto text-secondary text-sm leading-relaxed whitespace-pre-line font-body">
                {entry.lyrics.replace(/\[\d{2}:\d{2}[.:]\d{2}\]/g, '')}
              </div>
            </div>
          )}

          {/* 音频 */}
          {entry.audio_urls?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-display text-accent text-sm mb-3">音频</h3>
              <div className="space-y-2">
                {entry.audio_urls.map((url, i) => (
                  <audio key={i} controls className="w-full">
                    <source src={url} />
                  </audio>
                ))}
              </div>
            </div>
          )}

          {/* 视频 */}
          {entry.video_urls?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-display text-accent text-sm mb-3">视频</h3>
              <div className="space-y-3">
                {entry.video_urls.map((url, i) => {
                  const isLocal = url.includes('supabase.co') || url.endsWith('.mp4') || url.endsWith('.webm')
                  if (isLocal) {
                    return (
                      <video key={i} controls className="w-full rounded-card" style={{ maxHeight: 400 }}>
                        <source src={url} /> 您的浏览器不支持视频播放
                      </video>
                    )
                  }
                  return (
                    <div key={i} className="aspect-video">
                      <iframe src={(() => {
                        if (url.includes('bilibili.com') || url.includes('b23.tv')) {
                          const match = url.match(/BV\w+/)
                          return match ? `https://player.bilibili.com/player.html?bvid=${match[0]}&high_quality=1&danmaku=0` : url
                        }
                        return url.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                      })()}
                        className="w-full h-full rounded-card" allowFullScreen
                          sandbox="allow-scripts allow-same-origin"
                          referrerPolicy="no-referrer" />
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* 标签 */}
          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-6 border-t border-border">
              {entry.tags.map((tag) => (
                <span key={tag} className="bg-hover text-secondary text-xs px-3 py-1 rounded-full">{tag}</span>
              ))}
            </div>
          )}
        </div>
        {canEdit && (
          <div className="flex gap-2 pt-4 border-t border-border mt-4">
            <button onClick={() => navigate(`/library/${id}/edit`)}
              className="inline-flex items-center gap-1 bg-hover rounded-button px-3 py-1.5 text-muted text-sm hover:bg-accent hover:text-text-inverse transition-colors">
              <Edit3 size={14} /> 编辑条目
            </button>
            {isAdmin && (
              <button onClick={handleDelete}
                className="inline-flex items-center gap-1 bg-hover rounded-button px-3 py-1.5 text-danger text-sm hover:bg-danger/10 transition-colors">
                <Trash2 size={14} /> 删除
              </button>
            )}
          </div>
        )}
      </article>
    </div>
  )
}
