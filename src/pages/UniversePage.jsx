import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import AdminLockOverlay from '@/components/universe/AdminLockOverlay'
import StarBackground from '@/components/universe/StarBackground'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'

export default function UniversePage() {
  const { isAdmin } = useAuth()
  const navigate = useNavigate()
  const [seasons, setSeasons] = useState([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [scrolled, setScrolled] = useState(false)
  const [entering, setEntering] = useState(null) // { season } | null

  // 管理员锁
  if (!isAdmin) {
    return <AdminLockOverlay />
  }

  useEffect(() => {
    async function fetchSeasons() {
      try {
        const { data } = await supabase
          .from('universe_seasons')
          .select('*')
          .order('display_order', { ascending: true })

        if (data && data.length > 0) {
          setSeasons(data)
          const activeIdx = data.findIndex((s) => s.status === 'active')
          setActiveIndex(activeIdx >= 0 ? activeIdx : 0)
        }
      } catch (_) {
        // 表可能还未创建，静默处理
      } finally {
        setLoading(false)
      }
    }
    fetchSeasons()
  }, [])

  // 监听滚动切换首屏/二屏
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > window.innerHeight * 0.5)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const currentSeason = seasons[activeIndex]

  function handlePrev() {
    setActiveIndex((prev) => (prev - 1 + seasons.length) % seasons.length)
  }

  function handleNext() {
    setActiveIndex((prev) => (prev + 1) % seasons.length)
  }

  function handleEnter(season) {
    setEntering({ season })
    setTimeout(() => {
      navigate(`/universe/${season.id}`)
    }, 1200)
  }

  return (
    <div className="relative min-h-screen bg-[#0A0E1A] text-white overflow-hidden">
      <StarBackground />

      {/* ====== 大气层进入动画覆盖层 ====== */}
      {entering && (
        <AtmosphereEntry colorHex={entering.season.color_hex} />
      )}

      {/* ====== 首屏：标题 ====== */}
      <section
        className="relative z-10 min-h-screen flex flex-col items-center justify-center transition-opacity duration-800"
        style={{ opacity: scrolled ? 0 : 1 }}
      >
        <h1
          className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-center tracking-wider leading-snug animate-fade-in-up"
          style={{
            background: 'linear-gradient(to bottom, #FFFFFF 0%, #FDE68A 60%, #D4A853 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          敖尹的万千宇宙
        </h1>
        <p className="mt-6 text-white/40 text-base sm:text-lg tracking-wide animate-fade-in-up-delayed">
          每一颗星辰，都是一个世界
        </p>

        {/* 下箭头 */}
        <div className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2">
          <ChevronDown
            size={32}
            className="text-white/30 animate-bounce-arrow"
          />
        </div>

        <style>{`
          @keyframes fade-in-up {
            from { opacity: 0; transform: translateY(30px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes fade-in-up-delayed {
            0% { opacity: 0; transform: translateY(30px); }
            60% { opacity: 0; transform: translateY(30px); }
            100% { opacity: 1; transform: translateY(0); }
          }
          @keyframes bounce-arrow {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(8px); }
          }
          .animate-fade-in-up {
            animation: fade-in-up 1.5s ease-out forwards;
          }
          .animate-fade-in-up-delayed {
            animation: fade-in-up-delayed 2.2s ease-out forwards;
          }
          .animate-bounce-arrow {
            animation: bounce-arrow 2s ease-in-out infinite;
          }
          @keyframes enter-atmosphere {
            0%   { transform: scale(0.2); opacity: 1; }
            20%  { transform: scale(0.2); opacity: 1; }
            60%  { transform: scale(10); opacity: 0.5; }
            100% { transform: scale(25); opacity: 0; }
          }
        `}</style>
      </section>

      {/* ====== 二屏：星纪星系 ====== */}
      <section
        className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 transition-opacity duration-800"
        style={{ opacity: scrolled ? 1 : 0.3 }}
      >
        <h2 className="font-display text-2xl sm:text-3xl text-white/70 mb-8 sm:mb-12 tracking-widest">
          探索星纪
        </h2>

        {/* 空状态 */}
        {seasons.length === 0 ? (
          <div className="text-white/30 text-center py-16">
            <p className="text-lg">尚未开启任何星纪</p>
            <p className="text-sm mt-2">管理员可在数据库中创建第一个星纪</p>
          </div>
        ) : (
          <GalaxyViewer
            seasons={seasons}
            activeIndex={activeIndex}
            onPrev={handlePrev}
            onNext={handleNext}
            onSelect={(idx) => setActiveIndex(idx)}
            onEnter={handleEnter}
          />
        )}
      </section>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   GalaxyViewer — 三体星系展示
   - 所有星系始终渲染，通过 transform 定位
   - 切换时每个球体独立缩放+位移动画
   ═══════════════════════════════════════════════════════ */
function GalaxyViewer({ seasons, activeIndex, onPrev, onNext, onSelect, onEnter }) {
  const [animating, setAnimating] = useState(false)

  function getPosition(idx) {
    const diff = idx - activeIndex
    if (diff === 0) return 'center'
    if (diff === -1 || diff === seasons.length - 1) return 'left'
    if (diff === 1 || diff === -(seasons.length - 1)) return 'right'
    // 超出范围：隐藏在更远的位置
    if (diff < 0) return 'far-left'
    return 'far-right'
  }

  function handleSwitch(direction, action) {
    if (animating) return
    setAnimating(true)
    action()
    setTimeout(() => setAnimating(false), 700)
  }

  return (
    <div className="relative w-full max-w-6xl flex items-center justify-center">
      {/* 左箭头 */}
      {seasons.length > 1 && (
        <button
          onClick={() => handleSwitch('right', onPrev)}
          className="absolute left-0 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 hover:border-white/20 transition-all"
          aria-label="上一个星纪"
        >
          <ChevronLeft size={22} className="text-white/50" />
        </button>
      )}

      {/* 星系展示区 — 所有星系叠加，通过 transform 定位 */}
      <div className="relative flex items-center justify-center w-full h-[420px] sm:h-[480px] md:h-[520px] px-10 sm:px-16">
        {seasons.map((season, idx) => (
          <GalaxyOrb
            key={season.id}
            season={season}
            position={getPosition(idx)}
            onClick={() => {
              if (animating) return
              const pos = getPosition(idx)
              if (pos === 'center') onEnter(season)
              else if (pos === 'left') handleSwitch('right', () => onSelect(idx))
              else if (pos === 'right') handleSwitch('left', () => onSelect(idx))
            }}
          />
        ))}
      </div>

      {/* 右箭头 */}
      {seasons.length > 1 && (
        <button
          onClick={() => handleSwitch('left', onNext)}
          className="absolute right-0 z-20 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/15 hover:border-white/20 transition-all"
          aria-label="下一个星纪"
        >
          <ChevronRight size={22} className="text-white/50" />
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════
   GalaxyOrb — 单个星系球体
   通过 CSS transition 实现缩放+位移动画
   position: 'center' | 'left' | 'right' | 'far-left' | 'far-right'
   ═══════════════════════════════════════════════════════ */
function GalaxyOrb({ season, position, onClick }) {
  const isCenter = position === 'center'

  const statusLabel = {
    upcoming: '即将开启',
    active: '进行中',
    archived: '已结束',
  }

  // 根据位置计算 transform
  const transforms = {
    center:   'translateX(0) scale(1)',
    left:     'translateX(-55%) scale(0.55)',
    right:    'translateX(55%) scale(0.55)',
    'far-left':  'translateX(-110%) scale(0.35)',
    'far-right': 'translateX(110%) scale(0.35)',
  }

  const opacities = {
    center: 1,
    left: 0.4,
    right: 0.4,
    'far-left': 0,
    'far-right': 0,
  }

  const pointerEvents = {
    center: 'auto',
    left: 'auto',
    right: 'auto',
    'far-left': 'none',
    'far-right': 'none',
  }

  return (
    <button
      onClick={onClick}
      className="absolute flex flex-col items-center gap-3 sm:gap-5 transition-all duration-700 ease-out cursor-pointer"
      style={{
        transform: transforms[position],
        opacity: opacities[position],
        pointerEvents: pointerEvents[position],
        transitionProperty: 'transform, opacity',
        transitionDuration: '700ms',
        transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* ── 星云光晕层（弥散光） ── */}
      <div
        className="absolute rounded-full w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72"
        style={{
          background: `radial-gradient(ellipse at center, ${season.color_hex}33 0%, ${season.color_hex}15 35%, ${season.color_hex}05 60%, transparent 80%)`,
          filter: 'blur(20px)',
          transform: 'scale(1.6)',
        }}
      />

      {/* ── 星云中层 ── */}
      <div
        className="absolute rounded-full w-56 h-56 sm:w-64 sm:h-64 md:w-72 md:h-72"
        style={{
          background: `radial-gradient(ellipse at 45% 40%, ${season.color_hex}55 0%, ${season.color_hex}22 30%, ${season.color_hex}08 55%, transparent 75%)`,
          filter: 'blur(8px)',
          transform: 'scale(1.2)',
        }}
      />

      {/* ── 主体球体 ── */}
      <div
        className="relative rounded-full w-44 h-44 sm:w-56 sm:h-56 md:w-64 md:h-64"
        style={{
          background: `
            radial-gradient(circle at 38% 32%, rgba(255,255,255,0.55) 0%, transparent 18%),
            radial-gradient(circle at 50% 50%, ${season.color_hex}cc 0%, ${season.color_hex}88 25%, ${season.color_hex}44 50%, ${season.color_hex}22 70%, ${season.color_hex}0d 100%)
          `,
          boxShadow: isCenter
            ? `0 0 80px 25px ${season.color_hex}33, 0 0 160px 50px ${season.color_hex}15, 0 0 250px 80px ${season.color_hex}08`
            : `0 0 40px 10px ${season.color_hex}15`,
          transition: 'box-shadow 700ms cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* 表面微光 */}
        <div
          className="absolute inset-0 rounded-full opacity-30"
          style={{
            background: `radial-gradient(circle at 65% 55%, ${season.color_hex}44 0%, transparent 40%)`,
          }}
        />
      </div>

      {/* ── 信息标签 ── */}
      <div
        className="relative text-center transition-all duration-700 ease-out"
        style={{ opacity: isCenter ? 1 : 0 }}
      >
        <div className="mb-1.5 sm:mb-2">
          <span className="inline-block text-[10px] sm:text-xs px-2 py-0.5 rounded-full border border-white/10 bg-white/5 text-white/50">
            {statusLabel[season.status]}
          </span>
        </div>
        <h3 className="font-display text-white text-base sm:text-lg md:text-xl tracking-wider">
          {season.name}
        </h3>
        <p className="text-white/30 text-[11px] sm:text-xs mt-1">
          {season.theme}
        </p>
        <p className="text-white/15 text-[10px] mt-2">
          点击进入星系
        </p>
      </div>
    </button>
  )
}

/* ═══════════════════════════════════════════════════════
   AtmosphereEntry — "扎进大气层"进入动效
   - 从视口中心开始放大的球体，模拟坠入星球大气层
   - 放大过程中逐渐透明，无缝衔接到内部页面
   ═══════════════════════════════════════════════════════ */
function AtmosphereEntry({ colorHex }) {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" style={{ background: '#0A0E1A' }}>
      {/* 大气层光球 */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: '300px',
          height: '300px',
          marginLeft: '-150px',
          marginTop: '-150px',
          background: `
            radial-gradient(circle at 40% 35%, rgba(255,255,255,0.6) 0%, transparent 15%),
            radial-gradient(circle at 50% 50%, ${colorHex}ee 0%, ${colorHex}88 30%, ${colorHex}44 60%, ${colorHex}11 100%)
          `,
          boxShadow: `
            0 0 80px 30px ${colorHex}44,
            0 0 200px 80px ${colorHex}22,
            0 0 400px 150px ${colorHex}0d,
            inset 0 0 200px 50px ${colorHex}33
          `,
          animation: 'enter-atmosphere 1.2s cubic-bezier(0.25, 0, 0.15, 1) forwards',
        }}
      />

      {/* 第二层：大气摩擦光晕（滞后一点点） */}
      <div
        className="absolute left-1/2 top-1/2 rounded-full"
        style={{
          width: '200px',
          height: '200px',
          marginLeft: '-100px',
          marginTop: '-100px',
          background: `radial-gradient(circle at 45% 40%, rgba(255,255,255,0.8) 0%, ${colorHex}66 40%, transparent 100%)`,
          filter: 'blur(8px)',
          animation: 'enter-atmosphere 1.2s 0.05s cubic-bezier(0.25, 0, 0.15, 1) forwards',
        }}
      />
    </div>
  )
}
