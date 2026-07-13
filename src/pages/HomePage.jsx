/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-primary, bg-surface
 *   文字：text-primary, text-secondary, text-muted
 *   圆角：rounded-card, rounded-button
 *   阴影：shadow-card
 *   字体：font-display, font-body
 */
import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Flower } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import GuestbookBanner from '@/components/shared/GuestbookBanner'
import GuestbookCard from '@/components/shared/GuestbookCard'

const WELCOMED_KEY = 'valkovalley-welcomed'

export default function HomePage() {
  const { user } = useAuth()
  const [greeting, setGreeting] = useState('')

  useEffect(() => {
    if (!user) { setGreeting(''); return }
    const welcomed = localStorage.getItem(WELCOMED_KEY)
    if (welcomed) {
      setGreeting('欢迎回来')
    } else {
      setGreeting('欢迎到来')
      localStorage.setItem(WELCOMED_KEY, '1')
    }
  }, [user])

  return (
    <div className="min-h-screen bg-primary">
      <Link to="/lily-garden" className="fixed bottom-24 right-6 z-30 w-12 h-12 bg-accent text-text-inverse rounded-full shadow-elevated flex items-center justify-center hover:opacity-90 transition-all hover:scale-105" title="铃兰花园">
        <Flower size={20} />
      </Link>
      <GuestbookBanner />
      <GuestbookCard />
      {/* Hero 区域 */}
      <section className="max-w-4xl mx-auto px-4 pt-16 sm:pt-24 pb-12 sm:pb-16 text-center relative z-10">
        <h1 className="hero-title font-display text-5xl sm:text-6xl lg:text-7xl mb-4"
          style={{ textShadow: '0 4px 8px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1)' }}>
          ValkoValley
        </h1>
        <p className="hero-title font-display text-xl sm:text-2xl lg:text-3xl mb-2"
          style={{ textShadow: '0 3px 6px rgba(0,0,0,0.12), 0 2px 3px rgba(0,0,0,0.08)' }}>
          狼和铃兰的幸福归来
        </p>
        <p className="hero-title text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 max-w-xl mx-auto"
          style={{ textShadow: '0 2px 4px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)' }}>
          「敖尹×你」的专属社区
        </p>

        <div className="flex items-center justify-center">
          {user ? (
            <Link
              to="/discussion"
              className="bg-accent text-text-inverse px-8 py-3 rounded-button font-display text-lg no-underline hover:opacity-90 transition-opacity"
            >
              {greeting}
            </Link>
          ) : (
            <div className="inline-flex items-center gap-4 bg-surface/80 backdrop-blur-sm rounded-card px-6 py-3 shadow-card">
              <Link
                to="/login"
                className="border border-accent text-accent px-6 py-2.5 rounded-button font-display text-base no-underline hover:bg-hover transition-colors"
              >
                登录
              </Link>
              <Link
                to="/register"
                className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-display text-base no-underline hover:opacity-90 transition-opacity"
              >
                注册
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 特色介绍区域 */}
      <section className="max-w-4xl mx-auto px-4 pb-12 sm:pb-16 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-surface rounded-card shadow-card p-6">
            <h3 className="font-display text-accent text-lg mb-2">📝 讨论区</h3>
            <p className="text-secondary text-sm">
              文字交流，Markdown 排版，支持楼中楼评论。
            </p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <h3 className="font-display text-accent text-lg mb-2">🎨 创作区</h3>
            <p className="text-secondary text-sm">
              图文、视频，在这里发布你的匠心之作！
            </p>
          </div>
          <div className="bg-surface rounded-card shadow-card p-6">
            <h3 className="font-display text-accent text-lg mb-2">🐺 档案馆</h3>
            <p className="text-secondary text-sm">
              这里收录了敖尹所有的已释出官方物料和坊间传闻，如果你有新的信息，欢迎投稿！
            </p>
          </div>
        </div>
      </section>

      {/* 底部链接 */}
      <footer className="text-center pb-8 relative z-10">
        <p className="text-muted text-xs mt-3">
          © {new Date().getFullYear()} ValkoValley
        </p>
      </footer>
    </div>
  )
}
