import { useState } from 'react'
import { Link } from 'react-router-dom'
import OnboardingModal from '@/components/shared/OnboardingModal'
import { ArrowLeft, MessageSquare, Palette, BookOpen, Megaphone, HelpCircle, Shield, MessageCircle, Flower, ExternalLink, Globe } from 'lucide-react'

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
    icon: MessageCircle, title: '留言弹幕墙',
    content: '在登录介绍页右下角有一个留言按钮，提交留言后经管理员审核通过，你的留言会以弹幕形式在页面上滚动展示。',
  },
  {
    icon: Megaphone, title: '公告中心',
    content: '查看社区总公告、更新公告和违规公示。重要通知都会在这里发布，请定期查看。',
  },
  {
    icon: Flower, title: '铃兰养成系统',
    content: '通过每日浇水、发帖、评论、点赞积累贡献值，养大一株铃兰需要400贡献值。成熟的铃兰可以贡献到铃兰谷，兑换邀请码邀请朋友加入。',
  },
  {
    icon: Shield, title: '内容审核机制',
    content: '所有发布内容均受违禁词自动检测。违规内容将被拦截。管理员可手动审核举报并封禁违规用户。严重违规行为将被永久公示。',
  },
  {
    icon: ExternalLink, title: '外网推荐',
    content: '在导航栏「外网推荐」分区，你可以分享和浏览海外创作者的推荐信息。这不是一个发布R18内容的地方，而是指路牌。',
  },
  {
    icon: Globe, title: '共创宇宙',
    content: '敖尹宇宙共创企划！每个星纪围绕不同主题展开，你可以参与主题投票、投稿建设剧情（正剧构史或IF线自由建设），邀请其他用户共创，共同谱写敖尹的万千宇宙。',
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
                <p className="text-secondary text-sm">{s.content}{s.link && <> — <Link to={s.link.to} className="text-accent hover:underline">{s.link.label}</Link></>}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
