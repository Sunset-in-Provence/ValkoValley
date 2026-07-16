import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { isDeviceBanned } from '@/lib/fingerprint'
import toast from 'react-hot-toast'

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 获取当前 session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    // 监听认证状态变化
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        // 密码重置回调：强制导向重设密码页面
        if (_event === 'PASSWORD_RECOVERY' && window.location.pathname !== '/reset-password') {
          window.location.href = '/reset-password'
          return
        }
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      }
    )

    return () => { listener?.subscription.unsubscribe() }
  }, [])

  useEffect(() => {
    if (user?.email) checkAdmin(user.email)
    else setIsAdmin(false)
  }, [user])

  async function fetchProfile(userId) {
    try {
      const [{ data }, deviceBanned] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        isDeviceBanned(supabase),
      ])

      if (data?.is_banned || deviceBanned) {
        await supabase.auth.signOut()
        setUser(null); setProfile(null)
        toast.error('您的账号已被封禁')
        setLoading(false)
        return
      }
      setProfile(data)
    } catch (error) {
      console.error('获取用户资料失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const [isAdmin, setIsAdmin] = useState(false)

  async function checkAdmin(email) {
    if (!email) return
    // 先查 .env 再查数据库
    const envAdmins = (import.meta.env.VITE_ADMIN_EMAIL || '').split(',').map((e) => e.trim().toLowerCase())
    if (envAdmins.includes(email.toLowerCase())) { setIsAdmin(true); return }
    const { data } = await supabase.from('admin_emails').select('id').eq('email', email.toLowerCase()).maybeSingle()
    setIsAdmin(!!data)
  }

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
