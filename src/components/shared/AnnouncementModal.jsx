import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { renderMarkdown } from '@/lib/markdown'
import { AlertTriangle } from 'lucide-react'

export default function AnnouncementModal() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [current, setCurrent] = useState(0)
  const [scrolledBottom, setScrolledBottom] = useState(false)
  const contentRef = useRef(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: all } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_published', true)
        .lte('publish_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (!all || all.length === 0) return

      const { data: viewed } = await supabase
        .from('announcement_views')
        .select('announcement_id')
        .eq('user_id', user.id)

      const viewedIds = new Set((viewed || []).map((v) => v.announcement_id))
      const unread = all.filter((a) => !viewedIds.has(a.id))
      if (unread.length > 0) setAnnouncements(unread)
    }
    load()
  }, [user])

  function handleScroll() {
    const el = contentRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setScrolledBottom(true)
    }
  }

  async function handleConfirm() {
    if (!scrolledBottom) return
    const ann = announcements[current]
    await supabase.from('announcement_views').upsert({
      announcement_id: ann.id,
      user_id: user.id,
      confirmed_at: new Date().toISOString(),
    }, { onConflict: 'announcement_id,user_id' })

    if (current + 1 < announcements.length) {
      setCurrent((c) => c + 1)
      setScrolledBottom(false)
    } else {
      setAnnouncements([])
    }
  }

  if (announcements.length === 0) return null

  const ann = announcements[current]
  const catLabels = { general: '总公告', update: '更新公告', violation: '违规公示' }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" />
      <div className="relative bg-surface rounded-card shadow-elevated w-full max-w-lg max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="flex items-center gap-2 text-accent font-display text-lg">
            <AlertTriangle size={20} /> {catLabels[ann.category] || '公告'}
          </h2>
          <span className="text-muted text-xs">{current + 1}/{announcements.length}</span>
        </div>

        <div ref={contentRef} onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 prose max-w-none text-secondary text-sm">
          <h1 className="text-accent">{ann.title}</h1>
          {renderMarkdown(ann.content)}
          <p className="text-muted text-xs mt-4">
            发布于 {new Date(ann.publish_at).toLocaleString('zh-CN')}
          </p>
          {!scrolledBottom && (
            <div className="text-center py-4 text-muted text-xs animate-pulse">
              请继续向下滚动阅读完整内容
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button onClick={handleConfirm} disabled={!scrolledBottom}
            className="w-full bg-accent text-text-inverse py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-30 transition-all">
            {scrolledBottom ? '我已阅读并确认公告内容' : '请先滚动阅读完整公告'}
          </button>
        </div>
      </div>
    </div>
  )
}
