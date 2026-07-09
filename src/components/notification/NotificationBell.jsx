/**
 * 通知铃铛 — 顶部导航栏使用
 * UI 变量映射：text-secondary, text-muted, text-accent, text-danger, bg-accent,
 *   rounded-card, rounded-full, shadow-elevated, border-border
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import { Bell, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead } = useNotifications()
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}
        className="relative p-2 rounded-button text-secondary hover:bg-hover transition-colors">
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-text-inverse text-[10px] rounded-full flex items-center justify-center font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-card shadow-elevated border border-border z-50 max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h4 className="text-secondary text-sm font-medium">通知</h4>
              <button onClick={() => setOpen(false)} className="text-muted hover:text-secondary"><X size={14} /></button>
            </div>
            {notifications.length === 0 ? (
              <p className="text-muted text-xs text-center py-8">暂无通知</p>
            ) : (
              notifications.slice(0, 20).map((n) => (
                <button
                  key={n.id}
                  onClick={() => { markAsRead(n.id); setOpen(false); navigate(`/user/${n.related_username || ''}`) }}
                  className={cn('w-full text-left px-4 py-3 border-b border-border last:border-0 hover:bg-hover transition-colors',
                    !n.is_read && 'bg-accent/5'
                  )}>
                  <p className="text-secondary text-xs font-medium mb-0.5">{n.title}</p>
                  <p className="text-muted text-xs line-clamp-1">{n.content}</p>
                  <p className="text-muted text-[10px] mt-1">{new Date(n.created_at).toLocaleString('zh-CN')}</p>
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
