import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LibraryCard from '@/components/library/LibraryCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Plus, Search } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAIN = [
  { key: 'gallery', label: '图鉴', subs: [
    { key: 'gallery_promo', label: '宣图' }, { key: 'gallery_card', label: '卡面' }, { key: 'gallery_text', label: '文案' }
  ]},
  { key: 'video', label: '视频', subs: [
    { key: 'video_pv', label: '个人PV' }, { key: 'video_story', label: '卡面剧情' }, { key: 'video_other', label: '其它' }
  ]},
  { key: 'music', label: '音乐', subs: [
    { key: 'music_official', label: '官方' }, { key: 'music_fan', label: '同人' }
  ]},
]

export default function LibraryPage() {
  const { isAdmin } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('library_entries')
      .select('*, author:profiles!library_entries_author_id_fkey(username, display_name)')
      .eq('status', 'published')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetch() }, [fetch])

  const filtered = entries.filter((e) =>
    !search || e.title.toLowerCase().includes(search.toLowerCase()) ||
    (e.tags || []).some((t) => t.toLowerCase().includes(search.toLowerCase()))
  )

  const groups = MAIN.map((m) => {
    const keys = m.subs.map((s) => s.key)
    const items = filtered.filter((e) => keys.includes(e.category))
    return { ...m, items }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-accent text-2xl">档案馆</h1>
          <p className="text-muted text-sm mt-1">敖尹官方设定资料存档 · 社区共建</p></div>
        <div className="flex gap-2">
          {isAdmin && <Link to="/library/new" className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm no-underline hover:opacity-90"><Plus size={16} /> 添加条目</Link>}
          <Link to="/library/submit" className="flex items-center gap-1.5 border border-border text-secondary px-4 py-2 rounded-button text-sm no-underline hover:bg-hover"><Plus size={16} /> 投稿</Link>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="搜索设定..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-input pl-9 pr-4 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-44 shrink-0 hidden lg:block">
          <div className="bg-surface rounded-card shadow-card p-3 sticky top-20">
            <nav className="flex flex-col gap-1">
              {MAIN.map((m) => (
                <div key={m.key}>
                  <button onClick={() => document.getElementById('sec-' + m.key)?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full text-left px-2 py-1.5 rounded-button text-sm font-medium text-secondary hover:text-accent hover:bg-hover transition-colors">
                    {m.label}
                  </button>
                  <div className="flex flex-col gap-0.5 ml-2">
                    {m.subs.map((s) => (
                      <button key={s.key}
                        onClick={() => document.getElementById('sub-' + s.key)?.scrollIntoView({ behavior: 'smooth' })}
                        className="text-left px-2 py-1 rounded-button text-xs text-muted hover:text-secondary hover:bg-hover transition-colors">
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </div>
        </div>

        <div className="flex-1 min-w-0">
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div> : (
          groups.map((group) => (
            <div key={group.key} className="mb-10">
              <h2 id={'sec-' + group.key} className={cn('font-display text-lg mb-4 pb-2 border-b-2 text-accent border-accent scroll-mt-20')}>{group.label}</h2>
              {group.subs.map((sub) => {
                const items = group.items.filter((e) => e.category === sub.key)
                if (items.length === 0) return null
                return (
                  <div key={sub.key} id={'sub-' + sub.key} className="mb-6">
                    <h3 className="text-secondary text-sm font-medium mb-3">{sub.label}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                      {items.map((e) => <LibraryCard key={e.id} entry={e} />)}
                  </div>
                </div>
              )
            })}
            {group.items.length === 0 && <p className="text-muted text-sm py-8 text-center">暂无内容</p>}
          </div>
        ))
      )}
        </div>
      </div>
    </div>
  )
}
