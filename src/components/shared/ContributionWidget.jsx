import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { Star, Droplets, Gift } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContributionWidget({ userId, isOwn }) {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [watered, setWatered] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('contribution_log').select('points').eq('user_id', userId)
      setTotal(data?.reduce((s, r) => s + (r.points || 0), 0) || 0)
      if (isOwn) {
        const today = new Date().toISOString().slice(0, 10)
        const { data: w } = await supabase.from('contribution_log').select('id').eq('user_id', userId).eq('action', 'daily_water').gte('created_at', today).maybeSingle()
        setWatered(!!w)
      }
    }
    load()
  }, [userId, isOwn])

  async function handleWater() {
    if (watered) { toast('今天已经浇过水了'); return }
    await supabase.from('contribution_log').insert({ user_id: user.id, action: 'daily_water', points: 10 })
    setTotal((p) => p + 10); setWatered(true); toast.success('浇灌铃兰 +10')
  }

  async function handleRequestInvite() {
    if (total < 500) { toast.error(`还需 ${500 - total} 贡献值`); return }
    await supabase.from('invite_requests').insert({ user_id: user.id })
    toast.success('申请已提交，审核后发放邀请码')
  }

  if (!userId) return null

  return (
    <div className="bg-surface rounded-card shadow-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-secondary text-xs font-medium flex items-center gap-1"><Star size={14} className="text-warning" /> 贡献值</h3>
        <span className="text-accent font-display text-lg">{total}</span>
      </div>
      {isOwn && (
        <div className="flex items-center gap-2">
          <button onClick={handleWater} disabled={watered}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-button border transition-colors ${watered ? 'bg-hover text-muted cursor-default' : 'border-accent/30 text-accent hover:bg-accent/10'}`}>
            <Droplets size={14} /> {watered ? '已浇水' : '浇灌铃兰'}
          </button>
          <button onClick={handleRequestInvite}
            className={`flex items-center gap-1 text-xs px-3 py-1.5 rounded-button border transition-colors ${total < 500 ? 'bg-hover text-muted' : 'border-warning/30 text-warning hover:bg-warning/10'}`}>
            <Gift size={14} /> {total < 500 ? `${500 - total}后可申请` : '申请邀请码'}
          </button>
        </div>
      )}
    </div>
  )
}
