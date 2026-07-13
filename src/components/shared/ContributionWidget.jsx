import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Link } from 'react-router-dom'
import { Star, Flower } from 'lucide-react'

export default function ContributionWidget({ userId, isOwn }) {
  const [total, setTotal] = useState(0)
  const [sacrificed, setSacrificed] = useState(0)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('contribution_log').select('points').eq('user_id', userId)
      setTotal(data?.reduce((s, r) => s + (r.points || 0), 0) || 0)
      const { data: garden } = await supabase.from('lily_garden').select('propagated_count').eq('user_id', userId).maybeSingle()
      setSacrificed(garden?.propagated_count || 0)
    }
    load()
  }, [userId])

  const progress = Math.min(total / 400 * 100, 100)

  return (
    <div className="bg-surface rounded-card shadow-card p-4 mb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-secondary text-xs font-medium flex items-center gap-1">
          <Star size={14} className="text-warning" /> 贡献值
        </h3>
        <Link to="/lily-garden" className="text-accent text-xs hover:underline flex items-center gap-1">
          <Flower size={12} /> 花园
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-accent font-display text-xl">{total}</span>
        <div className="flex-1 bg-hover rounded-full h-2 overflow-hidden">
          <div className="bg-accent h-full rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-muted text-[10px]">{sacrificed} 株铃兰</span>
      </div>
    </div>
  )
}
