import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { renderMarkdown } from '@/lib/markdown'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, FileText, Megaphone, AlertTriangle, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'general', label: '总公告', icon: FileText },
  { key: 'update', label: '更新公告', icon: Megaphone },
  { key: 'violation', label: '违规公示', icon: AlertTriangle },
]

export default function AnnouncementsPage() {
  const [activeTab, setActiveTab] = useState('general')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*, author:profiles!announcements_author_id_fkey(username, display_name)')
      .eq('category', activeTab)
      .eq('is_published', true)
      .lte('publish_at', new Date().toISOString())
      .order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }, [activeTab])

  useEffect(() => { fetch() }, [fetch])

  return (
    <div>
      <Link to="/discussion" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent transition-colors shadow-card">
        <ArrowLeft size={16} /> 返回
      </Link>

      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-4">公告中心</h1>

        <div className="flex gap-1 mb-6 border-b border-border">
          {TABS.map((tab) => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={cn('flex items-center gap-1.5 px-4 py-2 text-sm rounded-t-card transition-colors',
                activeTab === tab.key ? 'text-accent border-b-2 border-accent -mb-[2px] font-medium' : 'text-muted hover:text-secondary')}>
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : items.length === 0 ? (
          <p className="text-muted text-sm text-center py-16">暂无公告</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="border border-border rounded-card p-5">
                <h2 className="font-display text-accent text-lg mb-2">{item.title}</h2>
                <div className="flex items-center gap-3 text-muted text-xs mb-3">
                  <span className="flex items-center gap-1"><Clock size={11} /> {new Date(item.publish_at).toLocaleString('zh-CN')}</span>
                  {item.author && <span>发布者：{item.author.display_name || item.author.username}</span>}
                </div>
                <div className="prose max-w-none text-secondary text-sm">
                  {renderMarkdown(item.content)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
