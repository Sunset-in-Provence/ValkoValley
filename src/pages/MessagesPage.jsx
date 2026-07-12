import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { useSearchParams } from 'react-router-dom'
import { ArrowLeft, Send, User } from 'lucide-react'
import toast from 'react-hot-toast'

export default function MessagesPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const targetUser = searchParams.get('to')
  const [contacts, setContacts] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const intervalRef = useRef(null)

  // 加载最近联系人
  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, is_read, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url), receiver:profiles!messages_receiver_id_fkey(username, display_name, avatar_url)')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(500)

      if (!data) { setLoading(false); return }

      // 按对话分组
      const convos = {}
      data.forEach((m) => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
        const other = m.sender_id === user.id ? m.receiver : m.sender
        if (!convos[otherId]) {
          convos[otherId] = { otherId, other, lastMsg: m.content, lastTime: m.created_at, unread: 0 }
        }
        if (m.receiver_id === user.id && !m.is_read) convos[otherId].unread++
      })

      setContacts(Object.values(convos))
      // 如果URL带了?to= 参数，自动打开聊天
      if (targetUser) setActiveChat(targetUser)
      setLoading(false)
    }
    load()
  }, [user])

  // 加载聊天记录
  useEffect(() => {
    if (!activeChat) return
    async function load() {
      const { data } = await supabase
        .from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat}),and(sender_id.eq.${activeChat},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      // 标记已读
      supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', activeChat).eq('is_read', false).then()
    }
    load()
  }, [activeChat, user])

  // 实时轮询
  useEffect(() => {
    if (!activeChat) return
    intervalRef.current = setInterval(async () => {
      const { data } = await supabase.from('messages').select('*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat}),and(sender_id.eq.${activeChat},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      if (data && data.length !== messages.length) {
        setMessages(data)
        supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', activeChat).eq('is_read', false).then()
      }
    }, 3000)
    return () => clearInterval(intervalRef.current)
  }, [activeChat, user, messages.length])

  // 滚动到底
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!text.trim() || !activeChat) return
    const { error } = await supabase.from('messages').insert({
      sender_id: user.id, receiver_id: activeChat, content: text.trim(),
    })
    if (error) toast.error('发送失败')
    else { setText(''); setMessages((prev) => [...prev, { sender_id: user.id, content: text.trim(), created_at: new Date().toISOString(), sender: { username: user.email } }]) }
  }

  return (
    <div>
      {!activeChat ? (
        <div>
          <h1 className="font-display text-accent text-2xl mb-4">私信</h1>
          {loading ? <LoadingSpinner size="lg" /> : contacts.length === 0 ? <p className="text-muted text-sm py-16 text-center">暂无私信</p>
           : (
             <div className="space-y-1">
               {contacts.map((c) => (
                 <button key={c.otherId} onClick={() => setActiveChat(c.otherId)}
                   className="w-full bg-surface rounded-card p-3 flex items-center gap-3 hover:bg-hover transition-colors border border-border">
                   <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center">
                     {c.other?.avatar_url ? <img src={c.other.avatar_url} className="w-10 h-10 rounded-full" alt="" /> : <User size={18} className="text-muted" />}
                   </div>
                   <div className="flex-1 text-left min-w-0">
                     <div className="flex items-center justify-between">
                       <span className="text-secondary text-sm font-medium">{c.other?.display_name || c.other?.username || '未知'}</span>
                       <span className="text-muted text-[10px]">{new Date(c.lastTime).toLocaleDateString('zh-CN')}</span>
                     </div>
                     <p className="text-muted text-xs truncate">{c.lastMsg}</p>
                   </div>
                   {c.unread > 0 && <span className="bg-danger text-text-inverse text-[10px] px-1.5 py-0.5 rounded-full">{c.unread}</span>}
                 </button>
               ))}
             </div>
           )}
        </div>
      ) : (
        <div className="flex flex-col" style={{ height: 'calc(100vh - 3.5rem)' }}>
          <div className="flex items-center gap-3 p-3 border-b border-border shrink-0">
            <button onClick={() => setActiveChat(null)} className="text-muted hover:text-accent"><ArrowLeft size={18} /></button>
            <span className="font-medium text-accent text-sm">{contacts.find((c) => c.otherId === activeChat)?.other?.display_name || '聊天'}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((m, i) => {
              const isMe = m.sender_id === user.id
              return (
                <div key={i} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] rounded-card px-4 py-2 text-sm ${isMe ? 'bg-accent text-text-inverse' : 'bg-hover text-secondary'}`}>
                    <p>{m.content}</p>
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-text-inverse/60' : 'text-muted'}`}>
                      {new Date(m.created_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-border shrink-0 flex gap-2">
            <input type="text" value={text} onChange={(e) => setText(e.target.value)}
              placeholder="输入消息..." className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm focus:outline-none focus:border-accent" />
            <button type="submit" disabled={!text.trim()}
              className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 disabled:opacity-40 flex items-center gap-1">
              <Send size={14} /> 发送
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
