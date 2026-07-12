/**
 * 管理后台 — 举报审核 + 留言审核仪表板
 *
 * 功能：
 *   - 举报审核：按状态筛选，删除内容 / 封禁用户 / 驳回举报
 *   - 留言审核：通过 / 拒绝滚动留言板内容
 *
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   text-danger, text-warning, text-success, text-info,
 *   rounded-card, rounded-button, rounded-full, shadow-card, font-display, border-border
 */
import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import ReportCard from '@/components/admin/ReportCard'
import EmptyState from '@/components/shared/EmptyState'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Shield, Filter, RefreshCw, BookOpen, Palette as PaletteIcon, MessageSquare, Check, X, Clock, ArrowLeft, Ticket, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const TABS = [
  { key: 'reports', label: '举报审核' },
  { key: 'guestbook', label: '留言审核' },
  { key: 'exams', label: '考试记录' },
  { key: 'users', label: '用户列表' },
]

const STATUS_FILTERS = [
  { key: 'pending', label: '待处理', color: 'text-warning' },
  { key: 'resolved', label: '已处理', color: 'text-success' },
  { key: 'dismissed', label: '已驳回', color: 'text-muted' },
]

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('reports')

  // ---- 举报审核 ----
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const fetchReports = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('status', filter)
      .order('created_at', { ascending: false })

    if (data) {
      const countMap = {}
      data.forEach((r) => {
        const key = `${r.target_type}:${r.target_id}`
        countMap[key] = (countMap[key] || 0) + 1
      })
      const enriched = data.map((r) => ({
        ...r,
        duplicate_count: countMap[`${r.target_type}:${r.target_id}`] || 1,
      }))
      enriched.sort((a, b) => b.duplicate_count - a.duplicate_count)
      setReports(enriched)
    }
    setLoading(false)
  }, [filter])

  useEffect(() => { if (activeTab === 'reports') fetchReports() }, [fetchReports])

  const reportCounts = {
    pending: reports.filter((r) => r.status === 'pending').length,
    resolved: reports.filter((r) => r.status === 'resolved').length,
    dismissed: reports.filter((r) => r.status === 'dismissed').length,
  }

  // ---- 留言审核 ----
  const [messages, setMessages] = useState([])
  const [msgLoading, setMsgLoading] = useState(true)
  const [msgFilter, setMsgFilter] = useState('pending')

  const fetchMessages = useCallback(async () => {
    setMsgLoading(true)
    const { data } = await supabase
      .from('guestbook')
      .select('*')
      .eq('status', msgFilter)
      .order('created_at', { ascending: false })
    if (data) setMessages(data)
    setMsgLoading(false)
  }, [msgFilter])

  useEffect(() => { if (activeTab === 'guestbook') fetchMessages() }, [fetchMessages])

  async function handleMsgAction(id, action) {
    const { error } = await supabase.from('guestbook').update({
      status: action,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)
    if (error) { toast.error('操作失败: ' + error.message) }
    else {
      toast.success(action === 'approved' ? '留言已通过' : '留言已拒绝')
      fetchMessages()
    }
  }

  const msgCounts = {
    pending: messages.filter((m) => m.status === 'pending').length,
    approved: messages.filter((m) => m.status === 'approved').length,
    rejected: messages.filter((m) => m.status === 'rejected').length,
  }

  return (
    <div>
      <Link to="/discussion" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent transition-colors shadow-card">
        <ArrowLeft size={16} /> 返回
      </Link>
      {/* 标题栏 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-accent text-2xl flex items-center gap-2">
            <Shield size={24} /> 管理后台
          </h1>
          <p className="text-muted text-sm mt-1">举报审核 · 留言审核 · 内容管理</p>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/admin/exam"
            className="flex items-center gap-1 text-muted text-sm no-underline hover:text-accent px-3 py-1.5 rounded-button border border-border">
            <BookOpen size={14} /> 题库管理
          </Link>
          <Link to="/admin/theme"
            className="flex items-center gap-1 text-muted text-sm no-underline hover:text-accent px-3 py-1.5 rounded-button border border-border">
            <PaletteIcon size={14} /> 主题管理
          </Link>
          <Link to="/admin/invites"
            className="flex items-center gap-1 text-muted text-sm no-underline hover:text-accent px-3 py-1.5 rounded-button border border-border">
            <Ticket size={14} /> 邀请码
          </Link>
          <button onClick={() => activeTab === 'reports' ? fetchReports() : fetchMessages()}
            className="flex items-center gap-1 text-muted text-sm hover:text-accent px-3 py-1.5 rounded-button border border-border">
            <RefreshCw size={14} /> 刷新
          </button>
        </div>
      </div>

      {/* Tab 切换 */}
      <div className="flex gap-1 mb-6 border-b border-border">
        {TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={cn('px-4 py-2 text-sm rounded-t-card transition-colors',
              activeTab === tab.key
                ? 'text-accent border-b-2 border-accent -mb-[2px] font-medium'
                : 'text-muted hover:text-secondary')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ====== 举报审核 ====== */}
      {activeTab === 'reports' && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface rounded-card shadow-card p-4 text-center">
              <p className="text-warning text-2xl font-display">{reportCounts.pending}</p>
              <p className="text-muted text-xs mt-1">待处理举报</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-4 text-center">
              <p className="text-success text-2xl font-display">{reportCounts.resolved}</p>
              <p className="text-muted text-xs mt-1">已处理</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-4 text-center">
              <p className="text-muted text-2xl font-display">{reportCounts.dismissed}</p>
              <p className="text-muted text-xs mt-1">已驳回</p>
            </div>
          </div>

          {/* 筛选 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {STATUS_FILTERS.map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={cn('px-4 py-1.5 rounded-full text-xs transition-colors',
                    filter === f.key
                      ? 'bg-accent text-text-inverse'
                      : 'bg-surface text-secondary border border-border hover:bg-hover')}>
                  {f.label}
                </button>
              ))}
            </div>
            <span className="text-muted text-xs flex items-center gap-1">
              <Filter size={12} />
              {filter === 'pending' ? '按被举报次数降序排列' : '按时间降序'}
            </span>
          </div>

          {loading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : reports.length === 0 ? (
            <EmptyState icon={Shield} title="暂无举报"
              description={filter === 'pending' ? '没有待处理的举报，社区状态良好' : ''} />
          ) : (
            <div className="space-y-3">
              {reports.map((report) => (
                <div key={report.id}>
                  {report.duplicate_count > 1 && (
                    <div className="text-warning text-xs mb-1 px-2">
                      ⚠️ 同一内容被举报 {report.duplicate_count} 次
                    </div>
                  )}
                  <ReportCard report={report} onAction={fetchReports} />
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ====== 留言审核 ====== */}
      {activeTab === 'guestbook' && (
        <>
          {/* 统计卡片 */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-surface rounded-card shadow-card p-4 text-center">
              <p className="text-warning text-2xl font-display">{msgCounts.pending}</p>
              <p className="text-muted text-xs mt-1">待审核留言</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-4 text-center">
              <p className="text-success text-2xl font-display">{msgCounts.approved}</p>
              <p className="text-muted text-xs mt-1">已通过</p>
            </div>
            <div className="bg-surface rounded-card shadow-card p-4 text-center">
              <p className="text-muted text-2xl font-display">{msgCounts.rejected}</p>
              <p className="text-muted text-xs mt-1">已拒绝</p>
            </div>
          </div>

          {/* 筛选 */}
          <div className="flex gap-1 mb-4">
            {[
              { key: 'pending', label: '待审核' },
              { key: 'approved', label: '已通过' },
              { key: 'rejected', label: '已拒绝' },
            ].map((f) => (
              <button key={f.key} onClick={() => setMsgFilter(f.key)}
                className={cn('px-4 py-1.5 rounded-full text-xs transition-colors',
                  msgFilter === f.key
                    ? 'bg-accent text-text-inverse'
                    : 'bg-surface text-secondary border border-border hover:bg-hover')}>
                {f.label}
              </button>
            ))}
          </div>

          {msgLoading ? (
            <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
          ) : messages.length === 0 ? (
            <EmptyState icon={MessageSquare} title="暂无留言"
              description={msgFilter === 'pending' ? '没有待审核的留言' : ''} />
          ) : (
            <div className="space-y-2">
              {messages.map((msg) => (
                <div key={msg.id} className="bg-surface rounded-card border border-border p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-primary text-sm">「{msg.content}」</p>
                      <p className="text-muted text-xs mt-1.5 flex items-center gap-1">
                        <Clock size={11} /> {new Date(msg.created_at).toLocaleString('zh-CN')}
                      </p>
                    </div>
                    {msg.status === 'pending' && (
                      <div className="flex items-center gap-1.5 ml-4">
                        <button onClick={() => handleMsgAction(msg.id, 'approved')}
                          className="flex items-center gap-1 bg-success/10 text-success text-xs px-3 py-1.5 rounded-button hover:bg-success/20 transition-colors">
                          <Check size={12} /> 通过
                        </button>
                        <button onClick={() => handleMsgAction(msg.id, 'rejected')}
                          className="flex items-center gap-1 bg-danger/10 text-danger text-xs px-3 py-1.5 rounded-button hover:bg-danger/20 transition-colors">
                          <X size={12} /> 拒绝
                        </button>
                      </div>
                    )}
                    {msg.status !== 'pending' && (
                      <span className={cn('text-xs px-2 py-0.5 rounded-full',
                        msg.status === 'approved' ? 'bg-success/10 text-success' : 'bg-hover text-muted')}>
                        {msg.status === 'approved' ? '已通过' : '已拒绝'}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ====== 考试记录 ====== */}
      {activeTab === 'exams' && <ExamAttemptsTab />}

      {/* ====== 用户列表 ====== */}
      {activeTab === 'users' && <UsersTab />}
    </div>
  )
}

function ExamAttemptsTab() {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('exam_attempts').select('*').order('created_at', { ascending: false }).limit(100)
      setAttempts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>

  const failed = attempts.filter((a) => !a.passed)
  const passed = attempts.filter((a) => a.passed)

  return (
    <>
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-surface rounded-card shadow-card p-4 text-center">
          <p className="text-muted text-2xl font-display">{attempts.length}</p>
          <p className="text-muted text-xs mt-1">总记录</p>
        </div>
        <div className="bg-surface rounded-card shadow-card p-4 text-center">
          <p className="text-success text-2xl font-display">{passed.length}</p>
          <p className="text-muted text-xs mt-1">通过</p>
        </div>
        <div className="bg-surface rounded-card shadow-card p-4 text-center">
          <p className="text-danger text-2xl font-display">{failed.length}</p>
          <p className="text-muted text-xs mt-1">未通过</p>
        </div>
      </div>

      {attempts.length === 0 ? (
        <EmptyState icon={BookOpen} title="暂无考试记录" />
      ) : (
        <div className="space-y-2">
          {attempts.map((a) => (
            <div key={a.id} className="bg-surface rounded-card border border-border p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-secondary text-sm font-medium">{a.email}</span>
                  <span className="text-muted text-xs ml-2">@{a.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn('text-xs px-2 py-0.5 rounded-full', a.passed ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger')}>
                    {a.passed ? '通过' : '未通过'}
                  </span>
                  <span className="text-muted text-xs">{a.stage === 'rules' ? '公约' : '敖尹'}</span>
                  <span className="text-muted text-xs">{a.correct_count}/{a.total_count}</span>
                </div>
              </div>
              {a.wrong_details?.length > 0 && (
                <div className="text-muted text-xs space-y-0.5 mt-2 pt-2 border-t border-border/50">
                  {a.wrong_details.map((w, i) => (
                    <div key={i}>
                      <p className="text-secondary">Q: {w.question}</p>
                      <p>选了：<span className="text-danger">{w.picked}</span> | 正确：<span className="text-success">{w.correct}</span></p>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-muted text-[10px] mt-2">{new Date(a.created_at).toLocaleString('zh-CN')}</p>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function UsersTab() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      setUsers(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = users.filter((u) =>
    !search || u.username?.toLowerCase().includes(search.toLowerCase()) || u.display_name?.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索用户..." className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
        <span className="text-muted text-xs">共 {users.length} 人</span>
      </div>
      <div className="space-y-2">
        {filtered.map((u) => (
          <div key={u.id} className="bg-surface rounded-card border border-border p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-hover flex items-center justify-center">
                {u.avatar_url ? <img src={u.avatar_url} className="w-8 h-8 rounded-full object-cover" alt="" /> : <User size={14} className="text-muted" />}
              </div>
              <div>
                <Link to={`/user/${u.username}`} className="text-accent text-sm font-medium no-underline hover:underline">
                  {u.display_name || u.username}
                </Link>
                <p className="text-muted text-[10px]">{u.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              {u.is_banned && <span className="bg-danger/10 text-danger px-1.5 py-0.5 rounded-full">已封禁</span>}
              <span>{new Date(u.created_at).toLocaleDateString('zh-CN')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
