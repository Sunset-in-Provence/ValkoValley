import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Send, CheckCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ApplyPage() {
  const [email, setEmail] = useState('')
  const [xhsLink, setXhsLink] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { toast.error('请填写邮箱'); return }
    setSubmitting(true)
    const { error } = await supabase.from('registration_applications').insert({
      email: email.trim(), xhs_link: xhsLink.trim(), extra_info: extraInfo.trim(),
    })
    setSubmitting(false)
    if (error) toast.error('提交失败: ' + error.message)
    else { setSubmitted(true); toast.success('审核资料已提交，请等待管理员审核') }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center px-4">
        <div className="text-center">
          <CheckCircle size={48} className="text-success mx-auto mb-4" />
          <h1 className="font-display text-accent text-2xl mb-2">资料已提交</h1>
          <p className="text-secondary text-sm">管理员审核通过后会发送邀请码到你的邮箱，请留意查收</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="bg-surface rounded-card shadow-elevated p-6 w-full max-w-md">
        <h1 className="font-display text-accent text-xl mb-2">申请加入 ValkoValley</h1>
        <p className="text-muted text-sm mb-2">填写审核资料，管理员审核通过后将发送邀请码到你的邮箱</p>
        <p className="text-warning text-xs mb-6">⚠️ 通过本页面获取的邀请码将绑定你填写的邮箱，注册时必须使用相同邮箱</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">邮箱 *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" required
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">小红书主页链接</label>
            <input type="url" value={xhsLink} onChange={(e) => setXhsLink(e.target.value)}
              placeholder="https://www.xiaohongshu.com/..."
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">审核资料补充</label>
            <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)}
              rows={4} placeholder="补充你想说的话..."
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted resize-none focus:outline-none focus:border-accent" />
          </div>
          <button type="submit" disabled={submitting}
            className="w-full bg-accent text-text-inverse py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Send size={16} /> {submitting ? '提交中...' : '提交审核'}
          </button>
        </form>
      </div>
    </div>
  )
}
