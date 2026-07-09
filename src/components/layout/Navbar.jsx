/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-surface
 *   文字：text-primary, text-secondary, text-accent
 *   圆角：rounded-button
 *   阴影：shadow-elevated
 */
import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabaseClient'
import { Sun, Moon, LogOut, User, Shield, X, MessageSquare, Check, AlertTriangle } from 'lucide-react'
import NotificationBell from '@/components/notification/NotificationBell'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  // 管理员审核弹窗
  const [reviewOpen, setReviewOpen] = useState(false)
  const [pendingMsgs, setPendingMsgs] = useState([])
  const [pendingReportCount, setPendingReportCount] = useState(0)

  const fetchPending = useCallback(async () => {
    const [{ data: msgs }, { count }] = await Promise.all([
      supabase.from('guestbook').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    ])
    if (msgs) setPendingMsgs(msgs)
    if (count != null) setPendingReportCount(count)
  }, [])

  async function handleMsgAction(id, action) {
    const { error } = await supabase.from('guestbook').update({
      status: action, reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toast.error('操作失败') }
    else {
      toast.success(action === 'approved' ? '留言已通过' : '留言已拒绝')
      setPendingMsgs((prev) => prev.filter((m) => m.id !== id))
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/')
  }

  const totalPending = pendingMsgs.length + pendingReportCount

  return (
    <nav className="bg-surface border-b border-border shadow-elevated sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="font-display text-accent text-xl no-underline">
          ValkoValley
        </Link>

        {/* 导航链接 */}
        <div className="flex items-center gap-1">
          <Link to="/discussion"
            className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline">
            讨论区
          </Link>
          <Link to="/creation"
            className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline">
            创作区
          </Link>
          <Link to="/library"
            className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline">
            设定图书馆
          </Link>
        </div>

        {/* 右侧操作区 */}
        <div className="flex items-center gap-2">
          {/* 主题切换 */}
          <button onClick={toggleTheme}
            className="p-2 rounded-button text-secondary hover:bg-hover transition-colors"
            title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {user ? (
            <>
              {/* 通知 */}
              <NotificationBell />

              {/* 管理员审核 */}
              {isAdmin && (
                <div className="relative">
                  <button onClick={() => { setReviewOpen(!reviewOpen); if (!reviewOpen) fetchPending() }}
                    className="relative p-2 rounded-button text-warning hover:bg-hover transition-colors" title="审核面板">
                    <Shield size={18} />
                    {totalPending > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-text-inverse text-[10px] rounded-full flex items-center justify-center font-bold">
                        {totalPending > 9 ? '9+' : totalPending}
                      </span>
                    )}
                  </button>

                  {reviewOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReviewOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-80 bg-surface rounded-card shadow-elevated border border-border z-50 max-h-[70vh] overflow-y-auto">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                          <h4 className="text-accent text-sm font-medium flex items-center gap-1.5">
                            <Shield size={16} /> 审核面板
                          </h4>
                          <button onClick={() => setReviewOpen(false)} className="text-muted hover:text-secondary"><X size={14} /></button>
                        </div>

                        {/* 留言审核 */}
                        <div className="border-b border-border">
                          <div className="px-4 py-2 text-secondary text-xs font-medium flex items-center gap-1">
                            <MessageSquare size={13} /> 留言审核 ({pendingMsgs.length})
                          </div>
                          {pendingMsgs.length === 0 ? (
                            <p className="text-muted text-xs text-center py-4">暂无待审核</p>
                          ) : (
                            pendingMsgs.map((msg) => (
                              <div key={msg.id} className="px-4 py-2.5 border-t border-border/50 hover:bg-hover/50">
                                <p className="text-secondary text-xs mb-1.5">「{msg.content}」</p>
                                <div className="flex gap-1.5">
                                  <button onClick={() => handleMsgAction(msg.id, 'approved')}
                                    className="flex items-center gap-0.5 bg-success/10 text-success text-[11px] px-2 py-0.5 rounded-button hover:bg-success/20">
                                    <Check size={11} /> 通过
                                  </button>
                                  <button onClick={() => handleMsgAction(msg.id, 'rejected')}
                                    className="flex items-center gap-0.5 bg-danger/10 text-danger text-[11px] px-2 py-0.5 rounded-button hover:bg-danger/20">
                                    <X size={11} /> 拒绝
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* 举报 */}
                        <div className="px-4 py-2">
                          <div className="text-secondary text-xs font-medium flex items-center gap-1 mb-2">
                            <AlertTriangle size={13} /> 举报审核
                          </div>
                          {pendingReportCount === 0 ? (
                            <p className="text-muted text-xs text-center py-2">暂无待处理</p>
                          ) : (
                            <button onClick={() => { setReviewOpen(false); navigate('/admin') }}
                              className="w-full bg-danger/5 text-danger text-xs rounded-card p-2.5 hover:bg-danger/10 transition-colors">
                              📋 {pendingReportCount} 条举报待处理 → 前往处理
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* 用户菜单 */}
              <Link to={`/user/${profile?.username || user.email}`}
                className="flex items-center gap-2 px-2 py-1 rounded-button hover:bg-hover transition-colors no-underline">
                <span className="text-secondary text-sm">
                  {profile?.display_name || profile?.username || user.email}
                </span>
              </Link>

              {/* 登出 */}
              <button onClick={handleLogout}
                className="p-2 rounded-button text-muted hover:text-danger hover:bg-hover transition-colors" title="登出">
                <LogOut size={18} />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login"
                className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline">
                登录
              </Link>
              <Link to="/register"
                className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm no-underline hover:opacity-90 transition-opacity">
                注册
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
