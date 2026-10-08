/**
 * 创作区主页 — 作品列表（游标分页）+ 筛选 + 排序 + 搜索
 *
 * 数据加载策略：
 * - 时间排序：PostgREST 游标分页（每页 20 条，"加载更多"），支持内容类型/AI 过滤
 * - 热度排序：数据库 RPC get_hot_creations 服务端计算 Top 50
 * - 搜索：数据库 RPC search_creations（标题/作者/标签，最多 50 条）
 * - 点赞数仅对当前页 id 做有界 in 查询
 *
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, border-border, font-display
 */
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import CreationCard from '@/components/creation/CreationCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Palette, Plus, Search, Clock, Flame, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20
const HOT_LIMIT = 50
const SEARCH_LIMIT = 50

const CONTENT_FILTERS = [
  { key: 'all', label: '全部' }, { key: 'text', label: '文' }, { key: 'image', label: '图' }, { key: 'video', label: '视频' },
]

export default function CreationPage() {
  const { profile } = useAuth()
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [contentFilter, setContentFilter] = useState('all')
  const [sort, setSort] = useState('time')
  const [timeOrder, setTimeOrder] = useState('desc')
  const [search, setSearch] = useState('')
  const searchSkipped = useRef(false)

  const isSearching = search.trim().length > 0
  const hideAi = !!profile?.hide_ai

  useEffect(() => { fetchFirstPage() }, [contentFilter, sort, timeOrder, hideAi])

  useEffect(() => {
    if (loading) return
    const y = sessionStorage.getItem('scroll-creation')
    if (y) { requestAnimationFrame(() => { window.scrollTo(0, parseInt(y)); sessionStorage.removeItem('scroll-creation') }) }
  }, [loading])

  /** 为已加载的作品补充点赞数（仅查询当前页 id，有界） */
  async function enrichCreations(list) {
    if (!list.length) return list
    const ids = list.map((c) => c.id)
    const { data: likes } = await supabase.from('likes').select('target_id').eq('target_type', 'creation').in('target_id', ids)
    const likeMap = {}; (likes || []).forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })
    return list.map((c) => ({ ...c, like_count: likeMap[c.id] || 0 }))
  }

  async function fetchFirstPage() {
    setLoading(true)
    setCreations([]); setHasMore(false); setCursor(null)

    // 搜索模式：服务端搜索（标题/作者/标签），最多 50 条
    if (isSearching) {
      const { data } = await supabase.rpc('search_creations', {
        p_query: search.trim(), p_limit: SEARCH_LIMIT, p_content_type: contentFilter, p_hide_ai: hideAi,
      })
      setCreations(await enrichCreations((data || []).map((r) => ({ ...r.creation, author: r.author }))))
      setLoading(false)
      return
    }

    // 热度模式：数据库计算 Top 50
    if (sort === 'hot') {
      const { data } = await supabase.rpc('get_hot_creations', { p_limit: HOT_LIMIT, p_content_type: contentFilter, p_hide_ai: hideAi })
      setCreations(await enrichCreations((data || []).map((r) => ({ ...r.creation, author: r.author }))))
      setLoading(false)
      return
    }

    // 时间模式：游标分页第一页
    let query = supabase.from('creations')
      .select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false).neq('hidden', true)
      .order('created_at', { ascending: timeOrder === 'asc' })
      .limit(PAGE_SIZE)
    if (contentFilter !== 'all') query = query.eq('content_type', contentFilter)
    // 用户屏蔽 AI 时过滤 AI 作品
    if (hideAi) query = query.neq('is_ai', true)
    const { data } = await query
    const page = data || []
    setCreations(await enrichCreations(page))
    setHasMore(page.length === PAGE_SIZE)
    if (page.length) setCursor(page[page.length - 1].created_at)
    setLoading(false)
  }

  /** 加载下一页（仅时间模式） */
  async function loadMore() {
    if (!cursor || loadingMore || isSearching || sort !== 'time') return
    setLoadingMore(true)
    let query = supabase.from('creations')
      .select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false).neq('hidden', true)
      .order('created_at', { ascending: timeOrder === 'asc' })
      .limit(PAGE_SIZE)
    query = timeOrder === 'desc' ? query.lt('created_at', cursor) : query.gt('created_at', cursor)
    if (contentFilter !== 'all') query = query.eq('content_type', contentFilter)
    if (hideAi) query = query.neq('is_ai', true)
    const { data } = await query
    const page = await enrichCreations(data || [])
    setCreations((prev) => [...prev, ...page])
    setHasMore((data || []).length === PAGE_SIZE)
    if ((data || []).length) setCursor(data[data.length - 1].created_at)
    setLoadingMore(false)
  }

  // 搜索防抖（跳过首次挂载）
  useEffect(() => {
    if (!searchSkipped.current) { searchSkipped.current = true; return }
    const t = setTimeout(() => { fetchFirstPage() }, 400)
    return () => clearTimeout(t)
  }, [search])

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
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="搜索创作 / 作者..." className="w-full bg-surface border border-border rounded-input pl-8 pr-3 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          {CONTENT_FILTERS.map((f) => (
            <button key={f.key} onClick={() => setContentFilter(f.key)} className={cn('px-3 py-1.5 rounded-full text-xs transition-colors', contentFilter === f.key ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>{f.label}</button>
          ))}
          <button onClick={() => { if (sort === 'time') setTimeOrder((p) => p === 'desc' ? 'asc' : 'desc'); else { setSort('time'); setTimeOrder('desc') } }} className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs', sort === 'time' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}><Clock size={12} /> 按时间{sort === 'time' && (timeOrder === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}</button>
          <button onClick={() => { if (sort !== 'hot') setSort('hot') }} className={cn('flex items-center gap-1 px-3 py-1.5 rounded-full text-xs', sort === 'hot' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}><Flame size={12} /> 热度</button>
        </div>
      </div>

      <div>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
         : creations.length === 0 ? <EmptyState icon={Palette} title={search ? '未找到匹配的作品' : '暂无作品'} description={search ? '' : '成为第一个发布创作的人吧！'} action={!search && <Link to="/creation/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">发布创作</Link>} />
         : (
           <>
             {isSearching && <p className="text-muted text-xs mb-2">搜索结果最多显示 {SEARCH_LIMIT} 条</p>}
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">{creations.map((c) => <CreationCard key={c.id} creation={c} />)}</div>
             {hasMore && sort === 'time' && !isSearching && (
               <div className="flex justify-center pt-4">
                 <button onClick={loadMore} disabled={loadingMore}
                   className="bg-surface border border-border text-secondary text-sm px-6 py-2 rounded-full hover:bg-hover transition-colors disabled:opacity-50">
                   {loadingMore ? '加载中...' : '加载更多'}
                 </button>
               </div>
             )}
           </>
         )}
      </div>
    </div>
  )
}
