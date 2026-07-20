import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Plus, Trash2, Rocket, Wrench, Sparkles, MinusCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminChangelogPage() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [newContent, setNewContent] = useState('')
  const [newType, setNewType] = useState('fix')

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('changelog').select('*').order('created_at', { ascending: false })
    setEntries(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function handleAdd() {
    const c = newContent.trim()
    if (!c) { toast.error('请输入内容'); return }
    const { error } = await supabase.from('changelog').insert({ type: newType, content: c })
    if (error) toast.error('添加失败')
    else { toast.success('已添加'); setNewContent(''); fetch() }
  }

  async function handleDelete(id) {
    await supabase.from('changelog').delete().eq('id', id)
    fetch()
  }

  async function handleRelease() {
    const unreleased = entries.filter((e) => !e.released)
    if (unreleased.length === 0) { toast.error('没有待发布的更新'); return }

    const feats = unreleased.filter((e) => e.type === 'feat')
    const fixes = unreleased.filter((e) => e.type === 'fix')
    const removes = unreleased.filter((e) => e.type === 'remove')

    let markdown = ''
    if (feats.length > 0) markdown += feats.map((e) => `- 添加了${e.content}`).join('\n') + '\n'
    if (fixes.length > 0) markdown += fixes.map((e) => `- 修复了${e.content}`).join('\n') + '\n'
    if (removes.length > 0) markdown += removes.map((e) => `- 移除了${e.content}`).join('\n') + '\n'

    // 标记为已发布
    await supabase.from('changelog').update({ released: true }).in('id', unreleased.map((e) => e.id))

    // 复制到剪贴板
    navigator.clipboard.writeText(markdown).then(() => {
      toast.success('更新日志已复制！去公告管理粘贴发布')
    })
    fetch()
  }

  const unreleased = entries.filter((e) => !e.released)

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回管理后台
      </Link>

      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-4 flex items-center gap-2">
          <Sparkles size={24} /> 版本迭代日志
        </h1>

        {/* 添加入口 */}
        <div className="flex gap-2 mb-4">
          <select value={newType} onChange={(e) => setNewType(e.target.value)}
            className="bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm">
            <option value="feat">添加</option>
            <option value="fix">修复</option>
            <option value="remove">移除</option>
          </select>
          <input type="text" value={newContent} onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd() }}
            placeholder="描述具体改动..." className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
          <button onClick={handleAdd} className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 flex items-center gap-1 whitespace-nowrap"><Plus size={14} /> 添加</button>
        </div>

        {/* 发布按钮 */}
        {unreleased.length > 0 && (
          <button onClick={handleRelease}
            className="w-full bg-warning/10 border border-warning/30 text-warning px-4 py-3 rounded-card text-sm hover:bg-warning/20 mb-4 flex items-center justify-center gap-2">
            <Rocket size={16} /> 发布版本更新（{unreleased.length} 条改动，点击发布并复制到剪贴板）
          </button>
        )}

        {loading ? <LoadingSpinner size="lg" /> : (
          <div className="space-y-1">
            {entries.length === 0 ? <p className="text-muted text-sm py-8 text-center">暂无记录</p> : (
              entries.map((e) => (
                <div key={e.id} className={`flex items-center justify-between p-2.5 rounded-card ${e.released ? 'bg-hover/50' : 'bg-hover'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      e.type === 'feat' ? 'bg-success/10 text-success' :
                      e.type === 'fix' ? 'bg-warning/10 text-warning' :
                      'bg-danger/10 text-danger'
                    }`}>
                      {e.type === 'feat' ? <Sparkles size={10} className="inline mr-0.5" /> :
                       e.type === 'fix' ? <Wrench size={10} className="inline mr-0.5" /> :
                       <MinusCircle size={10} className="inline mr-0.5" />}
                      {e.type === 'feat' ? '添加' : e.type === 'fix' ? '修复' : '移除'}
                    </span>
                    <span className={`text-sm ${e.released ? 'text-muted' : 'text-secondary'}`}>{e.content}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {e.released ? <span className="text-muted text-[10px]">已发布</span> : <span className="text-warning text-[10px]">待发布</span>}
                    {!e.released && (
                      <button onClick={() => handleDelete(e.id)} className="text-muted hover:text-danger"><Trash2 size={12} /></button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
