import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Flower, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function LilyValleyPage() {
  const [lilies, setLilies] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('valley_lilies').select('*, owner:profiles!valley_lilies_owner_id_fkey(display_name, username)').order('bloomed_at', { ascending: false })
      setLilies(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  // 随机分布位置
  const positions = lilies.map((_, i) => {
    const angle = (i / Math.max(lilies.length, 1)) * Math.PI * 2
    const radius = 30 + Math.random() * 40
    return {
      x: 50 + Math.cos(angle) * radius * (0.5 + Math.random()),
      y: 50 + Math.sin(angle) * radius * (0.5 + Math.random()),
      delay: i * 0.1,
      size: 16 + Math.random() * 20,
    }
  })

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/lily-garden" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回花园
      </Link>

      <h1 className="font-display text-accent text-2xl mb-2 flex items-center gap-2">
        <Flower size={28} /> 铃兰谷
      </h1>
      <p className="text-muted text-sm mb-6">
        这里是所有用户分株移入的成年铃兰，共 {lilies.length} 株。
      </p>

      <div className="bg-gradient-to-b from-green-900/20 via-green-800/10 to-green-900/20 rounded-card shadow-card relative overflow-hidden"
        style={{ minHeight: 500 }}>
        {/* 草地背景 */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-green-900/30 to-transparent" />

        {/* 点亮的铃兰 */}
        {positions.map((pos, i) => (
          <div key={i} className="absolute transition-all duration-1000 animate-pulse"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              animationDelay: `${pos.delay}s`,
              fontSize: `${pos.size}px`,
              filter: `drop-shadow(0 0 8px rgba(253,230,138,0.5))`,
              opacity: 0,
              animation: `lily-bloom 1s ease-out ${pos.delay}s forwards`,
            }}>
            🌸
          </div>
        ))}

        {lilies.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-muted text-sm">山谷中还没有铃兰，去花园养护第一株吧</p>
          </div>
        )}
      </div>

      {/* 贡献榜 */}
      <div className="mt-6 bg-surface rounded-card shadow-card p-4">
        <h3 className="text-secondary text-sm font-medium mb-3">园丁榜</h3>
        <div className="space-y-2">
          {lilies.slice(0, 20).map((l, i) => (
            <div key={l.id} className="flex items-center justify-between text-sm">
              <span className="text-secondary flex items-center gap-2">
                <span className="text-muted text-xs w-5">{i + 1}</span>
                {l.owner?.display_name || l.owner?.username || '园丁'}
              </span>
              <span className="text-muted text-xs">{new Date(l.bloomed_at).toLocaleDateString('zh-CN')} 移入</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
