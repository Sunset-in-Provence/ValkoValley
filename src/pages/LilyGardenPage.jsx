import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Droplets, Flower, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

const MATURE_DAYS = 45

export default function LilyGardenPage() {
  const { user } = useAuth()
  const [garden, setGarden] = useState(null)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      let { data } = await supabase.from('lily_garden').select('*').eq('user_id', user.id).maybeSingle()
      if (!data) {
        await supabase.from('lily_garden').insert({ user_id: user.id })
        data = { user_id: user.id, water_count: 0, propagated_count: 0 }
      }
      setGarden(data)
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  const g = garden
  const wateredToday = g.last_watered === new Date().toISOString().slice(0, 10)
  const progress = Math.min((g.water_count || 0) / MATURE_DAYS * 100, 100)
  const isMature = (g.water_count || 0) >= MATURE_DAYS
  const stage = (g.water_count || 0) === 0 ? 'seed' : (g.water_count || 0) < 15 ? 'sprout' : (g.water_count || 0) < 30 ? 'bud' : (g.water_count || 0) < 45 ? 'bloom' : 'mature'

  async function handleWater() {
    if (wateredToday) { toast('今天已经浇过水了'); return }
    setAnimating(true)
    const { error } = await supabase.from('lily_garden').update({
      water_count: (g.water_count || 0) + 1,
      last_watered: new Date().toISOString().slice(0, 10),
    }).eq('user_id', user.id)
    if (error) toast.error('浇水失败')
    else {
      const newCount = (g.water_count || 0) + 1
      setGarden({ ...g, water_count: newCount, last_watered: new Date().toISOString().slice(0, 10) })
      if (newCount % 10 === 0) toast.success(`铃兰又长大了一点！已浇 ${newCount} 天`)
      else toast.success('铃兰喝饱了水 +10')
      // 同步贡献值
      supabase.rpc('add_contribution', { _user_id: user.id, _action: 'daily_water', _points: 10 }).then()
    }
    setTimeout(() => setAnimating(false), 1500)
  }

  async function handlePropagate() {
    if (!isMature) return
    const newCount = (g.propagated_count || 0) + 1
    await Promise.all([
      supabase.from('lily_garden').update({ water_count: 0, last_watered: null, propagated_count: newCount }).eq('user_id', user.id),
      supabase.from('valley_lilies').insert({ owner_id: user.id, name: `铃兰 #${newCount}` }),
    ])
    setGarden({ ...g, water_count: 0, last_watered: null, propagated_count: newCount })
    toast.success('🌱 分株成功！成年铃兰已移入铃兰谷，新幼苗开始生长')
  }

  const stageEmoji = { seed: '🌰', sprout: '🌱', bud: '🌿', bloom: '🌼', mature: '🌸' }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-accent text-2xl mb-2 flex items-center gap-2">
        <Flower size={28} /> 铃兰花园
      </h1>
      <p className="text-muted text-sm mb-6">
        每天浇水养护你的铃兰，{(MATURE_DAYS - (g.water_count || 0))} 天后成熟可分株。
        已分株 {g.propagated_count || 0} 次。
      </p>

      {/* 铃兰生长展示 */}
      <div className="bg-surface rounded-card shadow-card p-8 mb-4 text-center">
        <div className={`text-8xl mb-4 transition-all duration-1000 ${animating ? 'scale-125' : ''}`}
          style={{ filter: `drop-shadow(0 0 ${progress}px rgba(94,174,124,${progress/200}))` }}>
          {stageEmoji[stage]}
        </div>
        <div className="w-full bg-hover rounded-full h-3 mb-2 overflow-hidden">
          <div className="bg-accent h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress}%` }} />
        </div>
        <p className="text-muted text-xs">{Math.round(progress)}% 成长中</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-3">
        <button onClick={handleWater} disabled={wateredToday}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-button font-medium text-sm transition-all ${
            wateredToday ? 'bg-hover text-muted cursor-default' : 'bg-accent text-text-inverse hover:opacity-90 active:scale-95'
          }`}>
          <Droplets size={18} className={animating ? 'animate-bounce' : ''} />
          {wateredToday ? '今日已浇水' : '浇水施肥'}
        </button>
        {isMature && (
          <button onClick={handlePropagate}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-button font-medium text-sm bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20">
            <ArrowRight size={18} /> 分株移入铃兰谷
          </button>
        )}
      </div>

      {/* 铃兰谷入口 */}
      {(g.propagated_count || 0) > 0 && (
        <a href="/lily-valley" className="block mt-4 bg-surface rounded-card shadow-card p-4 no-underline hover:shadow-elevated transition-shadow">
          <div className="flex items-center justify-between">
            <span className="text-accent text-sm font-medium flex items-center gap-2">
              <Flower size={18} /> 铃兰谷
            </span>
            <span className="text-muted text-xs">{g.propagated_count} 株成年铃兰</span>
          </div>
        </a>
      )}
    </div>
  )
}
