/**
 * 通知数据 Hook
 */
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

export function useNotifications() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setLoading(false); return }

    async function fetch() {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (!error && data) {
        setNotifications(data)
        setUnreadCount(data.filter((n) => !n.is_read).length)
      }
      setLoading(false)
    }
    fetch()
  }, [user])

  async function markAsRead(notificationId) {
    await supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    )
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  return { notifications, unreadCount, loading, markAsRead }
}
