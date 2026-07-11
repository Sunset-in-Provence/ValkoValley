import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import CreationCard from '@/components/creation/CreationCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Palette, Plus, Search, Clock, Flame, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const FILTERS = [
  { key: 'all', label: '全部' }, { key: 'text', label: '文' }, { key: 'image', label: '图' }, { key: 'video', label: '视频' },
]

export default function CreationPage() {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('time')
  const [timeOrder, setTimeOrder] = useState('desc')
  const [search, setSearch] = useState('')
  const [tags, setTags] = useState([])

  useEffect(() => { fetchData() }, [filter, sort, timeOrder])

  async function fetchData() {
    setLoading(true)
    let q = supabase.from('creations').select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)').eq('is_deleted', false)
    if (filter !== 'all') q = q.eq('content_type', filter)
    const { data } = await q
    let list = data || []
    if (list.length > 0) {
      const ids = list.map((c) => c.id)
      const { data: likes } = await supabase.from('likes').select('target_id').eq('target_type', 'creation').in('target_id', ids)
      const likeMap = {}; (likes || []).forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })
      list = list.map((c) => { const l = likeMap[c.id] || 0; const age = Math.max((Date.now() - new Date(c.created_at).getTime()) / 3600000, 0.1); return { ...c, like_count: l, hotness: (l + (c.view_count || 0)) / age } })
      if (sort === 'time') list.sort((a, b) => timeOrder === 'desc' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at))
      else list.sort((a, b) => b.hotness - a.hotness)
    }
    setCreations(list)
    setLoading(false)
    const tc = {}; list.forEach((c) => { (c.tags || []).forEach((t) => { if (!['原创', '二创'].includes(t)) tc[t] = (tc[t] || 0) + 1 }) })
    setTags(Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 15).map(([n, c]) => ({ name: n, count: c })))
  }

  const filtered = creations.filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase()) || (c.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase())))

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
      <div className="shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-accent text-2xl">创作区</h1>
          <Link to="/creation/new" className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90 whitespace-nowrap"><Plus size={16} /> 发布创作</Link>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          <div className="relative flex-1 min-w-[140px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索创作..." className="w-full bg-hover border border-border rounded-input pl-8 pr-3 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
          </div>
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)} className={cn('px-3 py-1.5 rounded-full text-xs', filter === f.key ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>{f.label}</button>
          ))}
          <button onClick={() => { if (sort === 'time') setTimeOrder((p) => p === 'desc' ? 'asc' : 'desc'); else { setSort('time'); setTimeOrder('desc') } }} className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs', sort === 'time' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}><Clock size={12} /> 时间{sort === 'time' && (timeOrder === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}</button>
          <button onClick={() => setSort('hot')} className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs', sort === 'hot' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}><Flame size={12} /> 热度</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-w-0">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
          <div>
            {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
             : filtered.length === 0 ? <EmptyState icon={Palette} title="暂无作品" action={<Link to="/creation/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">发布创作</Link>} />
             : <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{filtered.map((c) => <CreationCard key={c.id} creation={c} />)}</div>}
          </div>
          <aside>
            <div className="bg-surface rounded-card shadow-card p-4">
              <h3 className="text-secondary text-sm font-medium mb-3">热门标签</h3>
              {tags.length === 0 ? <p className="text-muted text-xs">暂无标签</p>
               : <div className="flex flex-wrap gap-1.5">{tags.map((t) => <button key={t.name} onClick={() => setSearch(t.name)} className="bg-hover text-secondary text-xs px-2 py-1 rounded-full hover:bg-accent/10 hover:text-accent">{t.name}<span className="text-muted ml-1">{t.count}</span></button>)}</div>}
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
