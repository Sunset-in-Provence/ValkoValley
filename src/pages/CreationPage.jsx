/**
 * 创作区主页 — 作品列表 + 分级筛选 + 标签云
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-full, shadow-card, font-display, border-border
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import CreationCard from '@/components/creation/CreationCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Palette, Plus, Search, Flame } from 'lucide-react'
import { cn } from '@/lib/utils'

const RATING_FILTERS = [
  { key: 'all', label: '全部' },
  { key: 'general', label: '全年龄' },
  { key: '15plus', label: '15+' },
  { key: '18plus', label: '18+' },
]

const SORT_OPTIONS = [
  { key: 'latest', label: '最新' },
  { key: 'views', label: '最多浏览' },
  { key: 'likes', label: '最多赞' },
  { key: 'hot', label: '最热' },
]

export default function CreationPage() {
  const [creations, setCreations] = useState([])
  const [loading, setLoading] = useState(true)
  const [ratingFilter, setRatingFilter] = useState('all')
  const [sort, setSort] = useState('latest')
  const [search, setSearch] = useState('')
  const [popularTags, setPopularTags] = useState([])

  useEffect(() => { fetchData() }, [ratingFilter, sort])

  async function fetchData() {
    setLoading(true)
    let query = supabase
      .from('creations')
      .select('*, author:profiles!creations_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false)

    if (ratingFilter !== 'all') query = query.eq('rating', ratingFilter)
    if (sort === 'latest') query = query.order('created_at', { ascending: false })
    else query = query.order('view_count', { ascending: false })

    const { data } = await query
    let enriched = data || []

    // 获取点赞数
    if (enriched.length > 0) {
      const ids = enriched.map((c) => c.id)
      const { data: likes } = await supabase
        .from('likes')
        .select('target_id')
        .eq('target_type', 'creation')
        .in('target_id', ids)
      const likeMap = {}
      likes?.forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })

      enriched = enriched.map((c) => {
        const l = likeMap[c.id] || 0
        const age = (Date.now() - new Date(c.created_at).getTime()) / 3600000
        const hotness = age > 0 ? (l * 2 + (c.view_count || 0) * 0.5) / Math.pow(age + 1, 1.2) : l * 2
        return { ...c, like_count: l, hotness }
      })

      if (sort === 'likes') enriched.sort((a, b) => b.like_count - a.like_count)
      else if (sort === 'hot') enriched.sort((a, b) => b.hotness - a.hotness)
    }

    setCreations(enriched)
    setLoading(false)

    // 聚合标签云
    const tagCount = {}
    enriched.forEach((c) => {
      (c.tags || []).forEach((t) => {
        if (!['原创', '二创'].includes(t)) tagCount[t] = (tagCount[t] || 0) + 1
      })
    })
    setPopularTags(
      Object.entries(tagCount)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([name, count]) => ({ name, count }))
    )
  }

  const filtered = creations.filter((c) =>
    !search || c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-accent text-2xl">🎨 创作区</h1>
        <Link to="/creation/new"
          className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90">
          <Plus size={16} /> 发布创作
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-6">
        <div>
          {/* 搜索 + 筛选 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="搜索创作..." className="w-full bg-hover border border-border rounded-input pl-8 pr-3 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
            </div>
            <div className="flex gap-1">
              {RATING_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setRatingFilter(f.key)}
                  className={cn('px-3 py-1.5 rounded-full text-xs transition-colors',
                    ratingFilter === f.key ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex gap-1">
              {SORT_OPTIONS.map((s) => (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className={cn('px-3 py-1.5 rounded-full text-xs transition-colors',
                    sort === s.key ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Palette} title="暂无作品" description="成为第一个发布创作的人吧！"
              action={<Link to="/creation/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">发布创作</Link>} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((c) => <CreationCard key={c.id} creation={c} />)}
            </div>
          )}
        </div>

        {/* 侧边：标签云 */}
        <aside className="hidden lg:block">
          <div className="bg-surface rounded-card shadow-card p-4 sticky top-20">
            <h3 className="text-secondary text-sm font-medium mb-3">🏷️ 热门标签</h3>
            {popularTags.length === 0 ? (
              <p className="text-muted text-xs">暂无标签</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {popularTags.map((tag) => (
                  <button key={tag.name} onClick={() => setSearch(tag.name)}
                    className="bg-hover text-secondary text-xs px-2 py-1 rounded-full hover:bg-accent/10 hover:text-accent transition-colors">
                    {tag.name}
                    <span className="text-muted ml-1">{tag.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
