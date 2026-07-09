/**
 * 档案馆条目详情页
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, shadow-card, font-display, font-body
 */
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Eye, Calendar, User } from 'lucide-react'

const categoryLabels = {
  character: '👤 角色设定',
  worldview: '🌍 世界观',
  timeline: '📅 剧情年表',
  gallery: '🖼️ 官方图鉴',
  music: '🎵 音乐/OST',
  other: '📦 其他',
}

export default function LibraryDetailPage() {
  const { id } = useParams()

  // 占位 — 后续从 Supabase 加载
  const entry = null

  if (!entry) {
    return (
      <div>
        <Link to="/library" className="flex items-center gap-1 text-muted text-sm mb-6 no-underline hover:text-accent">
          <ArrowLeft size={14} /> 返回档案馆
        </Link>
        <div className="bg-surface rounded-card shadow-card p-6">
          <p className="text-muted text-sm">条目详情页（ID: {id}）— 完整实现在 Phase 4 开发</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <Link to="/library" className="flex items-center gap-1 text-muted text-sm mb-6 no-underline hover:text-accent">
        <ArrowLeft size={14} /> 返回档案馆
      </Link>

      <article className="bg-surface rounded-card shadow-card">
        {/* 封面图 */}
        {entry.cover_url && (
          <div className="aspect-video rounded-t-card overflow-hidden">
            <img src={entry.cover_url} alt={entry.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-6 md:p-8">
          {/* 元信息 */}
          <div className="flex flex-wrap items-center gap-3 text-muted text-xs mb-4">
            <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-full">
              {categoryLabels[entry.category]}
            </span>
            <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(entry.created_at).toLocaleDateString('zh-CN')}</span>
            <span className="flex items-center gap-1"><User size={12} /> {entry.author_display_name || '管理员'}</span>
            <span className="flex items-center gap-1"><Eye size={12} /> {entry.view_count || 0} 次阅读</span>
          </div>

          {/* 标题 */}
          <h1 className="font-display text-accent text-2xl mb-6">{entry.title}</h1>

          {/* 正文 */}
          <div className="prose font-body text-secondary max-w-none">
            {/* Markdown 渲染内容 */}
            {entry.content}
          </div>

          {/* 图片附件 */}
          {entry.image_urls?.length > 0 && (
            <div className="mt-8">
              <h3 className="font-display text-accent text-lg mb-3">📷 附图</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {entry.image_urls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt={`附图 ${i + 1}`}
                    className="rounded-card w-full aspect-square object-cover cursor-pointer hover:opacity-90"
                    loading="lazy"
                    onClick={() => window.open(url, '_blank')}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 标签 */}
          {entry.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-border">
              {entry.tags.map((tag) => (
                <span key={tag} className="bg-hover text-secondary text-xs px-3 py-1 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </article>
    </div>
  )
}
