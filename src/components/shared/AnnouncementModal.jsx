import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { renderMarkdown } from '@/lib/markdown'
import { AlertTriangle } from 'lucide-react'

export default function AnnouncementModal() {
  const { user } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [current, setCurrent] = useState(0)
  const [countdown, setCountdown] = useState(5)

  // 每个公告重置倒计时
  useEffect(() => {
    setCountdown(5)
  }, [current])

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const t = setInterval(() => setCountdown((c) => c - 1), 1000)
    return () => clearInterval(t)
  }, [countdown])

  // 加载未读公告
  useEffect(() => {
    if (!user) return
    async function load() {
      const { data: all } = await supabase
        .from('announcements').select('*')
        .eq('is_published', true).lte('publish_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (!all || all.length === 0) return

      const { data: viewed } = await supabase
        .from('announcement_views').select('announcement_id').eq('user_id', user.id)

      const viewedIds = new Set((viewed || []).map((v) => v.announcement_id))
      const unread = all.filter((a) => !viewedIds.has(a.id))
      if (unread.length > 0) setAnnouncements(unread)
    }
    load()
  }, [user])

  async function handleConfirm() {
    if (countdown > 0) return
    const ann = announcements[current]
    await supabase.from('announcement_views').upsert({
      announcement_id: ann.id, user_id: user.id, confirmed_at: new Date().toISOString(),
    }, { onConflict: 'announcement_id,user_id' })

    if (current + 1 < announcements.length) {
      setCurrent((c) => c + 1)
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
      <div className="relative bg-surface rounded-card shadow-elevated w-full max-w-lg max-h-[85vh] flex flex-col mx-2">
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h2 className="flex items-center gap-2 text-accent font-display text-lg">
            <AlertTriangle size={20} /> {catLabels[ann.category] || '公告'}
          </h2>
          <span className="text-muted text-xs">{current + 1}/{announcements.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 prose max-w-none text-secondary text-sm">
          <h1 className="text-accent">{ann.title}</h1>
          {renderMarkdown(ann.content)}
          <p className="text-muted text-xs mt-4">
            发布于 {new Date(ann.publish_at).toLocaleString('zh-CN')}
          </p>
        </div>

        <div className="p-4 border-t border-border shrink-0">
          <button onClick={handleConfirm} disabled={countdown > 0}
            className={`w-full py-2.5 rounded-button font-medium text-sm transition-all ${countdown > 0 ? 'bg-hover text-muted cursor-not-allowed' : 'bg-accent text-text-inverse hover:opacity-90'}`}>
            {countdown > 0 ? `${countdown} 秒后可确认` : '我已阅读并确认公告内容'}
          </button>
        </div>
      </div>
    </div>
  )
}
