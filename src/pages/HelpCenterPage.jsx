import { useState } from 'react'
import { Link } from 'react-router-dom'
import OnboardingModal from '@/components/shared/OnboardingModal'
import { ArrowLeft, MessageSquare, Palette, BookOpen, Megaphone, HelpCircle, Shield, UserPlus } from 'lucide-react'

const SECTIONS = [
  {
    icon: MessageSquare, title: '讨论区怎么用？',
    content: '点击导航栏「讨论区」进入，可以发帖、评论、点赞。支持 Markdown 排版和楼中楼回复。',
  },
  {
    icon: Palette, title: '创作区怎么用？',
    content: '点击「创作区」发布你的图文视频作品。选择文/图/视频类型，可以上传图片、嵌入B站/YouTube视频。',
  },
  {
    icon: BookOpen, title: '档案馆怎么用？',
    content: '点击「档案馆」浏览官方设定资料。左侧白色索引卡片可以快速跳转分类。欢迎投稿新内容。',
  },
  {
    icon: Megaphone, title: '公告中心',
    content: '查看社区总公告、更新公告和违规公示。重要通知都会在这里发布，请定期查看。',
  },
  {
    icon: Shield, title: '遇到违规内容？',
    content: '使用举报功能告知管理员。举报后管理员会审核处理，严重违规用户将被永久封禁。',
  },
  {
    icon: HelpCircle, title: '其他问题',
    content: '如有其他疑问，请联系管理员或在讨论区发帖求助。你也可以前往「联系我们」页面查看所有管理员的联系信息。',
    link: { to: '/contact', label: '查看管理员名单' },
  },
]

export default function HelpCenterPage() {
  const [showTutorial, setShowTutorial] = useState(false)

  return (
    <div>
      {showTutorial && <OnboardingModal forceShow />}
      <div className="bg-surface rounded-card shadow-card p-6 max-w-3xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-accent text-2xl flex items-center gap-2">
            <HelpCircle size={24} /> 帮助中心
          </h1>
          <button onClick={() => setShowTutorial(true)}
            className="flex items-center gap-1 bg-accent text-text-inverse px-4 py-2 rounded-button text-sm hover:opacity-90">
            查看新手指引
          </button>
        </div>
        <div className="space-y-4">
          {SECTIONS.map((s, i) => (
            <div key={i} className="bg-hover rounded-card p-4 flex gap-4">
              <s.icon size={24} className="text-accent shrink-0 mt-0.5" />
              <div>
                <h3 className="text-accent text-sm font-medium mb-1">{s.title}</h3>
                <p className="text-secondary text-sm">{s.content}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
