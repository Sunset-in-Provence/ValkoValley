import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Send, User, Pin, PinOff, Image, X, Loader2 } from 'lucide-react'
import { uploadImage } from '@/lib/upload'
import { loadBannedWords, checkBannedWords } from '@/lib/bannedWords'
import toast from 'react-hot-toast'
import { cn } from '@/lib/utils'

export default function MessagesPage() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const targetUser = searchParams.get('to')
  const [contacts, setContacts] = useState([])
  const [activeChat, setActiveChat] = useState(null)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [msgImages, setMsgImages] = useState([])
  const [imgUploading, setImgUploading] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)

  // 加载联系人 + 偏好
  useEffect(() => {
    if (!user) return
    async function load() {
      const [{ data }, { data: prefs }] = await Promise.all([
        supabase.from('messages')
          .select('sender_id, receiver_id, content, created_at, is_read, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url), receiver:profiles!messages_receiver_id_fkey(username, display_name, avatar_url)')
          .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`).order('created_at', { ascending: false }).limit(500),
        supabase.from('message_prefs').select('*').eq('user_id', user.id),
      ])

      if (!data) { setLoading(false); return }

      const prefMap = {}
      prefs?.forEach((p) => { prefMap[p.contact_id] = p })

      const convos = {}
      data.forEach((m) => {
        const otherId = m.sender_id === user.id ? m.receiver_id : m.sender_id
        const other = m.sender_id === user.id ? m.receiver : m.sender
        if (!convos[otherId]) {
          convos[otherId] = {
            otherId, other, lastMsg: m.content, lastTime: m.created_at, unread: 0,
            isPinned: prefMap[otherId]?.is_pinned || false,
            isMuted: prefMap[otherId]?.is_muted || false,
          }
        }
        if (m.receiver_id === user.id && !m.is_read) convos[otherId].unread++
      })

      let list = Object.values(convos)
      // 置顶优先
      list.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0) || new Date(b.lastTime) - new Date(a.lastTime))
      setContacts(list)

      // 不在此处标记已读，保留红点


      if (targetUser) setActiveChat(targetUser)
      setLoading(false)
    }
    load()
  }, [user, targetUser])

  // 加载聊天记录
  useEffect(() => {
    if (!activeChat) return
    async function load() {
      const { data } = await supabase.from('messages')
        .select('*, sender:profiles!messages_sender_id_fkey(username, display_name, avatar_url)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${activeChat}),and(sender_id.eq.${activeChat},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
      setMessages(data || [])
      const { error } = await supabase.from('messages').update({ is_read: true }).eq('receiver_id', user.id).eq('sender_id', activeChat).eq('is_read', false)
      if (!error) {
        setContacts((prev) => prev.map((c) => c.otherId === activeChat ? { ...c, unread: 0 } : c))
        window.dispatchEvent(new Event('msg-unread-change'))
      }
    }
    load()
    const t = setInterval(load, 3000)
    return () => clearInterval(t)
  }, [activeChat, user])

  const [shouldScroll, setShouldScroll] = useState(false)
  useEffect(() => { if (shouldScroll) { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); setShouldScroll(false) } }, [messages, shouldScroll])

  async function handleMsgImage(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImgUploading(true)
    const { url, error } = await uploadImage(file, 'images')
    setImgUploading(false)
    if (error) toast.error('上传失败')
    else setMsgImages((prev) => [...prev, url])
  }

  async function handleSend(e) {
    e.preventDefault()
    if ((!text.trim() && !msgImages.length) || !activeChat) return
    const words = await loadBannedWords(supabase)
    const hits = checkBannedWords(text, words)
    if (hits.length > 0) { toast.error(`包含违规词：${hits.slice(0, 3).join('、')}`); return }
    const { error } = await supabase.from('messages').insert({ sender_id: user.id, receiver_id: activeChat, content: text.trim() || '', image_urls: msgImages })
    if (error) toast.error('发送失败')
    else {
      const now = new Date().toISOString()
      const lastMsg = text.trim() || (msgImages.length > 0 ? '[图片]' : '')
      setText(''); setMsgImages([])
      setMessages((prev) => [...prev, { sender_id: user.id, content: text.trim() || '', image_urls: msgImages, created_at: now, sender: { username: user.email } }])
      setContacts((prev) => prev.map((c) => c.otherId === activeChat ? { ...c, lastMsg, lastTime: now } : c))
      setShouldScroll(true)
    }
  }

  async function togglePin(contactId, current) {
    await supabase.from('message_prefs').upsert({ user_id: user.id, contact_id: contactId, is_pinned: !current }, { onConflict: 'user_id,contact_id' })
    setContacts((prev) => prev.map((c) => c.otherId === contactId ? { ...c, isPinned: !current } : c))
  }

  return (
    <div>
      {!activeChat ? (
        <div>
          <h1 className="font-display text-accent text-2xl mb-4">私信</h1>
          {loading ? <LoadingSpinner size="lg" /> : contacts.length === 0 ? <p className="text-muted text-sm py-16 text-center">暂无私信</p> : (
            <div className="space-y-1">
              {contacts.map((c) => (
                <div key={c.otherId} className={cn('bg-surface rounded-card border border-border hover:bg-hover transition-colors group', c.isPinned && 'border-accent/30')}>
                  <button onClick={() => setActiveChat(c.otherId)} className="w-full p-3 flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-hover flex items-center justify-center shrink-0">
                      {c.other?.avatar_url ? <img src={c.other.avatar_url} className="w-10 h-10 rounded-full" alt="" /> : <User size={18} className="text-muted" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-secondary text-sm font-medium flex items-center gap-1">
                          {c.isPinned && <Pin size={10} className="text-accent" />}
                          {c.other?.display_name || c.other?.username || '未知'}
                        </span>
                        <span className="text-muted text-[10px]">{new Date(c.lastTime).toLocaleDateString('zh-CN')}</span>
                      </div>
                      <p className="text-muted text-xs truncate">{c.lastMsg}</p>
                    </div>
                    {c.unread > 0 && <span className="bg-danger text-text-inverse text-[10px] px-1.5 py-0.5 rounded-full shrink-0">{c.unread}</span>}
                  </button>
                  {/* 操作按钮 */}
                  <div className="flex justify-end gap-2 px-3 pb-2">
                    <button onClick={() => togglePin(c.otherId, c.isPinned)}
                      className="text-muted text-[10px] hover:text-accent flex items-center gap-0.5">
                      {c.isPinned ? <PinOff size={10} /> : <Pin size={10} />}
                      {c.isPinned ? '取消置顶' : '置顶'}
                    </button>
                    <button onClick={async () => {
                      await supabase.from('messages').update({ is_read: false }).eq('sender_id', c.otherId).eq('receiver_id', user.id).eq('is_read', true)
                      toast.success('已标记未读')
                      setContacts((prev) => prev.map((x) => x.otherId === c.otherId ? { ...x, unread: x.unread + 1 } : x))
                      window.dispatchEvent(new Event('msg-unread-change'))
                    }}
                      className="text-muted text-[10px] hover:text-accent">标记未读</button>
                  </div>
                </div>
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
                    {m.image_urls?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {m.image_urls.map((url, i) => (
                          <img key={i} src={url} alt="" className="max-w-[120px] max-h-[120px] object-cover rounded cursor-pointer" onClick={() => window.open(url, '_blank')} />
                        ))}
                      </div>
                    )}
                    <p className={`text-[10px] mt-1 ${isMe ? 'text-text-inverse/60' : 'text-muted'}`}>
                      {new Date(m.created_at).toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-border shrink-0">
            {msgImages.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {msgImages.map((url, i) => (
                  <div key={i} className="relative"><img src={url} alt="" className="w-12 h-12 object-cover rounded-card border border-border" />
                    <button type="button" onClick={() => setMsgImages((p) => p.filter((_, j) => j !== i))}
                      className="absolute -top-1 -right-1 bg-danger text-text-inverse rounded-full w-4 h-4 flex items-center justify-center text-[10px]"><X size={10} /></button></div>
                ))}
              </div>
            )}
            <div className="flex gap-2">
              <input type="text" value={text} onChange={(e) => setText(e.target.value)}
                placeholder="输入消息..." className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-sm text-primary dark:text-white focus:outline-none focus:border-accent" />
              <label className="flex items-center text-muted hover:text-accent cursor-pointer">
                <input type="file" accept="image/*" onChange={handleMsgImage} hidden />
                {imgUploading ? <Loader2 size={18} className="animate-spin" /> : <Image size={18} />}
              </label>
              <button type="submit" disabled={!text.trim() && !msgImages.length}
                className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 disabled:opacity-40 flex items-center gap-1">
                <Send size={14} />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
