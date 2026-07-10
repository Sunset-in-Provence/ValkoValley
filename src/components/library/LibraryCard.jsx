import { Link } from 'react-router-dom'
import { Eye, Image } from 'lucide-react'

const catLabels = {
  lore_official: '官方设定', lore_rumor: '坊间传闻',
  gallery_promo: '宣图', gallery_card: '卡面', gallery_text: '文案',
  video_pv: '个人PV', video_story: '卡面剧情', video_other: '其它',
  music_official: '官方', music_fan: '同人',
}

export default function LibraryCard({ entry }) {
  return (
    <Link to={`/library/${entry.id}`}
      className="bg-surface rounded-card shadow-card overflow-hidden no-underline hover:shadow-elevated transition-shadow group">
      <div className="aspect-[4/3] bg-hover flex items-center justify-center overflow-hidden">
        {entry.cover_url ? (
          <img src={entry.cover_url} alt={entry.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
        ) : (<Image size={24} className="text-muted" />)}
      </div>
      <div className="p-3">
        {entry.is_pinned && <span className="inline-block bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded-full mb-1.5">置顶</span>}
        <h3 className="font-display text-accent text-xs mb-1 line-clamp-1 group-hover:underline">{entry.title}</h3>
        <span className="text-muted text-[10px]">{catLabels[entry.category] || entry.category}</span>
        <div className="flex items-center gap-1 text-muted text-[10px] mt-2"><Eye size={10} /> {entry.view_count || 0}</div>
      </div>
    </Link>
  )
}
