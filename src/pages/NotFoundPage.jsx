/**
 * UI 变量映射：bg-primary, text-primary, text-secondary, text-accent,
 *   rounded-button, font-display
 */
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4">
      <h1 className="font-display text-accent text-6xl mb-4">404</h1>
      <p className="text-secondary text-lg mb-6">页面不存在，可能已被删除或地址有误。</p>
      <Link
        to="/"
        className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium no-underline hover:opacity-90"
      >
        返回首页
      </Link>
    </div>
  )
}
