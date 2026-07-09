/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-surface
 *   文字：text-primary, text-secondary
 *   （如需调整视觉效果，请修改 src/index.css 中 @theme 对应值）
 */
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import Footer from './Footer'
import AnnouncementModal from '@/components/shared/AnnouncementModal'

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <AnnouncementModal />
      <Navbar />
      <div className="flex flex-1 max-w-7xl mx-auto w-full gap-6 px-4 py-6">
        <Sidebar />
        <main className="flex-1 min-w-0">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
