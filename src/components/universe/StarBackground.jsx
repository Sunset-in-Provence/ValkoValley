import { useEffect, useRef } from 'react'

/**
 * 多层 parallax 星空背景
 * - 3 层星星，滚动时不同速率移动
 * - 偶尔流星划过
 * - 用 CSS box-shadow 生成随机星星（纯 CSS 方案，无 Canvas 依赖）
 */
export default function StarBackground() {
  const containerRef = useRef(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const scrollY = window.scrollY
      const layers = container.querySelectorAll('[data-star-layer]')
      layers.forEach((layer) => {
        const speed = parseFloat(layer.dataset.speed || '0.02')
        layer.style.transform = `translateY(${scrollY * speed}px)`
      })
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* 深空底色 */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0E1A] via-[#0D1225] to-[#111827]" />

      {/* 小星层 — 慢速 */}
      <div
        data-star-layer
        data-speed="0.015"
        className="absolute inset-0 opacity-60"
        style={{ boxShadow: generateStarShadows(200, 1) }}
      />

      {/* 中星层 — 中速 */}
      <div
        data-star-layer
        data-speed="0.03"
        className="absolute inset-0 opacity-80"
        style={{ boxShadow: generateStarShadows(100, 2) }}
      />

      {/* 大星层 — 快速 + 闪烁 */}
      <div
        data-star-layer
        data-speed="0.05"
        className="absolute inset-0 opacity-90"
        style={{ boxShadow: generateStarShadows(30, 3) }}
      />

      {/* 流星 */}
      <ShootingStars />
    </div>
  )
}

/**
 * 用 box-shadow 生成随机星星
 * @param {number} count 星星数量
 * @param {number} size 1=小, 2=中, 3=大
 * @returns {string} box-shadow 值
 */
function generateStarShadows(count, size) {
  const colors = ['#FFFFFF', '#C8D6E5', '#FDE68A', '#A8D8EA', '#FFEEDD']
  const basePx = size === 1 ? 1 : size === 2 ? 2 : 3
  const shadows = []

  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * 100)
    const y = Math.floor(Math.random() * 100)
    const px = basePx + (Math.random() > 0.7 ? 1 : 0)
    const color = colors[Math.floor(Math.random() * colors.length)]
    shadows.push(`${x}vw ${y}vh ${px}px ${px}px ${color}`)
  }

  return shadows.join(', ')
}

/**
 * 随机流星
 */
function ShootingStars() {
  const stars = []
  for (let i = 0; i < 5; i++) {
    const top = Math.floor(Math.random() * 80)
    const left = Math.floor(Math.random() * 80)
    const delay = Math.random() * 8
    const duration = 2 + Math.random() * 3
    stars.push(
      <div
        key={i}
        className="absolute w-0.5 h-0.5 bg-white rounded-full"
        style={{
          top: `${top}%`,
          left: `${left}%`,
          animation: `shooting-star ${duration}s ${delay}s infinite`,
          animationTimingFunction: 'linear',
          boxShadow: '0 0 4px 1px rgba(255,255,255,0.6), 0 0 10px 3px rgba(200,220,255,0.3)',
        }}
      />
    )
  }
  return (
    <>
      <style>{`
        @keyframes shooting-star {
          0% { transform: translate(0, 0); opacity: 1; }
          10% { transform: translate(80px, 30px); opacity: 0.8; }
          20% { transform: translate(160px, 60px); opacity: 0; }
          100% { transform: translate(160px, 60px); opacity: 0; }
        }
      `}</style>
      {stars}
    </>
  )
}
