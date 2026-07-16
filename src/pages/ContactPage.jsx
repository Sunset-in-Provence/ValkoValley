import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, User, Mail, Copy, MessageSquare, ExternalLink } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ContactPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('admin_contacts').select('*, profile:user_id(username)').order('sort_order', { ascending: true })
      setContacts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  function copy(text) {
    navigator.clipboard.writeText(text).then(() => toast.success('已复制'))
  }

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  return (
    <div className="max-w-3xl mx-auto">
      <Link to="/discussion" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回
      </Link>

      <div className="bg-surface rounded-card shadow-card p-6">
        <h1 className="font-display text-accent text-2xl mb-6">联系我们</h1>

        {contacts.length === 0 ? (
          <p className="text-muted text-sm py-8 text-center">暂无管理员信息</p>
        ) : (
          <div className="space-y-4">
            {contacts.map((c) => (
              <div key={c.id} className="bg-hover rounded-card p-4 flex flex-col sm:flex-row gap-4">
                {/* 头像+名称 */}
                <div className="flex items-center gap-3 sm:w-48 shrink-0">
                  {c.avatar_url ? (
                    <img src={c.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center border-2 border-border">
                      <User size={22} className="text-muted" />
                    </div>
                  )}
                  <Link to={c.profile?.username ? `/user/${c.profile.username}` : '#'} className="text-accent font-medium text-sm hover:underline">
                    {c.display_name}
                  </Link>
                </div>

                {/* 联系方式 */}
                <div className="flex-1 space-y-1.5">
                  {c.contact_info && (
                    <div className="flex items-center gap-2 text-xs">
                      <Mail size={12} className="text-muted shrink-0" />
                      <span className="text-secondary">{c.contact_info}</span>
                      <button onClick={() => copy(c.contact_info)} className="text-muted hover:text-accent"><Copy size={11} /></button>
                    </div>
                  )}
                  {c.profile_url && (
                    <div className="flex items-center gap-2 text-xs">
                      <ExternalLink size={12} className="text-muted shrink-0" />
                      <a href={c.profile_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{c.profile_url}</a>
                    </div>
                  )}
                </div>

                {/* 私信 */}
                {user && c.user_id && (
                  <button onClick={() => navigate(`/messages?to=${c.user_id}`)}
                    className="shrink-0 flex items-center gap-1 text-xs text-accent hover:underline">
                    <MessageSquare size={14} /> 私信
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
