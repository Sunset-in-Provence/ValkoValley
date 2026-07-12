import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { Bell, X, Mail, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotificationBell() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [notifCount, setNotifCount] = useState(0)
  const [msgCount, setMsgCount] = useState(0)

  const fetch = useCallback(async () => {
    if (!user) return
    const [{ count: n }, { count: m }] = await Promise.all([
      supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false),
    ])
    setNotifCount(n || 0)
    setMsgCount(m || 0)
  }, [user])

  useEffect(() => { fetch() }, [fetch])

  // 监听外部事件
  useEffect(() => {
    const h = () => fetch()
    window.addEventListener('msg-unread-change', h)
    return () => window.removeEventListener('msg-unread-change', h)
  }, [fetch])

  const totalBadge = notifCount + msgCount
  const fmt = (n) => n > 99 ? '99+' : n

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
          <div className="absolute right-0 top-full mt-2 bg-surface rounded-card shadow-elevated border border-border z-50 max-h-[70vh] overflow-y-auto" style={{ width: 'calc(100vw - 2rem)', maxWidth: '280px' }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-secondary text-sm font-medium">通知中心</h4>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-secondary"><X size={14} /></button>
            </div>

            {/* 私信 */}
            <button onClick={() => { setOpen(false); navigate('/messages') }}
              className="w-full flex items-center justify-between px-4 py-3 border-b border-border hover:bg-hover transition-colors">
              <span className="flex items-center gap-2 text-secondary text-sm">
                <Mail size={15} /> 私信
              </span>
              {msgCount > 0 && <span className="bg-danger text-text-inverse text-xs px-2 py-0.5 rounded-full font-bold">{fmt(msgCount)}</span>}
            </button>

            {/* 系统通知 */}
            <button onClick={async () => {
              // 标记通知已读
              await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false)
              setNotifCount(0)
              setOpen(false)
              // 这里可以跳转到一个通知详情页，暂时先标记已读
            }}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-hover transition-colors">
              <span className="flex items-center gap-2 text-secondary text-sm">
                <AlertTriangle size={15} /> 系统通知
              </span>
              {notifCount > 0 && <span className="bg-danger text-text-inverse text-xs px-2 py-0.5 rounded-full font-bold">{fmt(notifCount)}</span>}
            </button>

            {notifCount === 0 && msgCount === 0 && (
              <p className="text-muted text-xs text-center py-6">暂无新通知</p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
