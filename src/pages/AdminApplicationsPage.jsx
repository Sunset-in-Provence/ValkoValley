import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import ImageViewer from '@/components/shared/ImageViewer'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Check, X, Mail, ExternalLink, Gift, Clock, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminApplicationsPage() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')
  const [search, setSearch] = useState('')
  const [processing, setProcessing] = useState(null)
  const [viewerOpen, setViewerOpen] = useState(false)
  const [viewerIndex, setViewerIndex] = useState(0)
  const [viewerImages, setViewerImages] = useState([])

  const filteredApps = apps
    .filter((a) => a.status === filter)
    .filter((a) =>
      !search ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.xhs_nickname?.toLowerCase().includes(search.toLowerCase()) ||
      a.xhs_id?.toLowerCase().includes(search.toLowerCase())
    )

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('registration_applications')
      .select('*, used_by:profiles!registration_applications_used_by_user_id_fkey(username, display_name)')
      .order('created_at', { ascending: false })
    setApps(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function handleApprove(app) {
    setProcessing(app.id)
    const code = 'VV' + Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('invite_codes').insert({ code, created_by: user.id, max_uses: 1, bound_email: app.email })
    const { error: updateErr } = await supabase.from('registration_applications').update({
      status: 'approved', reviewer_id: user.id, invite_code: code, invite_sent_at: new Date().toISOString(),
    }).eq('id', app.id)
    if (updateErr) { toast.error('更新失败: ' + updateErr.message); setProcessing(null); return }
    toast.success(`已通过，邀请码 ${code}`)
    setProcessing(null)
    setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, status: 'approved' } : a))
  }

  async function handleReject(app) {
    setProcessing(app.id)
    await supabase.from('registration_applications').update({
      status: 'rejected', reviewer_id: user.id,
    }).eq('id', app.id)
    toast.success('已拒绝')
    setProcessing(null)
    setApps((prev) => prev.map((a) => a.id === app.id ? { ...a, status: 'rejected' } : a))
  }

  return (
    <div className="px-4 md:px-6">
      <Link to="/admin" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回管理后台
      </Link>

      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-4 flex items-center gap-2">
          <Mail size={24} /> 入站审核
        </h1>

        <div className="mb-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索邮箱 / 小红书号 / 昵称..." className="w-full max-w-xs bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
        </div>
        <div className="flex gap-1 mb-4">
          {[{ key: 'pending', label: '待审核' }, { key: 'approved', label: '已通过' }, { key: 'rejected', label: '已拒绝' }].map((f) => {
            const count = apps.filter((a) => a.status === f.key).length
            return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-1.5 rounded-full text-xs ${filter === f.key ? 'bg-accent text-text-inverse' : 'bg-surface text-secondary border border-border hover:bg-hover'}`}>
              {f.label} ({count})
            </button>
          )})}
        </div>

        {loading ? <LoadingSpinner size="lg" /> : filteredApps.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">暂无记录</p>
        ) : (
          <div className="space-y-3">
            {filteredApps.map((app) => (
              <div key={app.id} className="border border-border rounded-card p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-primary text-sm font-medium">{app.email}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded-full ${app.status === 'approved' ? 'bg-success/10 text-success' : app.status === 'rejected' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'}`}>
                        {{pending: '待审核', approved: '已通过', rejected: '已拒绝'}[app.status]}
                      </span>
                    </div>
                    {app.xhs_nickname && <p className="text-secondary text-xs">昵称：{app.xhs_nickname}</p>}
                    {app.xhs_id && <p className="text-secondary text-xs">小红书号：{app.xhs_id}</p>}
                    {app.xhs_link && (
                      <a href={app.xhs_link} target="_blank" rel="noopener noreferrer"
                        className="text-accent text-xs hover:underline flex items-center gap-1 mb-1">
                        <ExternalLink size={11} /> 主页链接
                      </a>
                    )}
                    {app.extra_info && <p className="text-secondary text-xs mt-1">{app.extra_info}</p>}
                    {app.image_urls?.length > 0 && (
                      <div className="flex gap-1.5 mt-2">
                        {app.image_urls.map((url, i) => (
                          <img key={i} src={url} alt="" className="w-14 h-14 object-cover rounded-card border border-border cursor-pointer hover:opacity-80"
                            onClick={() => { setViewerImages(app.image_urls); setViewerIndex(i); setViewerOpen(true) }} />
                        ))}
                      </div>
                    )}

                    {/* 已通过：显示邀请码信息 */}
                    {app.status === 'approved' && (
                      <div className="mt-2 pt-2 border-t border-border/50 text-[10px] space-y-0.5">
                        <p className="text-muted flex items-center gap-1"><Gift size={10} /> 邀请码：<span className="text-accent font-mono font-bold">{app.invite_code}</span></p>
                        <p className="text-muted flex items-center gap-1"><Clock size={10} /> 发放时间：{new Date(app.invite_sent_at).toLocaleString('zh-CN')}</p>
                        {app.used_by_user_id ? (
                          <p className="text-success">已注册：{app.used_by?.display_name || app.used_by?.username || '用户'} · {new Date(app.invite_sent_at).toLocaleString('zh-CN')}</p>
                        ) : (
                          <p className="text-warning">邀请码暂未使用</p>
                        )}
                      </div>
                    )}

                    <p className="text-muted text-[10px] mt-2">{new Date(app.created_at).toLocaleString('zh-CN')}</p>
                  </div>

                  {app.status === 'pending' && (
                    <div className="flex gap-1.5 ml-3">
                      <button onClick={() => handleApprove(app)} disabled={processing === app.id}
                        className="bg-success/10 text-success text-xs px-3 py-1.5 rounded-button hover:bg-success/20 disabled:opacity-30 flex items-center gap-1">
                        {processing === app.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />} 通过
                      </button>
                      <button onClick={() => handleReject(app)} disabled={processing === app.id}
                        className="bg-danger/10 text-danger text-xs px-3 py-1.5 rounded-button hover:bg-danger/20 disabled:opacity-30 flex items-center gap-1">
                        <X size={12} /> 拒绝
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {viewerOpen && viewerImages.length > 0 && (
        <ImageViewer images={viewerImages} current={viewerIndex}
          onClose={() => setViewerOpen(false)}
          onPrev={() => setViewerIndex((i) => (i - 1 + viewerImages.length) % viewerImages.length)}
          onNext={() => setViewerIndex((i) => (i + 1) % viewerImages.length)} />
      )}
    </div>
  )
}
