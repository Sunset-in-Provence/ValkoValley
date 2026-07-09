/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-surface
 *   文字：text-muted
 *   边框：border-border
 */
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="bg-surface border-t border-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-muted text-xs">
        <span>© {new Date().getFullYear()} ValkoValley — 狼和铃兰的幸福归来</span>
        <div className="flex gap-4">
          <Link to="/rules" className="text-muted hover:text-accent transition-colors no-underline">
            社区公约
          </Link>
          <Link to="/violations" className="text-muted hover:text-accent transition-colors no-underline">
            违规公示
          </Link>
        </div>
      </div>
    </footer>
  )
}
