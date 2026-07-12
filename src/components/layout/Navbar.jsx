import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { supabase } from '@/lib/supabaseClient'
import { Sun, Moon, LogOut, User, Shield, X, MessageSquare, Check, AlertTriangle, Ban, Plus, Trash2, BookOpen, Menu } from 'lucide-react'
import NotificationBell from '@/components/notification/NotificationBell'
import { clearBannedWordsCache } from '@/lib/bannedWords'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function Navbar() {
  const { user, profile, isAdmin } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [reviewOpen, setReviewOpen] = useState(false)
  const [pendingMsgs, setPendingMsgs] = useState([])
  const [pendingReportCount, setPendingReportCount] = useState(0)
  const [bannedWords, setBannedWords] = useState([])
  const [newBannedWord, setNewBannedWord] = useState('')
  const [pendingLibrary, setPendingLibrary] = useState([])
  const [mobileMenu, setMobileMenu] = useState(false)

  const fetchPending = useCallback(async () => {
    const [{ data: msgs }, { count }, { data: bw }, { data: lib }] = await Promise.all([
      supabase.from('guestbook').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
      supabase.from('reports').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('banned_words').select('*').order('created_at', { ascending: false }),
      supabase.from('library_entries').select('*').eq('status', 'pending_review').order('created_at', { ascending: false }),
    ])
    if (msgs) setPendingMsgs(msgs)
    if (count != null) setPendingReportCount(count)
    if (bw) setBannedWords(bw)
    if (lib) setPendingLibrary(lib)
  }, [])

  async function handleMsgAction(id, action) {
    const { error } = await supabase.from('guestbook').update({ status: action, reviewed_at: new Date().toISOString() }).eq('id', id)
    if (error) toast.error('操作失败')
    else { toast.success(action === 'approved' ? '已通过' : '已拒绝'); setPendingMsgs((prev) => prev.filter((m) => m.id !== id)) }
  }

  async function addBannedWord() {
    const w = newBannedWord.trim().toLowerCase()
    if (!w) { toast.error('请输入违禁词'); return }
    const { error } = await supabase.from('banned_words').insert({ word: w })
    if (error) toast.error(error.code === '23505' ? '该词已存在' : '添加失败')
    else { toast.success('已添加'); setNewBannedWord(''); fetchPending(); clearBannedWordsCache() }
  }

  async function removeBannedWord(id) {
    const { error } = await supabase.from('banned_words').delete().eq('id', id)
    if (error) toast.error('删除失败')
    else { toast.success('已删除'); fetchPending(); clearBannedWordsCache() }
  }

  async function handleLogout() { await supabase.auth.signOut(); navigate('/') }

  // 私信未读计数
  const [msgUnread, setMsgUnread] = useState(0)
  useEffect(() => {
    if (!user) return
    async function fetchMsg() {
      const { count } = await supabase.from('messages').select('*', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('is_read', false)
      setMsgUnread(count || 0)
    }
    fetchMsg()
    const t = setInterval(fetchMsg, 15000)
    const onMsgChange = () => fetchMsg()
    window.addEventListener('msg-unread-change', onMsgChange)
    return () => { clearInterval(t); window.removeEventListener('msg-unread-change', onMsgChange) }
  }, [user])

  const totalPending = pendingMsgs.length + pendingReportCount

  const navItems = [
    { to: '/help', label: '帮助中心' },
    { to: '/announcements', label: '公告' },
    { to: '/discussion', label: '讨论区' },
    { to: '/creation', label: '创作区' },
    { to: '/library', label: '档案馆' },
  ]

  const HamburgerMenu = () => (
    <div className="lg:hidden relative">
      <button onClick={() => setMobileMenu(!mobileMenu)} className="p-2 rounded-button text-secondary hover:bg-hover transition-colors">
        {mobileMenu ? <X size={18} /> : <Menu size={18} />}
      </button>
      {mobileMenu && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setMobileMenu(false)} />
          <div className="absolute left-0 top-full mt-1 w-40 bg-surface rounded-card shadow-elevated border border-border z-40 py-1">
            {navItems.map((item) => (
              <Link key={item.to} to={item.to} onClick={() => setMobileMenu(false)}
                className="block px-4 py-2.5 text-secondary text-sm no-underline hover:bg-hover hover:text-accent transition-colors">{item.label}</Link>
            ))}
          </div>
        </>
      )}
    </div>
  )

  return (
    <nav className="bg-surface border-b border-border shadow-elevated sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between">
        {/* 左侧：汉堡 + Logo + 桌面链接 */}
        <div className="flex items-center gap-1 sm:gap-2">
          <HamburgerMenu />
          <Link to="/" className="font-display text-accent text-lg sm:text-xl no-underline shrink-0">ValkoValley</Link>
          <div className="hidden lg:flex items-center gap-1 ml-2">
            <Link to="/help" className="text-secondary hover:text-accent px-2 py-1.5 rounded-button text-sm transition-colors no-underline">帮助中心</Link>
            <Link to="/announcements" className="text-secondary hover:text-accent px-2 py-1.5 rounded-button text-sm transition-colors no-underline">公告</Link>
          </div>
        </div>

        {/* 右侧：图标区 */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button onClick={toggleTheme} className="p-1.5 sm:p-2 rounded-button text-secondary hover:bg-hover transition-colors" title={theme === 'dark' ? '切换浅色模式' : '切换深色模式'}>
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {user ? (
            <>
              <NotificationBell />
              {isAdmin && (
                <div className="relative">
                  <button onClick={() => { setReviewOpen(!reviewOpen); if (!reviewOpen) fetchPending() }}
                    className="relative p-1.5 sm:p-2 rounded-button text-warning hover:bg-hover transition-colors" title="审核面板">
                    <Shield size={18} />
                    {totalPending > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-danger text-text-inverse text-[10px] rounded-full flex items-center justify-center font-bold">{totalPending > 9 ? '9+' : totalPending}</span>
                    )}
                  </button>
                  {reviewOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setReviewOpen(false)} />
                      <div className="fixed top-16 left-1/2 -translate-x-1/2 bg-surface rounded-card shadow-elevated border border-border z-50 max-h-[70vh] overflow-y-auto overflow-x-hidden w-[90vw] max-w-[320px]">
                        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                            <h4 className="text-accent text-sm font-medium flex items-center gap-1.5"><Shield size={16} /> 审核面板</h4>
                            <button onClick={async () => {
                              const { data } = await supabase.from('site_settings').select('value').eq('key', 'invite_only').maybeSingle()
                              const current = !data || data.value !== 'false'
                              await supabase.from('site_settings').update({ value: current ? 'false' : 'true' }).eq('key', 'invite_only')
                              toast.success(current ? '邀请制已关闭' : '邀请制已开启')
                            }}
                              className="text-warning text-[10px] border border-warning/30 rounded-button px-1.5 py-0.5 hover:bg-warning/10">
                              邀请开关
                            </button>
                          </div>
                            <span className="text-warning text-[10px] font-mono">密码:{(()=>{const n=new Date();const d=new Date(n);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);const w1=new Date(d.getFullYear(),0,4);const w=1+Math.round(((d-w1)/86400000-3+(w1.getDay()+6)%7)/7);let h=246813579;for(let i=0;i<20;i++)h=((h*1103515245+(w+n.getFullYear())*12345)>>>0)%2147483647;const c='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let r='';for(let i=0;i<8;i++){h=((h*1103515245+12345)>>>0)%2147483647;r+=c[h%c.length]}return r})()}</span>
                          </div>
                          <button onClick={() => setReviewOpen(false)} className="text-muted hover:text-secondary"><X size={14} /></button>
                        </div>
                        {/* 留言审核 */}
                        <div className="border-b border-border">
                          <div className="px-4 py-2 text-secondary text-xs font-medium flex items-center gap-1"><MessageSquare size={13} /> 留言审核 ({pendingMsgs.length})</div>
                          {pendingMsgs.length === 0 ? <p className="text-muted text-xs text-center py-4">暂无待审核</p> : pendingMsgs.map((msg) => (
                            <div key={msg.id} className="px-4 py-2.5 border-t border-border/50 hover:bg-hover/50">
                              <p className="text-secondary text-xs mb-1.5">「{msg.content}」</p>
                              <div className="flex gap-1.5">
                                <button onClick={() => handleMsgAction(msg.id, 'approved')} className="flex items-center gap-0.5 bg-success/10 text-success text-[11px] px-2 py-0.5 rounded-button hover:bg-success/20"><Check size={11} /> 通过</button>
                                <button onClick={() => handleMsgAction(msg.id, 'rejected')} className="flex items-center gap-0.5 bg-danger/10 text-danger text-[11px] px-2 py-0.5 rounded-button hover:bg-danger/20"><X size={11} /> 拒绝</button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {/* 档案馆审核 */}
                        {pendingLibrary.length > 0 && (
                          <div className="border-b border-border">
                            <div className="px-4 py-2 text-secondary text-xs font-medium flex items-center gap-1"><BookOpen size={13} /> 档案馆审核 ({pendingLibrary.length})</div>
                            {pendingLibrary.slice(0,5).map((e) => (
                              <div key={e.id} className="px-4 py-2 border-t border-border/50 text-xs text-secondary">
                                <span>{e.title}</span>
                                <div className="flex gap-1.5 mt-1">
                                  <button onClick={async () => { await supabase.rpc('review_library_entry', { _id: e.id, _approve: true }); fetchPending() }}
                                    className="bg-success/10 text-success text-[10px] px-2 py-0.5 rounded-button hover:bg-success/20"><Check size={10} /> 通过</button>
                                  <button onClick={async () => { await supabase.rpc('review_library_entry', { _id: e.id, _approve: false }); fetchPending() }}
                                    className="bg-danger/10 text-danger text-[10px] px-2 py-0.5 rounded-button hover:bg-danger/20"><X size={10} /> 拒绝</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* 违禁词管理 */}
                        <div className="border-b border-border px-4 py-2">
                          <div className="text-secondary text-xs font-medium flex items-center gap-1 mb-2"><Ban size={13} /> 违禁词管理</div>
                          <div className="flex gap-1.5 mb-2">
                            <input type="text" value={newBannedWord} onChange={(e) => setNewBannedWord(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addBannedWord() }} placeholder="添加违禁词…" className="flex-1 bg-hover border border-border rounded-input px-2 py-1 text-primary text-xs focus:outline-none focus:border-accent" />
                            <button onClick={addBannedWord} className="bg-accent text-text-inverse px-2 py-1 rounded-button text-xs"><Plus size={12} /></button>
                          </div>
                          <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">{bannedWords.slice(0, 30).map((bw) => (
                            <span key={bw.id} className="inline-flex items-center gap-0.5 bg-hover text-secondary text-[10px] px-2 py-0.5 rounded-full">{bw.word}<button onClick={() => removeBannedWord(bw.id)} className="text-muted hover:text-danger"><Trash2 size={10} /></button></span>
                          ))}</div>
                        </div>
                        {/* 链接 */}
                        <div className="px-4 py-2 space-y-1">
                          <Link to="/admin/invites" className="text-accent text-xs hover:underline block">邀请码管理</Link>
                          <Link to="/admin/announcements" className="text-accent text-xs hover:underline block">公告管理</Link>
                          <Link to="/admin/contacts" className="text-accent text-xs hover:underline block">管理员名单</Link>
                          <Link to="/admin" className="text-accent text-xs hover:underline block">管理后台</Link>
                        </div>
                        {/* 举报 */}
                        <div className="px-4 py-2">
                          <div className="text-secondary text-xs font-medium flex items-center gap-1 mb-2"><AlertTriangle size={13} /> 举报审核</div>
                          {pendingReportCount === 0 ? <p className="text-muted text-xs text-center py-2">暂无待处理</p> : (
                            <button onClick={() => { setReviewOpen(false); navigate('/admin') }} className="w-full bg-danger/5 text-danger text-xs rounded-card p-2.5 hover:bg-danger/10 transition-colors">📋 {pendingReportCount} 条举报待处理 →</button>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
              <Link to={`/user/${profile?.username || user.email}`} className="flex items-center gap-1 sm:gap-1.5 px-1 sm:px-2 py-1 rounded-button hover:bg-hover transition-colors no-underline max-w-[60px] sm:max-w-[160px]">
                <span className="text-secondary text-xs sm:text-sm truncate">{profile?.display_name || profile?.username || user.email}</span>
              </Link>
              <button onClick={handleLogout} className="p-1.5 sm:p-2 rounded-button text-muted hover:text-danger hover:bg-hover transition-colors shrink-0" title="登出"><LogOut size={16} /></button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="text-secondary hover:text-accent px-3 py-1.5 rounded-button text-sm transition-colors no-underline">登录</Link>
              <Link to="/register" className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm no-underline hover:opacity-90 transition-opacity">注册</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
