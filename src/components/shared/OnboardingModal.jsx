import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { X, MessageSquare, Palette, BookOpen, Megaphone, HelpCircle, ArrowRight, Menu, MessageCircle } from 'lucide-react'

const STORAGE_KEY = 'vv-onboarding-done'

const STEPS = [
  {
    icon: Menu, title: '导航菜单',
    desc: '移动端点击 Logo 左侧的 ☰ 图标打开菜单，讨论区、创作区、档案馆、公告中心、帮助中心都在里面。桌面端则直接显示在导航栏上。',
  },
  {
    icon: MessageSquare, title: '讨论区',
    desc: '文字交流，Markdown 排版，支持楼中楼评论和点赞。可以给帖子附图，按时间和热度排序浏览。',
  },
  {
    icon: Palette, title: '创作区',
    desc: '发布图文视频创作。选择文/图/视频类型，自由打标签。可以上传本地图片和视频，也可以嵌入 B站/YouTube 链接。',
  },
  {
    icon: BookOpen, title: '档案馆',
    desc: '浏览官方设定资料。左侧白色索引卡片可快速跳转分类（设定/图鉴/视频/音乐）。欢迎投稿补充新内容，管理员审核后发布。',
  },
  {
    icon: MessageCircle, title: '留言弹幕墙',
    desc: '在登录介绍页右下角有一个留言按钮，提交留言后经管理员审核通过，你的留言会以弹幕形式在页面上滚动展示。',
  },
  {
    icon: Megaphone, title: '公告中心',
    desc: '查看社区总公告、更新公告和违规公示。新公告发布时会有强制弹窗提醒，滚动到底部确认即表示已阅读。',
  },
  {
    icon: HelpCircle, title: '内容审核机制',
    desc: '所有发布内容均受违禁词自动检测。违规内容将被拦截。管理员可手动审核举报并封禁违规用户。严重违规行为将被永久公示。',
  },
  {
    icon: HelpCircle, title: '需要更多帮助？',
    desc: '帮助中心有详细的功能说明。如需联系管理员，可在帮助中心或联系我们页面找到管理员信息。',
  },
]

export default function OnboardingModal({ forceShow = false }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [show, setShow] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (forceShow) { setShow(true); setStep(0); return }
    if (!user) return
    if (localStorage.getItem(STORAGE_KEY)) return
    setTimeout(() => setShow(true), 800)
  }, [user, forceShow])

  function handleClose() { setShow(false); localStorage.setItem(STORAGE_KEY, '1') }
  function handleNext() { if (step < STEPS.length - 1) setStep((s) => s + 1); else handleClose() }
  function handleGo(path) { handleClose(); navigate(path) }

  if (!show) return null
  const s = STEPS[step]

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-surface rounded-card shadow-elevated w-full max-w-sm overflow-hidden">
        <div className="bg-accent text-text-inverse p-4 flex items-center justify-between">
          <div className="flex items-center gap-2"><s.icon size={24} /><span className="font-display text-lg">{s.title}</span></div>
          <button onClick={handleClose} className="text-text-inverse/70 hover:text-text-inverse"><X size={18} /></button>
        </div>
        <div className="p-5">
          <p className="text-secondary text-sm leading-relaxed mb-6">{s.desc}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">{STEPS.map((_, i) => <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-accent' : 'bg-hover'}`} />)}</div>
            <div className="flex gap-2">
              {step === STEPS.length - 1 ? (
                <button onClick={() => handleGo('/help')} className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm hover:opacity-90 flex items-center gap-1">前往帮助 <ArrowRight size={14} /></button>
              ) : (
                <button onClick={handleNext} className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm hover:opacity-90 flex items-center gap-1">{step === STEPS.length - 1 ? '完成' : '下一步'} <ArrowRight size={14} /></button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
