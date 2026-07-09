/**
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, shadow-card, font-display
 */
import { Link } from 'react-router-dom'
import { Eye, Image } from 'lucide-react'
import { cn } from '@/lib/utils'

const categoryLabels = {
  character: '👤 角色设定',
  worldview: '🌍 世界观',
  timeline: '📅 剧情年表',
  gallery: '🖼️ 官方图鉴',
  music: '🎵 音乐/OST',
  other: '📦 其他',
}

export default function LibraryCard({ entry }) {
  return (
    <Link
      to={`/library/${entry.id}`}
      className="bg-surface rounded-card shadow-card overflow-hidden no-underline hover:shadow-elevated transition-shadow group"
    >
      {/* 封面图 */}
      <div className="aspect-video bg-hover flex items-center justify-center overflow-hidden">
        {entry.cover_url ? (
          <img
            src={entry.cover_url}
            alt={entry.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <Image size={32} className="text-muted" />
        )}
      </div>

      {/* 内容信息 */}
      <div className="p-4">
        {/* 置顶标识 */}
        {entry.is_pinned && (
          <span className="inline-block bg-accent/10 text-accent text-xs px-2 py-0.5 rounded-full mb-2">
            📌 置顶
          </span>
        )}

        <h3 className="font-display text-accent text-base mb-1 line-clamp-1 group-hover:underline">
          {entry.title}
        </h3>

        <span className="text-muted text-xs">{categoryLabels[entry.category] || entry.category}</span>

        {/* 标签 */}
        {entry.tags && entry.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {entry.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="bg-hover text-muted text-xs px-1.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* 阅读量 */}
        <div className="flex items-center gap-1 text-muted text-xs mt-3">
          <Eye size={12} />
          <span>{entry.view_count || 0} 次阅读</span>
        </div>
      </div>
    </Link>
  )
}
