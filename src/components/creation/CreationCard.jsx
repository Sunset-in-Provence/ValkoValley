/**
 * 创作卡片 — 创作区列表项
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-full, shadow-card, font-display, border-border
 */
import { Link } from 'react-router-dom'
import { Eye, User, Clock, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

const ratingLabels = {
  general: '全年龄',
  '15plus': '15+',
  '18plus': '18+',
}

const ratingColors = {
  general: 'bg-success/10 text-success',
  '15plus': 'bg-warning/10 text-warning',
  '18plus': 'bg-danger/10 text-danger',
}

export default function CreationCard({ creation }) {
  const author = creation.author || {}
  const firstImage = creation.image_urls?.[0]
  const typeTag = creation.tags?.find((t) => ['原创', '二创'].includes(t))
  const customTags = creation.tags?.filter((t) => !['原创', '二创'].includes(t)) || []

  return (
    <Link
      to={`/creation/${creation.id}`}
      className="block bg-surface rounded-card shadow-card overflow-hidden no-underline hover:shadow-elevated transition-shadow group"
    >
      {/* 封面图 */}
      <div className="aspect-video bg-hover flex items-center justify-center overflow-hidden">
        {firstImage ? (
          <img src={firstImage} alt={creation.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (
          <Image size={32} className="text-muted" />
        )}
      </div>

      <div className="p-4">
        {/* 标题 */}
        <h3 className="font-display text-accent text-sm mb-2 line-clamp-1 group-hover:underline">
          {creation.title}
        </h3>

        {/* 标签行 */}
        <div className="flex flex-wrap items-center gap-1 mb-2">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full', ratingColors[creation.rating] || 'bg-hover text-muted')}>
            {ratingLabels[creation.rating] || creation.rating}
          </span>
          {typeTag && (
            <span className="bg-hover text-muted text-[10px] px-1.5 py-0.5 rounded-full">{typeTag}</span>
          )}
          {customTags.slice(0, 2).map((t) => (
            <span key={t} className="bg-hover text-muted text-[10px] px-1.5 py-0.5 rounded-full">{t}</span>
          ))}
          {customTags.length > 2 && (
            <span className="text-muted text-[10px]">+{customTags.length - 2}</span>
          )}
        </div>

        {/* 元信息 */}
        <div className="flex items-center gap-3 text-xs text-muted">
          <span className="flex items-center gap-1"><User size={11} /> {author.display_name || author.username || '未知'}</span>
          <span className="flex items-center gap-1"><Clock size={11} /> {new Date(creation.created_at).toLocaleDateString('zh-CN')}</span>
          <span className="flex items-center gap-1"><Eye size={11} /> {creation.view_count || 0}</span>
        </div>
      </div>
    </Link>
  )
}
