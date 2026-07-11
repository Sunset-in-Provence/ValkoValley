import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, User, Mail } from 'lucide-react'

export default function ContactPage() {
  const [contacts, setContacts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('admin_contacts').select('*, profile:profiles!admin_contacts_user_id_fkey(avatar_url, username)').order('sort_order')
      setContacts(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <Link to="/help" className="inline-flex items-center gap-1 bg-surface rounded-button px-3 py-1.5 text-muted text-sm mb-4 no-underline hover:text-accent shadow-card">
        <ArrowLeft size={16} /> 返回帮助中心
      </Link>
      <div className="bg-surface rounded-card shadow-card p-6 max-w-2xl">
        <h1 className="font-display text-accent text-2xl mb-6 flex items-center gap-2"><User size={24} /> 联系我们</h1>
        {loading ? <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
         : contacts.length === 0 ? <p className="text-muted text-sm py-8 text-center">暂无管理员信息</p>
         : (
          <div className="space-y-4">
            {contacts.map((c) => (
              <div key={c.id} className="bg-hover rounded-card p-4 flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-surface border border-border overflow-hidden shrink-0 flex items-center justify-center">
                  {c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : <User size={24} className="text-muted" />}
                </div>
                <div className="flex-1 min-w-0">
                  <Link to={`/user/${c.profile?.username || 'unknown'}`} className="text-accent text-sm font-medium no-underline hover:underline">{c.display_name}</Link>
                  <p className="text-muted text-xs">{c.role}</p>
                  {c.contact_info && <p className="text-secondary text-xs mt-0.5 flex items-center gap-1"><Mail size={11} /> {c.contact_info}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
