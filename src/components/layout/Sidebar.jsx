/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-surface
 *   文字：text-primary, text-secondary, text-muted
 *   圆角：rounded-card
 *   阴影：shadow-card
 */
import { Link, useLocation } from 'react-router-dom'
import { MessageSquare, Palette, BookOpen, FileText, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const links = [
  { to: '/discussion', label: '讨论区', icon: MessageSquare },
  { to: '/creation', label: '创作区', icon: Palette },
  { to: '/library', label: '设定图书馆', icon: BookOpen },
  { to: '/rules', label: '社区公约', icon: FileText },
  { to: '/violations', label: '违规公示', icon: AlertTriangle },
]

export default function Sidebar() {
  const location = useLocation()

  return (
    <aside className="w-48 shrink-0 hidden lg:block">
      <div className="bg-surface rounded-card shadow-card p-3 sticky top-20">
        <nav className="flex flex-col gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(to)
            return (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-button text-sm transition-colors no-underline',
                  isActive
                    ? 'bg-accent text-text-inverse'
                    : 'text-secondary hover:bg-hover hover:text-accent'
                )}
              >
                <Icon size={16} />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
