import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { Droplets, Flower, Gift, ArrowRight, Mail, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const MATURE_POINTS = 400

export default function LilyGardenPage() {
  const { user } = useAuth()
  const [total, setTotal] = useState(0)
  const [sacrificed, setSacrificed] = useState(0)
  const [messages, setMessages] = useState([])
  const [showMailbox, setShowMailbox] = useState(false)
  const [watered, setWatered] = useState(false)
  const [posted, setPosted] = useState(false)
  const [commented, setCommented] = useState(false)
  const [liked, setLiked] = useState(false)
  const [loading, setLoading] = useState(true)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    if (!user) return
    async function load() {
      const { data } = await supabase.from('contribution_log').select('points, action, created_at').eq('user_id', user.id)
      const today = new Date().toISOString().slice(0, 10)
      const pts = data?.reduce((s, r) => s + (r.points || 0), 0) || 0
      setTotal(pts)
      setWatered(data?.some((r) => r.action === 'daily_water' && r.created_at >= today))
      setPosted(data?.some((r) => r.action === '发帖' && r.created_at >= today))
      setCommented(data?.some((r) => r.action === '评论' && r.created_at >= today))
      setLiked(data?.some((r) => r.action === '点赞' && r.created_at >= today))
      const { data: mailbox } = await supabase.from('lily_mailbox').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
      setMessages(mailbox || [])
      const { data: garden } = await supabase.from('lily_garden').select('propagated_count').eq('user_id', user.id).maybeSingle()
      setSacrificed(garden?.propagated_count || 0)
      if (!garden) await supabase.from('lily_garden').insert({ user_id: user.id })
      setLoading(false)
    }
    load()
  }, [user])

  if (loading) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  const progress = Math.min(total / MATURE_POINTS * 100, 100)
  const matureCount = Math.floor(total / MATURE_POINTS) - sacrificed
  const stage = total < 80 ? 'seed' : total < 160 ? 'sprout' : total < 240 ? 'bud' : total < 320 ? 'bloom' : 'mature'
  const stageEmoji = { seed: '🌰', sprout: '🌱', bud: '🌿', bloom: '🌼', mature: '🌸' }

  async function handleWater() {
    if (watered) { toast('今天已经浇过水了'); return }
    setAnimating(true)
    await supabase.from('contribution_log').insert({ user_id: user.id, action: 'daily_water', points: 10 })
    setTotal((p) => p + 10); setWatered(true); toast.success('浇灌铃兰 +10 🌸')
    setTimeout(() => setAnimating(false), 1500)
  }

  async function handleSacrifice() {
    if (matureCount < 1) { toast.error('还没有成熟的铃兰可以贡献'); return }
    if (!confirm('贡献一株成熟的铃兰到铃兰谷，系统将自动发放一个邀请码到你的信箱。确定吗？')) return

    const code = 'VV' + Math.random().toString(36).slice(2, 8).toUpperCase()
    await supabase.from('invite_codes').insert({ code, created_by: user.id, max_uses: 1 })

    const { error } = await supabase.from('lily_garden').update({
      propagated_count: sacrificed + 1,
    }).eq('user_id', user.id)

    if (error) toast.error('操作失败')
    else {
      await Promise.all([
        supabase.from('valley_lilies').insert({ owner_id: user.id, name: `铃兰 #${sacrificed + 1}` }),
        supabase.from('lily_mailbox').insert({ user_id: user.id, code }),
      ])
      setSacrificed((s) => s + 1)
      setMessages((prev) => [{ code, created_at: new Date().toISOString(), copied: false }, ...prev])
      toast.success('🌱 铃兰已移入铃兰谷！邀请码已发放到信箱')
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="font-display text-accent text-2xl mb-2 flex items-center gap-2"><Flower size={28} /> 铃兰花园</h1>
      <p className="text-muted text-sm mb-4">
        通过每日浇水、发帖、评论、点赞积累贡献值({total}/400)，养大铃兰后可贡献到铃兰谷兑换邀请码。
        已兑换 {sacrificed} 次，可兑换 {matureCount} 次。
      </p>

      {/* 铃兰展示 */}
      <div className="bg-surface rounded-card shadow-card p-8 mb-4 text-center">
        <div className={`text-8xl mb-4 transition-all duration-1000 ${animating ? 'scale-125' : ''}`}
          style={{ filter: `drop-shadow(0 0 ${Math.min(progress, 100)}px rgba(94,174,124,${Math.min(progress/100, 1)}))` }}>
          {stageEmoji[stage]}
        </div>
        <div className="w-full bg-hover rounded-full h-3 mb-2 overflow-hidden">
          <div className="bg-accent h-full rounded-full transition-all duration-1000"
            style={{ width: `${progress % 100}%` }} />
        </div>
        <div className="flex items-center justify-between text-xs text-muted mt-1">
          <span>{Math.round(progress % 100)}% 至成熟</span>
          <span>{total}/{MATURE_POINTS} 贡献值</span>
        </div>
        {matureCount > 0 && <p className="text-accent text-xs mt-2">🌼 {matureCount} 株待贡献</p>}
      </div>

      {/* 每日任务 */}
      <div className="bg-surface rounded-card shadow-card p-4 mb-4 grid grid-cols-2 gap-2">
        <button onClick={handleWater} disabled={watered}
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-button border transition-colors ${watered ? 'bg-hover text-muted cursor-default' : 'border-accent/30 text-accent hover:bg-accent/10'}`}>
          <Droplets size={14} /> {watered ? '已浇水 +10' : '浇水 +10'}
        </button>
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-button border ${posted ? 'bg-hover text-muted' : 'bg-hover text-secondary'}`}>
          📝 {posted ? '已发帖 +10' : '发帖 +10'}
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-button border ${commented ? 'bg-hover text-muted' : 'bg-hover text-secondary'}`}>
          💬 {commented ? '已评论 +10' : '评论 +10'}
        </div>
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-button border ${liked ? 'bg-hover text-muted' : 'bg-hover text-secondary'}`}>
          ❤️ {liked ? '已点赞 +10' : '点赞 +10'}
        </div>
      </div>

      {/* 贡献兑换 */}
      {matureCount > 0 && (
        <button onClick={handleSacrifice}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-button font-medium text-sm bg-warning/10 text-warning border border-warning/30 hover:bg-warning/20">
          <Gift size={18} /> 贡献铃兰兑换邀请码（还有 {matureCount} 次机会）
        </button>
      )}

      {/* 信箱 */}
      <div className="mt-4 bg-surface rounded-card shadow-card">
        <button onClick={() => setShowMailbox(!showMailbox)} className="w-full p-4 flex items-center justify-between">
          <span className="text-secondary text-sm font-medium flex items-center gap-2">
            <Mail size={16} className="text-accent" /> 邀请码信箱
            {messages.length > 0 && <span className="bg-accent/10 text-accent text-xs px-1.5 py-0.5 rounded-full">{messages.length}</span>}
          </span>
          <span className="text-muted text-xs">{showMailbox ? '收起' : '展开'}</span>
        </button>
        {showMailbox && (
          <div className="px-4 pb-4 space-y-2">
            {messages.length === 0 ? <p className="text-muted text-xs py-3 text-center">信箱是空的，贡献铃兰获取邀请码</p> : (
              messages.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-hover rounded-card p-2.5">
                  <span className="text-primary text-sm font-mono font-bold">{m.code}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => {
                      navigator.clipboard.writeText(m.code)
                      supabase.from('lily_mailbox').update({ copied: true }).eq('id', m.id).then()
                      setMessages((prev) => prev.map((x) => x.id === m.id ? { ...x, copied: true } : x))
                      toast.success('已复制')
                    }}
                      className="text-accent text-xs hover:underline flex items-center gap-1">
                      <Copy size={12} /> {m.copied ? '已复制' : '复制'}
                    </button>
                    <span className="text-muted text-[10px]">{new Date(m.created_at).toLocaleDateString('zh-CN')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 铃兰谷入口 */}
      <a href="/lily-valley" className="block mt-4 bg-surface rounded-card shadow-card p-4 no-underline hover:shadow-elevated transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-accent text-sm font-medium flex items-center gap-2"><Flower size={18} /> 铃兰谷</span>
          <span className="text-muted text-xs">{sacrificed} 株 {sacrificed === 0 ? '还没有铃兰' : '→'}</span>
        </div>
      </a>
    </div>
  )
}
