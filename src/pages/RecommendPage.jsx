import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import PostCard from '@/components/discussion/PostCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ExternalLink, Plus, Clock, Flame, ArrowDown, ArrowUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function RecommendPage() {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [sort, setSort] = useState('time')
  const [timeOrder, setTimeOrder] = useState('desc')
  const [search, setSearch] = useState('')

  useEffect(() => { fetchPosts() }, [sort, timeOrder])

  async function fetchPosts() {
    setLoading(true)
    const { data } = await supabase.from('posts')
      .select('*, author:profiles!posts_author_id_fkey(username, display_name, avatar_url)')
      .eq('is_deleted', false).eq('category', 'recommend').neq('hidden', true)

    if (!data) { setLoading(false); return }
    const postIds = data.map((p) => p.id)
    const [{ data: comments }, { data: likes }] = await Promise.all([
      supabase.from('comments').select('post_id').in('post_id', postIds).eq('is_deleted', false),
      supabase.from('likes').select('target_id').eq('target_type', 'post').in('target_id', postIds),
    ])
    const commentMap = {}; comments?.forEach((c) => { commentMap[c.post_id] = (commentMap[c.post_id] || 0) + 1 })
    const likeMap = {}; likes?.forEach((l) => { likeMap[l.target_id] = (likeMap[l.target_id] || 0) + 1 })

    let enriched = data.map((p) => {
      const c = commentMap[p.id] || 0; const l = likeMap[p.id] || 0
      const age = Math.max((Date.now() - new Date(p.created_at).getTime()) / 3600000, 0.1)
      return { ...p, comment_count: c, like_count: l, hotness: (l + c) / age }
    })

    enriched.sort((a, b) => (b.is_pinned ? 1 : 0) - (a.is_pinned ? 1 : 0))
    if (sort === 'time') enriched.sort((a, b) => timeOrder === 'desc' ? new Date(b.created_at) - new Date(a.created_at) : new Date(a.created_at) - new Date(b.created_at))
    else enriched.sort((a, b) => b.hotness - a.hotness)

    setPosts(enriched)
    setLoading(false)
  }

  const filtered = posts.filter((p) => !search.trim() || p.title.toLowerCase().includes(search.trim().toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-display text-accent text-2xl flex items-center gap-2">
            <ExternalLink size={24} /> 外网推荐
          </h1>
          <p className="text-muted text-sm mt-1">推荐你喜欢的海外创作者（平台、画师、作者等），作为浏览指引。R18内容请注明。</p>
        </div>
        <Link to="/recommend/new"
          className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90">
          <Plus size={16} /> 推荐作者
        </Link>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <button onClick={() => { if (sort === 'time') setTimeOrder((p) => p === 'desc' ? 'asc' : 'desc'); else { setSort('time'); setTimeOrder('desc') } }}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs', sort === 'time' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
          <Clock size={12} /> 按时间{sort === 'time' && (timeOrder === 'desc' ? <ArrowDown size={10} /> : <ArrowUp size={10} />)}
        </button>
        <button onClick={() => setSort('hot')}
          className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs', sort === 'hot' ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover')}>
          <Flame size={12} /> 按热度
        </button>
      </div>

      <div className="relative mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索推荐..." className="w-full bg-surface border border-border rounded-input pl-4 pr-4 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
      </div>

      {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
       : filtered.length === 0 ? (
        <EmptyState icon={ExternalLink} title="暂无推荐" description="成为第一个分享海外创作者的人吧！"
          action={<Link to="/recommend/new" className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline">推荐作者</Link>} />
      ) : (
        <div className="space-y-3">{filtered.map((post) => <PostCard key={post.id} post={post} />)}</div>
      )}
    </div>
  )
}
