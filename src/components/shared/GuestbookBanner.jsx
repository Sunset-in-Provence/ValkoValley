/**
 * 首页弹幕墙 — 碰撞检测避免重叠
 */
import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'

function randomBetween(a, b) {
  return a + Math.random() * (b - a)
}

export default function GuestbookBanner() {
  const [danmaku, setDanmaku] = useState([])
  const [poolReady, setPoolReady] = useState(false)
  const idRef = useRef(0)
  const activeZones = useRef([])
  const poolRef = useRef([])

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('guestbook')
        .select('content')
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .limit(50)
      if (data && data.length > 0) {
        poolRef.current = data.map((m) => m.content)
        setPoolReady(true)
      }
    }
    load()
  }, [])

  let laneIndex = 0
  const LANE_COUNT = 10

  function findFreeY(fontSize) {
    const now = Date.now()
    activeZones.current = activeZones.current.filter((z) => z.until > now)

    const heightPct = (fontSize / window.innerHeight) * 100 + 2

    // 轮询每个轨道，找第一个不重叠的
    for (let i = 0; i < LANE_COUNT; i++) {
      const lane = (laneIndex + i) % LANE_COUNT
      const top = (lane / LANE_COUNT) * (94 - heightPct) + 3
      const bottom = top + heightPct + 2
      const overlaps = activeZones.current.some(
        (z) => top < z.bottom && bottom > z.top
      )
      if (!overlaps) {
        laneIndex = (lane + 1) % LANE_COUNT
        return { top, heightPct }
      }
    }
    // 都忙，挑最早空闲的轨道
    laneIndex = (laneIndex + 1) % LANE_COUNT
    const top = (laneIndex / LANE_COUNT) * 88 + 6
    return { top, heightPct }
  }

  function spawn(text, startX) {
    const fontSize = randomBetween(16, 40)
    const duration = randomBetween(14, 30)
    const { top } = findFreeY(fontSize)

    const heightPct = (fontSize / window.innerHeight) * 100 + 2
    const until = Date.now() + (duration + 1) * 1000
    activeZones.current.push({ top: top - 1, bottom: top + heightPct + 1, until })

    setDanmaku((prev) => [
      ...prev.slice(-80),
      {
        id: ++idRef.current,
        text,
        size: fontSize,
        duration,
        top,
        startX,
        delay: 0,
      },
    ])
  }

  // 首屏立即发射
  useEffect(() => {
    if (!poolReady) return
    for (let i = 0; i < 7; i++) {
      const text = poolRef.current[Math.floor(Math.random() * poolRef.current.length)]
      spawn(text, randomBetween(30, 100))
    }
  }, [poolReady])

  // 持续发射
  useEffect(() => {
    if (!poolReady) return
    const interval = setInterval(() => {
      const text = poolRef.current[Math.floor(Math.random() * poolRef.current.length)]
      spawn(text, 100)
    }, 700)
    return () => clearInterval(interval)
  }, [poolReady])

  // 清理 DOM
  useEffect(() => {
    const cleanup = setInterval(() => {
      setDanmaku((prev) => prev.slice(-60))
    }, 5000)
    return () => clearInterval(cleanup)
  }, [])

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden"
      style={{ opacity: 0.30 }}>
      {danmaku.map((d) => (
        <div
          key={d.id}
          className="absolute whitespace-nowrap select-none"
          style={{
            fontSize: `${d.size}px`,
            color: '#2D5A3A',
            top: `${d.top}%`,
            transform: `translateX(${d.startX}vw)`,
            animation: `danmaku-scroll ${d.duration}s linear ${d.delay}s both`,
            fontWeight: d.size > 28 ? 600 : 400,
          }}
          onAnimationEnd={(e) => { e.target.style.display = 'none' }}
        >
          「{d.text}」
        </div>
      ))}
    </div>
  )
}
