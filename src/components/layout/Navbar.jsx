/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-surface
 *   文字：text-primary, text-secondary, text-accent
 *   圆角：rounded-button
 *   阴影：shadow-elevated
 */
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabaseClient'
import { Sun, Moon, LogOut, User, Shield } from 'lucide-react'
import NotificationBell from '@/components/notification/NotificationBell'
import { cn } from '@/lib/utils'

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav className="bg-surface border-b border-border shadow-elevated sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display text-accent text-xl no-underline">
          ValkoValley
        </Link>

        {/* 导航链接 */}
        <div className="flex items-center gap-1">
          <Link
            to="/discussion"
            className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline"
          >
            讨论区
          </Link>
          <Link
            to="/creation"
            className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline"
          >
            创作区
          </Link>
          <Link
            to="/library"
            className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline"
          >
            设定图书馆
          </Link>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 主题切换 */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-button text-secondary hover:bg-hover transition-colors"
            title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              {/* 通知 */}
              <NotificationBell />

              {/* 管理员入口 */}
              {isAdmin && (
                <Link
                  to="/admin"
                  className="p-2 rounded-button text-warning hover:bg-hover transition-colors"
                  title="管理后台"
                >
                  <Shield size={18} />
                </Link>
              )}

              {/* 用户菜单 */}
              <Link
                to={`/user/${profile?.username || user.email}`}
                className="flex items-center gap-2 px-2 py-1 rounded-button hover:bg-hover transition-colors no-underline"
              >
                <span className="text-secondary text-sm">
                  {profile?.display_name || profile?.username || user.email}
                </span>
              </Link>

              {/* 登出 */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-button text-muted hover:text-danger hover:bg-hover transition-colors"
                title="登出"
              >
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm no-underline hover:opacity-90 transition-opacity"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
