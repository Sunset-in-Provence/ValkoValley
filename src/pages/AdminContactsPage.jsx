import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Plus, Trash2, Copy, ExternalLink, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState([])
  const [allUsers, setAllUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchUser, setSearchUser] = useState('')
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ display_name: '', contact_info: '', profile_url: '', user_id: '' })

  async function fetch() {
    setLoading(true)
    const [{ data: c }, { data: u }] = await Promise.all([
      supabase.from('admin_contacts').select('*').order('sort_order'),
      supabase.from('profiles').select('id, username, display_name, avatar_url').order('display_name'),
    ])
    setContacts(c || [])
    setAllUsers(u || [])
    setLoading(false)
  }

  useEffect(() => { fetch() }, [])

  async function handleAddFromUser(u) {
    const exists = contacts.find((c) => c.user_id === u.id)
    if (exists) { toast.error('该用户已在列表中'); return }
    const { error } = await supabase.from('admin_contacts').insert({
      user_id: u.id, display_name: u.display_name || u.username,
      sort_order: contacts.length,
    })
    if (error) toast.error('添加失败')
    else { toast.success('已添加'); fetch() }
  }

  function startEdit(c) {
    setEditId(c.id)
    setEditForm({ display_name: c.display_name || '', contact_info: c.contact_info || '', profile_url: c.profile_url || '', user_id: c.user_id || '' })
  }

  async function handleSaveEdit() {
    if (!editForm.display_name.trim()) { toast.error('请填写昵称'); return }
    const { error } = await supabase.from('admin_contacts').update(editForm).eq('id', editId)
    if (error) toast.error('保存失败')
    else { toast.success('已保存'); setEditId(null); fetch() }
  }

  async function handleDelete(id) {
    if (!confirm('确定删除？')) return
    await supabase.from('admin_contacts').delete().eq('id', id)
    toast.success('已删除'); fetch()
  }

  const filteredUsers = allUsers.filter((u) => !searchUser || (u.display_name || u.username).toLowerCase().includes(searchUser.toLowerCase()))

  return (
    <div>
      <Link to="/admin" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回管理后台
      </Link>
      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-4">管理员名单管理</h1>

        {/* 从站内用户添加 */}
        <div className="mb-6 pb-6 border-b border-border">
          <h3 className="text-secondary text-sm font-medium mb-3 flex items-center gap-1"><UserIcon size={14} /> 添加站内用户</h3>
          <input type="text" value={searchUser} onChange={(e) => setSearchUser(e.target.value)}
            placeholder="搜索用户昵称..." className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm mb-3 focus:outline-none focus:border-accent" />
          <div className="max-h-40 overflow-y-auto space-y-1">
            {filteredUsers.slice(0, 20).map((u) => (
              <div key={u.id} className="flex items-center justify-between bg-hover rounded-card p-2 text-sm">
                <div className="flex items-center gap-2">
                  {u.avatar_url ? <img src={u.avatar_url} className="w-6 h-6 rounded-full" alt="" /> : <UserIcon size={14} className="text-muted" />}
                  <span className="text-secondary">{u.display_name || u.username}</span>
                  <span className="text-muted text-xs">@{u.username}</span>
                </div>
                <button onClick={() => handleAddFromUser(u)}
                  className="text-accent text-xs hover:underline flex items-center gap-0.5"><Plus size={12} /> 添加</button>
              </div>
            ))}
          </div>
        </div>

        {/* 已有名单 */}
        {loading ? <LoadingSpinner size="lg" /> : contacts.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">暂无管理员</p>
        ) : (
          <div className="space-y-3">
            {contacts.map((c) => (
              <div key={c.id} className="border border-border rounded-card p-4">
                {editId === c.id ? (
                  <div className="space-y-2">
                    <input type="text" value={editForm.display_name} onChange={(e) => setEditForm((p) => ({ ...p, display_name: e.target.value }))}
                      placeholder="显示名称" className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm" />
                    <input type="text" value={editForm.contact_info} onChange={(e) => setEditForm((p) => ({ ...p, contact_info: e.target.value }))}
                      placeholder="联系方式（邮箱/手机等）" className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm" />
                    <input type="url" value={editForm.profile_url} onChange={(e) => setEditForm((p) => ({ ...p, profile_url: e.target.value }))}
                      placeholder="其他平台链接" className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm" />
                    <div className="flex gap-2">
                      <button onClick={handleSaveEdit} className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-xs">保存</button>
                      <button onClick={() => setEditId(null)} className="border border-border text-secondary px-4 py-1.5 rounded-button text-xs">取消</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-accent text-sm font-medium">{c.display_name}</span>
                      <div className="flex items-center gap-2">
                        <button onClick={() => startEdit(c)} className="text-accent text-xs hover:underline">编辑</button>
                        <button onClick={() => handleDelete(c.id)} className="text-muted hover:text-danger"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <div className="text-xs text-muted space-y-0.5">
                      {c.contact_info && <p>📧 {c.contact_info}</p>}
                      {c.profile_url && <a href={c.profile_url} target="_blank" className="text-accent hover:underline flex items-center gap-1"><ExternalLink size={10} /> 外部链接</a>}
                      {c.user_id && <Link to={`/user/${c.user_id}`} className="text-accent hover:underline block">查看主页</Link>}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
