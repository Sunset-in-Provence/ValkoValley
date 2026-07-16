import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LibraryCard from '@/components/library/LibraryCard'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { renderMarkdown } from '@/lib/markdown'
import { Plus, Search, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const MAIN = [
  { key: 'lore', label: '设定', subs: [
    { key: 'lore_official', label: '官方设定' }, { key: 'lore_rumor', label: '坊间传闻' }
  ]},
  { key: 'gallery', label: '图鉴', subs: [
    { key: 'gallery_promo', label: '宣图' }, { key: 'gallery_card', label: '卡面', children: [
      { key: 'gallery_card_day', label: '日卡' }, { key: 'gallery_card_month', label: '月卡' }
    ]}, { key: 'gallery_text', label: '文案' }
  ]},
  { key: 'video', label: '视频', subs: [
    { key: 'video_pv', label: '个人PV', children: [
      { key: 'video_pv_concept', label: '概念短片' },
      { key: 'video_pv_game', label: '不驯者的游戏' },
      { key: 'video_pv_instinct', label: '本能沦陷法则' },
    ]},
    { key: 'video_story', label: '卡面剧情' }, { key: 'video_other', label: '其它' }
  ]},
  { key: 'music', label: '音乐', subs: [
    { key: 'music_official', label: '官方' }, { key: 'music_fan', label: '同人' }
  ]},
]

export default function LibraryPage() {
  const { isAdmin, user } = useAuth()
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
    const keys = []
    m.subs.forEach((s) => {
      keys.push(s.key)
      if (s.children) s.children.forEach((c) => keys.push(c.key))
    })
    const items = filtered.filter((e) => keys.includes(e.category))
    return { ...m, items }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="font-display text-accent text-2xl">档案馆</h1>
          <p className="text-muted text-sm mt-1">敖尹官方设定资料存档 · 社区共建</p></div>
        <div className="flex gap-2">
          {isAdmin && <Link to="/library/new" className="flex items-center gap-1 bg-accent text-text-inverse px-2 sm:px-4 py-1.5 sm:py-2 rounded-button text-xs sm:text-sm no-underline hover:opacity-90 whitespace-nowrap"><Plus size={14} /> 添加条目</Link>}
          <Link to="/library/submit" className="flex items-center gap-1 border border-border text-secondary px-2 sm:px-4 py-1.5 sm:py-2 rounded-button text-xs sm:text-sm no-underline hover:bg-hover whitespace-nowrap"><Plus size={14} /> 投稿</Link>
        </div>
      </div>

      {/* 搜索栏 — 浮动吸顶 */}
      <div style={{ position: 'sticky', top: '3.5rem', zIndex: 30 }} className="bg-primary/95 backdrop-blur-sm pb-3">
        <div className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="搜索设定..." value={search} onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-surface border border-border rounded-input pl-9 pr-4 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
        </div>
      </div>

      <div className="flex gap-6">
        <div className="w-40 sm:w-44 shrink-0">
          <div className="bg-surface rounded-card shadow-card p-3 sticky top-[5.5rem]">
            <nav className="flex flex-col gap-1">
              {MAIN.map((m) => (
                <div key={m.key}>
                  <button onClick={() => document.getElementById('sec-' + m.key)?.scrollIntoView({ behavior: 'smooth' })}
                    className="w-full text-left px-2 py-1.5 rounded-button text-sm font-medium text-secondary hover:text-accent hover:bg-hover transition-colors">
                    {m.label}
                  </button>
                  <div className="flex flex-col gap-0.5 ml-2">
                    {m.subs.map((s) => (
                      <div key={s.key}>
                        <button
                          onClick={() => document.getElementById('sub-' + s.key)?.scrollIntoView({ behavior: 'smooth' })}
                          className="text-left w-full px-2 py-1 rounded-button text-xs text-muted hover:text-secondary hover:bg-hover transition-colors">
                          {s.label}
                        </button>
                        {s.children && s.children.map((c) => (
                          <button key={c.key}
                            onClick={() => document.getElementById('sub-' + c.key)?.scrollIntoView({ behavior: 'smooth' })}
                            className="text-left w-full pl-4 py-0.5 rounded-button text-[10px] text-muted hover:text-secondary hover:bg-hover transition-colors">
                            {c.label}
                          </button>
                        ))}
                      </div>
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
              {group.key === 'lore' ? (
                group.subs.map((sub) => {
                  const items = group.items.filter((e) => e.category === sub.key)
                  if (items.length === 0) return null
                  return (
                    <div key={sub.key} id={'sub-' + sub.key} className="mb-8 scroll-mt-20">
                      <h3 className="text-secondary text-sm font-medium mb-3">{sub.label}</h3>
                      {items.map((e) => (
                        <div key={e.id} className="bg-surface rounded-card shadow-card p-6 md:p-10 mb-4">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-display text-accent text-2xl">{e.title}</h4>
                            <div className="flex items-center gap-3">
                              {user && (
                                <Link to={`/library/${e.id}/edit`}
                                  className="flex items-center gap-1 text-muted text-xs hover:text-accent no-underline">
                                  <Edit3 size={12} /> 编辑
                                </Link>
                              )}
                              {isAdmin && (
                                <button onClick={async () => {
                                  if (!window.confirm('删除此设定？')) return
                                  const { error } = await supabase.rpc('delete_library_entry', { _id: e.id })
                                  if (error) toast.error('删除失败')
                                  else { toast.success('已删除'); fetch() }
                                }}
                                  className="flex items-center gap-1 text-muted text-xs hover:text-danger">
                                  <Trash2 size={12} /> 删除
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="prose max-w-none text-secondary text-sm leading-relaxed">
                            {e.content ? renderMarkdown(e.content) : <p className="text-muted italic">暂无内容，点击编辑补充</p>}
                          </div>
                          {e.author && (
                            <p className="text-muted text-xs mt-6 pt-4 border-t border-border">
                              最后编辑：{e.author.display_name || e.author.username} · {new Date(e.updated_at || e.created_at).toLocaleString('zh-CN')}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )
                })
              ) : (
                group.subs.map((sub) => {
                  const items = group.items.filter((e) => e.category === sub.key)
                  const childItems = sub.children ? sub.children.flatMap((c) => group.items.filter((e) => e.category === c.key)) : []
                  const allItems = [...items, ...childItems]
                  if (allItems.length === 0 && !sub.children) return null
                  return (
                    <div key={sub.key} id={'sub-' + sub.key} className="mb-6 scroll-mt-20">
                      <h3 className="text-secondary text-sm font-medium mb-3">{sub.label}</h3>
                      {sub.children && sub.children.map((c) => {
                        const ci = group.items.filter((e) => e.category === c.key)
                        if (ci.length === 0) return null
                        return (
                          <div key={c.key} id={'sub-' + c.key} className="mb-4 scroll-mt-20">
                            <h4 className="text-muted text-xs font-medium mb-2">{c.label}</h4>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                              {ci.map((e) => <LibraryCard key={e.id} entry={e} />)}
                            </div>
                          </div>
                        )
                      })}
                      {items.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                          {items.map((e) => <LibraryCard key={e.id} entry={e} />)}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            {group.items.length === 0 && <p className="text-muted text-sm py-8 text-center">暂无内容</p>}
          </div>
        ))
      )}
        </div>
      </div>
    </div>
  )
}
