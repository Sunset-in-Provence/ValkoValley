import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import AdminLockOverlay from '@/components/universe/AdminLockOverlay'
import StarBackground from '@/components/universe/StarBackground'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { ArrowLeft, Globe } from 'lucide-react'

export default function UniverseSeasonPage() {
  const { isAdmin } = useAuth()
  const { seasonId } = useParams()
  const navigate = useNavigate()
  const [season, setSeason] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [show, setShow] = useState(false)

  // 管理员锁
  if (!isAdmin) {
    return <AdminLockOverlay />
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [{ data: seasonData }, { data: entriesData }] = await Promise.all([
          supabase.from('universe_seasons').select('*').eq('id', seasonId).single(),
          supabase.from('universe_entries').select('*, profiles!universe_entries_author_id_fkey(display_name, username, avatar_url)').eq('season_id', seasonId).order('created_at', { ascending: false }),
        ])

        if (seasonData) setSeason(seasonData)
        if (entriesData) setEntries(entriesData)
      } catch (_) {
        // 表可能还未创建，静默处理
      } finally {
        setLoading(false)
        // 大气层动画 1.2s，这里延迟 200ms 开始淡入，形成无缝衔接
        setTimeout(() => setShow(true), 200)
      }
    }
    fetchData()
  }, [seasonId])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!season) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <EmptyState icon={Globe} title="星纪不存在" description="该星纪可能已被删除或不存在" />
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-[#0A0E1A] text-white">
      <StarBackground />

      {/* 内容淡入（与大气层动画无缝衔接） */}
      <div
        className="relative z-10 transition-all duration-600 ease-out"
        style={{
          opacity: show ? 1 : 0,
          transform: show ? 'scale(1)' : 'scale(1.05)',
          transitionProperty: 'opacity, transform',
          transitionDuration: '600ms',
          transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >

      {/* 顶部导航 */}
      <div className="sticky top-0 bg-[#0A0E1A]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            onClick={() => navigate('/universe')}
            className="flex items-center gap-2 text-white/50 hover:text-white/80 transition-colors text-sm"
          >
            <ArrowLeft size={16} />
            <span>返回星系总览</span>
          </button>
          <span className="font-display text-white/40 text-sm tracking-wider">星纪探索</span>
        </div>
      </div>

      {/* 星纪信息横幅 */}
      <div className="relative z-10 px-4 py-12 sm:py-20 text-center"
        style={{
          background: `radial-gradient(ellipse at 50% 50%, ${season.color_hex}15 0%, transparent 60%)`,
        }}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 text-xs text-white/50 mb-4">
          {season.status === 'active' ? '🪐 进行中' : season.status === 'upcoming' ? '🌟 即将开启' : '🌑 已结束'}
        </div>
        <h1 className="font-display text-3xl sm:text-4xl md:text-5xl tracking-wider mb-4"
          style={{
            background: `linear-gradient(to bottom, #FFFFFF 0%, ${season.color_hex} 100%)`,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {season.name}
        </h1>
        {season.theme && (
          <p className="text-white/40 text-lg">主题：{season.theme}</p>
        )}
        {season.description && (
          <p className="text-white/30 text-sm mt-3 max-w-lg mx-auto leading-relaxed">{season.description}</p>
        )}
      </div>

      {/* 投稿行星网格 */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pb-24">
        <h2 className="font-display text-xl text-white/50 tracking-wider mb-8 text-center">
          收录作品 · {entries.length}
        </h2>

        {entries.length === 0 ? (
          <EmptyState
            icon={Globe}
            title="暂无投稿"
            description="该星纪下还没有任何作品，等待建设者们创作"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map((entry) => (
              <PlanetCard key={entry.id} entry={entry} accentColor={season.color_hex} />
            ))}
          </div>
        )}
      </div>
      </div>{/* fade-in wrapper end */}
    </div>
  )
}

/**
 * 行星卡片 — 投稿以行星形式展示
 */
function PlanetCard({ entry, accentColor }) {
  const authorName = entry.profiles?.display_name || entry.profiles?.username || '未知作者'

  return (
    <Link
      to={`/universe/${entry.season_id}/${entry.id}`}
      className="group block relative p-6 rounded-2xl border border-white/5 bg-white/[0.03] backdrop-blur-sm hover:bg-white/[0.06] hover:border-white/10 transition-all duration-300 no-underline"
    >
      {/* 行星 */}
      <div className="flex justify-center mb-5">
        <div
          className="w-20 h-20 sm:w-24 sm:h-24 rounded-full transition-all duration-300 group-hover:scale-110"
          style={{
            background: `radial-gradient(circle at 40% 35%, rgba(255,255,255,0.4) 0%, ${accentColor}55 30%, ${accentColor}99 60%, ${accentColor} 100%)`,
            boxShadow: `0 0 40px 10px ${accentColor}22`,
          }}
        >
          {/* 行星环（IF线的特殊标记） */}
          {entry.build_type === 'if' && (
            <div
              className="absolute w-20 h-20 sm:w-24 sm:h-24 rounded-full"
              style={{
                border: `2px solid ${accentColor}44`,
                transform: 'rotateX(75deg)',
                margin: '-2px 0 0 -2px',
              }}
            />
          )}
        </div>
      </div>

      {/* 信息 */}
      <h3 className="font-display text-white/80 text-center text-sm sm:text-base mb-2 line-clamp-1 group-hover:text-white transition-colors">
        {entry.title}
      </h3>
      <p className="text-white/30 text-xs text-center">
        {authorName} · {entry.build_type === 'canon' ? '正剧构史' : 'IF线'}
      </p>
      {entry.description && (
        <p className="text-white/20 text-xs text-center mt-2 line-clamp-2">{entry.description}</p>
      )}
    </Link>
  )
}
