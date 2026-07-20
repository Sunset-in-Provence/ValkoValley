import { Link } from 'react-router-dom'
import { Image, ChevronUp, ChevronDown } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

const catLabels = {
  lore_official: '官方设定', lore_rumor: '坊间传闻',
  gallery_promo: '宣图', gallery_card: '卡面', gallery_text: '文案',
  video_pv_concept: '概念短片', video_pv_game: '不驯者的游戏', video_pv_instinct: '本能沦陷法则',
  video_story: '卡面剧情', video_other: '其它',
  music_official: '官方', music_fan: '同人',
}

export default function LibraryCard({ entry, isAdmin, onReorder }) {
  async function move(delta) {
    await supabase.rpc('move_library_entry', { _id: entry.id, _direction: delta })
    if (onReorder) onReorder()
  }

  return (
    <div className="relative group/card">
      <Link to={`/library/${entry.id}`}
        className="block bg-surface rounded-card shadow-card overflow-hidden no-underline hover:shadow-elevated transition-shadow group">
        <div className="aspect-[4/3] bg-hover flex items-center justify-center overflow-hidden">
          {(entry.cover_url || entry.image_urls?.[0]) ? (
            <img src={entry.cover_url || entry.image_urls[0]} alt={entry.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          ) : (<Image size={24} className="text-muted" />)}
        </div>
        <div className="p-3">
          {entry.is_pinned && <span className="inline-block bg-accent/10 text-accent text-[10px] px-1.5 py-0.5 rounded-full mb-1.5">置顶</span>}
          <h3 className="font-display text-accent text-xs mb-1 line-clamp-1 group-hover:underline">{entry.title}</h3>
          <span className="text-muted text-[10px]">{catLabels[entry.category] || entry.category}</span>
        </div>
      </Link>
      {isAdmin && (
        <div className="absolute right-1 top-1 flex flex-col opacity-0 group-hover/card:opacity-100 transition-opacity">
          <button onClick={(e) => { e.preventDefault(); move(-1) }}
            className="bg-surface/80 rounded text-muted hover:text-accent p-0.5"><ChevronUp size={12} /></button>
          <button onClick={(e) => { e.preventDefault(); move(1) }}
            className="bg-surface/80 rounded text-muted hover:text-accent p-0.5"><ChevronDown size={12} /></button>
        </div>
      )}
    </div>
  )
}
