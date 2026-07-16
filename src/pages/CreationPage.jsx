import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import CreationCard from '@/components/creation/CreationCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Palette, Plus, Search, Clock, Flame, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const CONTENT_FILTERS = [
  { key: 'all', label: '全部' }, { key: 'text', label: '文' }, { key: 'image', label: '图' }, { key: 'video', label: '视频' },
]

export default function CreationPage() {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [contentFilter, setContentFilter] = useState('all')
  const [sort, setSort] = useState('time')
  const [timeOrder, setTimeOrder] = useState('desc')
  const [search, setSearch] = useState('')
  useEffect(() => { fetchData() }, [contentFilter, sort, timeOrder])

  useEffect(() => {
    if (loading) return
    const y = sessionStorage.getItem('scroll-creation')
    if (y) { requestAnimationFrame(() => { window.scrollTo(0, parseInt(y)); sessionStorage.removeItem('scroll-creation') }) }
  }, [loading])

  async function fetchData() {
    setLoading(true)
    let query = supabase.from('creations').select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)').eq('is_deleted', false)
    if (contentFilter !== 'all') query = query.eq('content_type', contentFilter)
    const { data } = await query
    let enriched = data || []
    if (enriched.length > 0) {
      const ids = enriched.map((c) => c.id)
      const { data: likes } = await supabase.from('likes').select('target_id').eq('target_type', 'creation').in('target_id', ids)
      const likeMap = {}; (likes || []).forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })
      enriched = enriched.map((c) => {
        const l = likeMap[c.id] || 0
        const age = Math.max((Date.now() - new Date(c.created_at).getTime()) / 3600000, 0.1)
        return { ...c, like_count: l, hotness: (l + (c.view_count || 0)) / age }
      })
      if (sort === 'time') {
        enriched.sort((a, b) => timeOrder === 'desc' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at))
      } else {
        enriched.sort((a, b) => b.hotness - a.hotness)
      }
    }
    setCreations(enriched)
    setLoading(false)
  }

  const filtered = creations.filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase())))

  return (
    <div>
      <div className="sticky top-14 z-30 bg-primary/95 backdrop-blur-sm pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-accent text-2xl">创作区</h1>
          <Link to="/creation/new" className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90 whitespace-nowrap"><Plus size={16} /> 发布创作</Link>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="relative flex-1 min-w-[140px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索创作..." className="w-full bg-surface border border-border rounded-input pl-8 pr-3 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          {CONTENT_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setContentFilter(f.key)} className={cn('px-3 py-1.5 rounded-full text-xs transition-colors', contentFilter === f.key ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>{f.label}</button>
          ))}
          <button onClick={() => { if (sort === 'time') setTimeOrder((p) => p === 'desc' ? 'asc' : 'desc'); else { setSort('time'); setTimeOrder('desc') } }} className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs', sort === 'time' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}><Clock size={12} /> 按时间{sort === 'time' && (timeOrder === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}</button>
        </div>
      </div>

      <div>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
         : filtered.length === 0 ? <EmptyState icon={Palette} title="暂无作品" description="成为第一个发布创作的人吧！" action={<Link to="/creation/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">发布创作</Link>} />
         : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{filtered.map((c) => <CreationCard key={c.id} creation={c} />)}</div>}
      </div>
    </div>
  )
}
