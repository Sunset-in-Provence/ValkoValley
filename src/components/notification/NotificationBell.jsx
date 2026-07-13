import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { Bell, X, Mail, MessageSquare, Heart } from 'lucide-react'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [msgCount, setMsgCount] = useState(0)

  const fetch = useCallback(async () => {
    if (!user) return
    const [{ data: notes }, { count: m }] = await Promise.all([
      supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
    ])
    setNotifications(notes || [])
    setMsgCount(m || 0)
  }, [user])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => { const h = () => fetch(); window.addEventListener('msg-unread-change', h); return () => window.removeEventListener('msg-unread-change', h) }, [fetch])

  const notifUnread = notifications.filter((n) => !n.is_read).length
  const totalBadge = notifUnread + msgCount
  const fmt = (n) => n > 99 ? '99+' : n

  async function handleClick(note) {
    if (!note.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', note.id)
      setNotifications((prev) => prev.map((n) => n.id === note.id ? { ...n, is_read: true } : n))
    }
    setOpen(false)
    if (note.link) navigate(note.link)
  }

  async function markAllRead() {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  return (
    <div className="relative">
      <button onClick={() => { setOpen(!open); if (!open) fetch() }}
        className="relative p-1.5 sm:p-2 rounded-button text-secondary hover:bg-hover transition-colors">
        <Bell size={18} />
        {totalBadge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-danger text-text-inverse text-[10px] rounded-full flex items-center justify-center font-bold px-1">
            {fmt(totalBadge)}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-surface rounded-card shadow-elevated border border-border z-50 max-h-[70vh] overflow-y-auto overflow-x-hidden w-[90vw] max-w-[320px]">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border sticky top-0 bg-surface z-10">
              <h4 className="text-secondary text-sm font-medium">通知</h4>
              <div className="flex items-center gap-2">
                {notifUnread > 0 && <button onClick={markAllRead} className="text-accent text-xs hover:underline">全部已读</button>}
                <button onClick={() => setOpen(false)} className="text-muted hover:text-secondary"><X size={14} /></button>
              </div>
            </div>

            {/* 私信 */}
            <button onClick={() => { setOpen(false); navigate('/messages') }}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-hover transition-colors">
              <span className="flex items-center gap-2 text-secondary text-sm"><Mail size={15} /> 私信</span>
              {msgCount > 0 && <span className="bg-danger text-text-inverse text-xs px-2 py-0.5 rounded-full font-bold">{fmt(msgCount)}</span>}
            </button>

            {/* 系统通知 */}
            {notifications.length === 0 ? (
              <p className="text-muted text-xs text-center py-6">暂无通知</p>
            ) : (
              notifications.slice(0, 15).map((note) => (
                <button key={note.id}
                  onClick={() => handleClick(note)}
                  className={`w-full text-left px-4 py-3 border-b border-border/50 hover:bg-hover transition-colors flex items-start gap-3 ${!note.is_read ? 'bg-accent/5' : ''}`}>
                  <div className="shrink-0 mt-0.5">
                    {note.title?.includes('点赞') ? <Heart size={15} className="text-danger" /> :
                     note.title?.includes('评论') ? <MessageSquare size={15} className="text-info" /> :
                     <Bell size={15} className="text-muted" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-secondary text-xs font-medium">{note.title}</p>
                    <p className="text-muted text-xs truncate">{note.content}</p>
                    <p className="text-muted text-[10px] mt-0.5">{new Date(note.created_at).toLocaleString('zh-CN')}</p>
                  </div>
                  {!note.is_read && <div className="w-2 h-2 rounded-full bg-accent shrink-0 mt-1.5" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
