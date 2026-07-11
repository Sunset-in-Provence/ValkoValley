import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { X, MessageSquare, Palette, BookOpen, Megaphone, HelpCircle, ArrowRight } from 'lucide-react'

const STORAGE_KEY = 'vv-onboarding-done'

const STEPS = [
  { icon: MessageSquare, title: '讨论区', desc: '文字交流，Markdown排版，支持楼中楼评论和点赞。点击导航栏「讨论区」进入。' },
  { icon: Palette, title: '创作区', desc: '发布图文视频创作，选择文/图/视频类型，自由打标签。点击「创作区」进入。' },
  { icon: BookOpen, title: '档案馆', desc: '浏览官方设定资料，左侧索引卡片可快速跳转分类。欢迎投稿补充新内容。' },
  { icon: Megaphone, title: '公告中心', desc: '查看社区总公告、更新公告和违规公示。重要信息都在这里。' },
  { icon: HelpCircle, title: '需要帮助？', desc: '任何问题都可以在帮助中心找到答案，或联系管理员。' },
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

  function handleClose() {
    setShow(false)
    localStorage.setItem(STORAGE_KEY, '1')
  }

  function handleNext() {
    if (step < STEPS.length - 1) setStep((s) => s + 1)
    else handleClose()
  }

  function handleGo(path) {
    handleClose()
    navigate(path)
  }

  if (!show) return null

  const s = STEPS[step]

  return (
    <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative bg-surface rounded-card shadow-elevated w-full max-w-sm overflow-hidden">
        <div className="bg-accent text-text-inverse p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <s.icon size={24} />
            <span className="font-display text-lg">{s.title}</span>
          </div>
          <button onClick={handleClose} className="text-text-inverse/70 hover:text-text-inverse"><X size={18} /></button>
        </div>
        <div className="p-5">
          <p className="text-secondary text-sm leading-relaxed mb-6">{s.desc}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {STEPS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i === step ? 'bg-accent' : 'bg-hover'}`} />
              ))}
            </div>
            <div className="flex gap-2">
              {step === STEPS.length - 1 && s.title === '需要帮助？' ? (
                <button onClick={() => handleGo('/help')}
                  className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm hover:opacity-90 flex items-center gap-1">
                  前往帮助中心 <ArrowRight size={14} />
                </button>
              ) : (
                <button onClick={handleNext}
                  className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-sm hover:opacity-90 flex items-center gap-1">
                  {step === STEPS.length - 1 ? '完成' : '下一步'} <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
