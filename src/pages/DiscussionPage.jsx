/**
 * 讨论区主页 — 帖子列表（游标分页）+ 排序 + 搜索
 *
 * 数据加载策略：
 * - 时间排序：PostgREST 游标分页（每页 20 条，"加载更多"），置顶帖单独全量拉取置顶展示
 * - 热度排序：数据库 RPC get_hot_posts 服务端计算 Top 50（不再前端全表算热度）
 * - 搜索：数据库 RPC search_posts（标题/作者，最多 50 条）
 * - 评论数/点赞数仅对当前页 id 做有界 in 查询
 *
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, border-border, font-display
 */
import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import PostCard from '@/components/discussion/PostCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { MessageSquare, Plus, Clock, Flame, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 20
const HOT_LIMIT = 50
const SEARCH_LIMIT = 50

export default function DiscussionPage() {
  const [posts, setPosts] = useState([])
  const [pinned, setPinned] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [cursor, setCursor] = useState(null)
  const [sort, setSort] = useState('time')  // 'time' | 'hot'
  const [timeOrder, setTimeOrder] = useState('desc') // 'desc' | 'asc'
  const [search, setSearch] = useState('')
  const searchSkipped = useRef(false)

  const isSearching = search.trim().length > 0

  // 数据加载完后恢复滚动位置
  useEffect(() => {
    if (loading) return
    const y = sessionStorage.getItem('scroll-discussion')
    if (y) { requestAnimationFrame(() => { window.scrollTo(0, parseInt(y)); sessionStorage.removeItem('scroll-discussion') }) }
  }, [loading])

  /** 为已加载的帖子补充评论数/点赞数（仅查询当前页 id，有界） */
  async function enrichPosts(list) {
    if (!list.length) return list
    const ids = list.map((p) => p.id)
    const [{ data: comments }, { data: likes }] = await Promise.all([
      supabase.from('comments').select('post_id').in('post_id', ids).eq('is_deleted', false),
      supabase.from('likes').select('target_id').eq('target_type', 'post').in('target_id', ids),
    ])
    const commentMap = {}; comments?.forEach((c) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1 })
    const likeMap = {}; likes?.forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })
    return list.map((p) => ({ ...p, comment_count: commentMap[p.id] || 0, like_count: likeMap[p.id] || 0 }))
  }

  /** 置顶帖（数量天然很少，单独全量拉取） */
  async function fetchPinned() {
    const { data } = await supabase
      .from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false).neq('hidden', true).neq('category', 'recommend')
      .eq('is_pinned', true)
      .order('created_at', { ascending: false })
    return enrichPosts(data || [])
  }

  async function fetchFirstPage() {
    setLoading(true)
    setPosts([]); setPinned([]); setHasMore(false); setCursor(null)

    // 搜索模式：服务端搜索，最多 50 条，无分页
    if (isSearching) {
      const { data } = await supabase.rpc('search_posts', { p_query: search.trim(), p_limit: SEARCH_LIMIT })
      setPosts(await enrichPosts((data || []).map((r) => ({ ...r.post, author: r.author }))))
      setLoading(false)
      return
    }

    // 置顶帖在两种排序下都置顶展示
    const pinnedData = await fetchPinned()
    setPinned(pinnedData)
    const pinnedIds = pinnedData.map((p) => p.id)

    // 热度模式：数据库计算 Top 50（去重置顶帖）
    if (sort === 'hot') {
      const { data } = await supabase.rpc('get_hot_posts', { p_limit: HOT_LIMIT })
      const hot = (data || [])
        .map((r) => ({ ...r.post, author: r.author }))
        .filter((p) => !pinnedIds.includes(p.id))
      setPosts(await enrichPosts(hot))
      setLoading(false)
      return
    }

    // 时间模式：游标分页第一页
    let query = supabase.from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false).neq('hidden', true).neq('category', 'recommend')
      .order('created_at', { ascending: timeOrder === 'asc' })
      .limit(PAGE_SIZE)
    if (pinnedIds.length) query = query.not('id', 'in', `(${pinnedIds.join(',')})`)
    const { data } = await query
    const page = data || []
    setPosts(await enrichPosts(page))
    setHasMore(page.length === PAGE_SIZE)
    if (page.length) setCursor(page[page.length - 1].created_at)
    setLoading(false)
  }

  /** 加载下一页（仅时间模式；desc 用 lt 游标取更早，asc 用 gt 取更晚） */
  async function loadMore() {
    if (!cursor || loadingMore || isSearching || sort !== 'time') return
    setLoadingMore(true)
    let query = supabase.from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false).neq('hidden', true).neq('category', 'recommend')
      .order('created_at', { ascending: timeOrder === 'asc' })
      .limit(PAGE_SIZE)
    query = timeOrder === 'desc' ? query.lt('created_at', cursor) : query.gt('created_at', cursor)
    if (pinned.length) query = query.not('id', 'in', `(${pinned.map((p) => p.id).join(',')})`)
    const { data } = await query
    const page = await enrichPosts(data || [])
    setPosts((prev) => [...prev, ...page])
    setHasMore((data || []).length === PAGE_SIZE)
    if ((data || []).length) setCursor(data[data.length - 1].created_at)
    setLoadingMore(false)
  }

  useEffect(() => { fetchFirstPage() }, [sort, timeOrder])

  // 搜索防抖（跳过首次挂载，避免与排序 effect 重复请求）
  useEffect(() => {
    if (!searchSkipped.current) { searchSkipped.current = true; return }
    const t = setTimeout(() => { fetchFirstPage() }, 400)
    return () => clearTimeout(t)
  }, [search])

  function handleTimeClick() {
    if (sort === 'time') {
      setTimeOrder((prev) => prev === 'desc' ? 'asc' : 'desc')
    } else {
      setSort('time')
      setTimeOrder('desc')
    }
  }

  const visiblePosts = [...pinned, ...posts]

  return (
    <div>
      <div className="sticky top-14 z-30 bg-primary/95 backdrop-blur-sm pb-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="font-display text-accent text-2xl">讨论区</h1>
          <Link to="/discussion/new"
            className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90 whitespace-nowrap">
            <Plus size={16} /> 发帖
          </Link>
        </div>
        <div className="flex items-center gap-2 mb-3">
          <button onClick={handleTimeClick}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors',
              sort === 'time' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
            <Clock size={12} /> 按时间排序
            {sort === 'time' && (timeOrder === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}
          </button>
          <button onClick={() => { if (sort !== 'hot') setSort('hot') }}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-colors',
              sort === 'hot' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
            <Flame size={12} /> 热度榜
          </button>
        </div>
        {/* 搜索 */}
        <div className="relative">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索帖子 / 作者…"
            className="w-full bg-surface border border-border rounded-input pl-4 pr-4 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : visiblePosts.length === 0 ? (
        <EmptyState icon={MessageSquare} title={search ? '未找到匹配的帖子' : '还没有帖子'}
          description={search ? '' : '成为第一个发起讨论的人吧！'}
          action={!search && <Link to="/discussion/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">发布第一篇帖子</Link>} />
      ) : (
        <div className="space-y-3">
          {isSearching && <p className="text-muted text-xs">搜索结果最多显示 {SEARCH_LIMIT} 条</p>}
          {visiblePosts.map((post) => <PostCard key={post.id} post={post} />)}
          {hasMore && sort === 'time' && !isSearching && (
            <div className="flex justify-center pt-2">
              <button onClick={loadMore} disabled={loadingMore}
                className="bg-surface border border-border text-secondary text-sm px-6 py-2 rounded-full hover:bg-hover transition-colors disabled:opacity-50">
                {loadingMore ? '加载中...' : '加载更多'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
