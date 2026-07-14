import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { uploadImage } from '@/lib/upload'
import { Send, CheckCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ApplyPage() {
  const [email, setEmail] = useState('')
  const [xhsNickname, setXhsNickname] = useState('')
  const [xhsId, setXhsId] = useState('')
  const [xhsLink, setXhsLink] = useState('')
  const [extraInfo, setExtraInfo] = useState('')
  const [images, setImages] = useState([])
  const [imgUploading, setImgUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleImageUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setImgUploading(true)
    const { url, error } = await uploadImage(file, 'images')
    setImgUploading(false)
    if (error) { toast.error('上传失败: ' + (error.message || error)) }
    else setImages((prev) => [...prev, url])
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim()) { toast.error('请填写邮箱'); return }
    if (!xhsNickname.trim()) { toast.error('请填写小红书昵称'); return }
    if (!xhsId.trim()) { toast.error('请填写小红书号'); return }
    if (!xhsLink.trim()) { toast.error('请填写小红书主页链接'); return }
    if (images.length < 1) { toast.error('请至少上传 1 张图片证据'); return }
    setSubmitting(true)
    const { error } = await supabase.from('registration_applications').insert({
      email: email.trim(), xhs_nickname: xhsNickname.trim(), xhs_id: xhsId.trim(),
      xhs_link: xhsLink.trim(), extra_info: extraInfo.trim(), image_urls: images,
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
          <p className="text-secondary text-sm mb-6">管理员审核通过后，请回到本页面输入邮箱查询邀请码</p>
          <QueryCode />
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
            <label className="text-secondary text-sm font-medium mb-1 block">小红书昵称 *</label>
            <input type="text" value={xhsNickname} onChange={(e) => setXhsNickname(e.target.value)}
              placeholder="你在小红书群聊里的昵称" required
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">小红书号 *</label>
            <input type="text" value={xhsId} onChange={(e) => setXhsId(e.target.value)}
              placeholder="你的小红书ID" required
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">小红书主页链接 *</label>
            <input type="url" value={xhsLink} onChange={(e) => setXhsLink(e.target.value)}
              placeholder="https://www.xiaohongshu.com/..." required
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">审核资料补充</label>
            <textarea value={extraInfo} onChange={(e) => setExtraInfo(e.target.value)}
              rows={4} placeholder="补充你想说的话..."
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted resize-none focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="text-secondary text-sm font-medium mb-1 block">图片证据 *（至少 1 张，仅支持 JPG/PNG/WebP）</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded-card border border-border" />
                  <button onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 bg-danger text-text-inverse rounded-full w-4 h-4 flex items-center justify-center text-[10px]">x</button>
                </div>
              ))}
              {images.length < 5 && (
                <label className="w-16 h-16 border-2 border-dashed border-border rounded-card flex items-center justify-center cursor-pointer hover:border-accent transition-colors">
                  <input type="file" accept="image/*" onChange={handleImageUpload} hidden />
                  {imgUploading ? <Loader2 size={16} className="animate-spin text-muted" /> : <span className="text-muted text-xl">+</span>}
                </label>
              )}
            </div>
          </div>
          {images.length > 0 && (
          <p className="text-warning text-xs">请确认上方图片都能正常显示后再提交。如有破损图请删除重新上传。</p>
        )}
        <button type="submit" disabled={submitting}
            className="w-full bg-accent text-text-inverse py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-1.5">
            <Send size={16} /> {submitting ? '提交中...' : '提交审核'}
          </button>
        </form>
      </div>
    </div>
  )
}

function QueryCode() {
  const [queryEmail, setQueryEmail] = useState('')
  const [result, setResult] = useState(null)
  const [checking, setChecking] = useState(false)

  async function handleQuery(e) {
    e.preventDefault()
    if (!queryEmail.trim()) return
    setChecking(true)
    const { data } = await supabase.from('registration_applications').select('*').eq('email', queryEmail.trim()).eq('status', 'approved').maybeSingle()
    setResult(data)
    setChecking(false)
  }

  return (
    <div className="bg-surface rounded-card shadow-card p-5 w-full max-w-sm mx-auto">
      <h3 className="text-secondary text-sm font-medium mb-3">查询邀请码</h3>
      <form onSubmit={handleQuery} className="flex gap-2">
        <input type="email" value={queryEmail} onChange={(e) => setQueryEmail(e.target.value)}
          placeholder="输入你申请时填的邮箱"
          className="flex-1 bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />
        <button type="submit" disabled={checking}
          className="bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90 disabled:opacity-50 whitespace-nowrap">
          {checking ? '查询中' : '查询'}
        </button>
      </form>
      {result && (
        <div className="mt-4 p-3 bg-success/5 rounded-card text-center">
          <p className="text-success text-xs mb-1">审核已通过！</p>
          <p className="text-accent text-lg font-mono font-bold">{result.invite_code}</p>
          <p className="text-muted text-[10px] mt-1">请使用此邀请码和申请邮箱注册</p>
        </div>
      )}
      {result === null && checking === false && queryEmail && (
        <p className="text-muted text-xs mt-3 text-center">未找到审核记录或尚未通过</p>
      )}
    </div>
  )
}
