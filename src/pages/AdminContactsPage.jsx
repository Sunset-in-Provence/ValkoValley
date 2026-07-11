import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({ display_name: '', role: '管理员', contact_info: '' })

  async function fetch() {
    setLoading(true)
    const { data } = await supabase.from('admin_contacts').select('*, profile:profiles!admin_contacts_user_id_fkey(avatar_url, username)').order('sort_order')
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function handleAdd() {
    if (!form.display_name.trim()) { toast.error('请填写昵称'); return }
    const { error } = await supabase.from('admin_contacts').insert({ ...form, sort_order: contacts.length })
    if (error) toast.error('添加失败')
    else { toast.success('已添加'); setForm({ display_name: '', role: '管理员', contact_info: '' }); fetch() }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除？')) return
    await supabase.from('admin_contacts').delete().eq('id', id)
    toast.success('已删除'); fetch()
  }

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回管理后台
      </Link>
      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-4 flex items-center gap-2"><GripVertical size={24} /> 管理员名单管理</h1>

        <div className="flex gap-2 mb-4 flex-wrap">
          <input type="text" value={form.display_name} onChange={(e) => setForm((p) => ({ ...p, display_name: e.target.value }))} placeholder="昵称" className="bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm w-32" />
          <input type="text" value={form.role} onChange={(e) => setForm((p) => ({ ...p, role: e.target.value }))} placeholder="职位" className="bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm w-24" />
          <input type="text" value={form.contact_info} onChange={(e) => setForm((p) => ({ ...p, contact_info: e.target.value }))} placeholder="联系方式" className="bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm flex-1 min-w-[120px]" />
          <button onClick={handleAdd} className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 flex items-center gap-1"><Plus size={14} /> 添加</button>
        </div>

        {loading ? <LoadingSpinner /> : contacts.length === 0 ? <p className="text-muted text-sm py-8 text-center">暂无管理员</p> : (
          <div className="space-y-2">
            {contacts.map((c, i) => (
              <div key={c.id} className="border border-border rounded-card p-3 flex items-center justify-between">
                <div>
                  <span className="text-secondary text-sm font-medium">{c.display_name}</span>
                  <span className="text-muted text-xs ml-2">{c.role}</span>
                  {c.contact_info && <span className="text-muted text-xs ml-2">{c.contact_info}</span>}
                </div>
                <button onClick={() => handleDelete(c.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
