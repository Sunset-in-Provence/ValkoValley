/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-primary, bg-surface
 *   文字：text-primary, text-secondary, text-muted
 *   圆角：rounded-card, rounded-button
 *   阴影：shadow-card
 *   字体：font-display, font-body
 */
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function HomePage() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero 区域 */}
      <section className="max-w-4xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="font-display text-accent text-5xl mb-4">
          ValkoValley
        </h1>
        <p className="font-display text-secondary text-2xl mb-2">
          狼和铃兰的幸福归来
        </p>
        <p className="text-muted text-lg mb-8 max-w-xl mx-auto">
          敖尹 CP 同人创作与讨论的专属社区。通过入站考试，与同好一起守护这份美好。
        </p>

        <div className="flex items-center justify-center gap-4">
          {user ? (
            <>
              <Link
                to="/discussion"
                className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium no-underline hover:opacity-90 transition-opacity"
              >
                进入讨论区
              </Link>
              <Link
                to="/creation"
                className="border border-border text-secondary px-6 py-2.5 rounded-button font-medium no-underline hover:bg-hover transition-colors"
              >
                浏览创作
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/register"
                className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium no-underline hover:opacity-90 transition-opacity"
              >
                加入社区
              </Link>
              <Link
                to="/login"
                className="border border-border text-secondary px-6 py-2.5 rounded-button font-medium no-underline hover:bg-hover transition-colors"
              >
                登录
              </Link>
            </>
          )}
        </div>
      </section>

      {/* 特色介绍区域（管理员可编辑） */}
      <section className="max-w-4xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-card shadow-card p-6">
            <h3 className="font-display text-accent text-lg mb-2">📝 讨论区</h3>
            <p className="text-secondary text-sm">
              文字交流，Markdown 排版，支持楼中楼评论。在这里畅聊敖尹的一切。
            </p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <h3 className="font-display text-accent text-lg mb-2">🎨 创作区</h3>
            <p className="text-secondary text-sm">
              图文视频创作，自由打标签。发布你的同人文、手绘、MAD 作品。
            </p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <h3 className="font-display text-accent text-lg mb-2">🐺 档案馆</h3>
            <p className="text-secondary text-sm">
              不只是讨论与创作！ValkoValley 收录敖尹相关的官方设定、同人史料与社区记忆，守护这片山谷中的一切痕迹。
            </p>
          </div>
        </div>
      </section>

      {/* 底部链接 */}
      <footer className="text-center pb-8">
        <div className="flex justify-center gap-6 text-sm">
          <Link to="/rules" className="text-muted hover:text-accent transition-colors no-underline">
            社区公约
          </Link>
          <Link to="/violations" className="text-muted hover:text-accent transition-colors no-underline">
            违规公示
          </Link>
        </div>
        <p className="text-muted text-xs mt-3">
          © {new Date().getFullYear()} ValkoValley
        </p>
      </footer>
    </div>
  )
}
