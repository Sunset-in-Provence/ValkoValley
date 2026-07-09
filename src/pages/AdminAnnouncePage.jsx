import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import MarkdownPreview from '@/components/discussion/MarkdownPreview'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Megaphone, Plus, Trash2, Edit3, Check, Clock, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const CATS = [
  { key: 'general', label: '总公告' },
  { key: 'update', label: '更新公告' },
  { key: 'violation', label: '违规公示' },
]

export default function AdminAnnouncePage() {
  const { user } = useAuth()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('general')
  const [publishAt, setPublishAt] = useState('')
  const [publishNow, setPublishNow] = useState(true)
  const [saving, setSaving] = useState(false)

  async function fetch() {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*, author:profiles!announcements_author_id_fkey(username, display_name)')
      .order('created_at', { ascending: false })
    setList(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  function startNew() {
    setEditing('new')
    setTitle(''); setContent(''); setCategory('general')
    setPublishAt(new Date().toISOString().slice(0, 16)); setPublishNow(true)
  }

  function startEdit(item) {
    setEditing(item.id)
    setTitle(item.title); setContent(item.content); setCategory(item.category)
    setPublishAt(item.publish_at ? item.publish_at.slice(0, 16) : new Date().toISOString().slice(0, 16))
    setPublishNow(item.is_published)
  }

  async function handleSave() {
    if (!title.trim() || !content.trim()) { toast.error('请填写标题和内容'); return }
    setSaving(true)
    const payload = {
      author_id: user.id, title: title.trim(), content, category,
      is_published: publishNow,
      publish_at: publishNow ? new Date().toISOString() : new Date(publishAt).toISOString(),
    }
    if (editing === 'new') {
      const { error } = await supabase.rpc('insert_announcement', {
        _title: payload.title, _content: payload.content, _category: payload.category,
        _is_published: payload.is_published, _publish_at: payload.publish_at,
      })
      if (error) toast.error('发布失败: ' + error.message)
      else toast.success('公告已发布')
    } else {
      const { error } = await supabase.rpc('update_announcement', {
        _id: editing, _title: payload.title, _content: payload.content, _category: payload.category,
        _is_published: payload.is_published, _publish_at: payload.publish_at,
      })
      if (error) toast.error('更新失败: ' + error.message)
      else toast.success('公告已更新')
    }
    setSaving(false); setEditing(null); fetch()
  }

  async function handleDelete(id) {
    if (!confirm('确定删除？')) return
    const { error } = await supabase.rpc('delete_announcement', { _id: id })
    if (error) toast.error('删除失败')
    else { toast.success('已删除'); fetch() }
  }

  function fmt(d) { return d ? new Date(d).toLocaleString('zh-CN') : '-' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link to="/admin" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-3 no-underline hover:text-accent transition-colors shadow-card">
            <ArrowLeft size={16} /> 返回管理后台
          </Link>
          <h1 className="font-display text-accent text-2xl flex items-center gap-2">
            <Megaphone size={24} /> 公告管理
          </h1>
        </div>
        <button onClick={startNew} className="flex items-center gap-1.5 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90">
          <Plus size={16} /> 新建公告
        </button>
      </div>

      {editing && (
        <div className="bg-surface rounded-card shadow-card p-6 mb-6 space-y-4">
          <h3 className="font-display text-accent text-lg">{editing === 'new' ? '新建公告' : '编辑公告'}</h3>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="公告标题" maxLength={200}
            className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm focus:outline-none focus:border-accent" />
          <div className="flex gap-2">
            {CATS.map((c) => (
              <button key={c.key} type="button" onClick={() => setCategory(c.key)}
                className={cn('px-3 py-1.5 rounded-full text-xs', category === c.key ? 'bg-accent text-text-inverse' : 'bg-hover text-secondary border border-border')}>{c.label}</button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-1.5 text-sm text-secondary">
              <input type="checkbox" checked={publishNow} onChange={(e) => setPublishNow(e.target.checked)} /> 立即发布
            </label>
            {!publishNow && <input type="datetime-local" value={publishAt} onChange={(e) => setPublishAt(e.target.value)}
              className="bg-hover border border-border rounded-input px-3 py-1.5 text-primary text-sm" />}
          </div>
          <MarkdownPreview content={content} onChange={setContent} rows={10} />
          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving}
              className="bg-accent text-text-inverse px-6 py-2 rounded-button text-sm hover:opacity-90 disabled:opacity-50 flex items-center gap-1">
              <Check size={14} /> {saving ? '保存中...' : '保存'}</button>
            <button onClick={() => setEditing(null)} className="border border-border text-secondary px-6 py-2 rounded-button text-sm hover:bg-hover">取消</button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
      ) : list.length === 0 ? (
        <p className="text-muted text-sm text-center py-16">暂无公告</p>
      ) : (
        <div className="space-y-3">
          {list.map((a) => {
            const published = a.is_published && new Date(a.publish_at) <= new Date()
            return (
              <div key={a.id} className={cn('bg-surface rounded-card shadow-card p-5 border-l-4', published ? 'border-success' : 'border-warning')}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-display text-accent text-base">{a.title}</h3>
                    <div className="flex items-center gap-3 text-muted text-xs mt-1">
                      <span className="flex items-center gap-1"><Clock size={11} /> {fmt(a.publish_at)}</span>
                      <span className={cn('px-1.5 py-0.5 rounded-full text-[10px]', published ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                        {published ? '已发布' : '待发布'}</span>
                      <span className="text-[10px] bg-hover px-1.5 py-0.5 rounded-full">
                        {CATS.find((c) => c.key === a.category)?.label || a.category}</span>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => startEdit(a)} className="text-muted hover:text-accent"><Edit3 size={14} /></button>
                    <button onClick={() => handleDelete(a.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                  </div>
                </div>
                <p className="text-secondary text-sm line-clamp-2">{a.content?.replace(/[#*`>\n]/g, ' ').slice(0, 200)}</p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
