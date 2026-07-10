import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import AppLayout from '@/components/layout/AppLayout'
import ProtectedRoute from '@/components/auth/ProtectedRoute'
import SitePassGate from '@/components/shared/SitePassGate'
import LoadingSpinner from '@/components/shared/LoadingSpinner'

// 公开页面 — 立即加载（作为入口页面，不应延迟）
import HomePage from '@/pages/HomePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import RulesPage from '@/pages/RulesPage'
import AnnouncementsPage from '@/pages/AnnouncementsPage'
import NotFoundPage from '@/pages/NotFoundPage'

// 需登录的页面 — 懒加载（路由级代码分割）
const DiscussionPage = lazy(() => import('@/pages/DiscussionPage'))
const DiscussionDetailPage = lazy(() => import('@/pages/DiscussionDetailPage'))
const PostEditor = lazy(() => import('@/components/discussion/PostEditor'))
const CreationPage = lazy(() => import('@/pages/CreationPage'))
const CreationDetailPage = lazy(() => import('@/pages/CreationDetailPage'))
const CreationEditor = lazy(() => import('@/components/creation/CreationEditor'))
const LibraryPage = lazy(() => import('@/pages/LibraryPage'))
const LibraryDetailPage = lazy(() => import('@/pages/LibraryDetailPage'))
const LibraryEditorPage = lazy(() => import('@/pages/LibraryEditorPage'))
const UserProfilePage = lazy(() => import('@/pages/UserProfilePage'))
const AdminPage = lazy(() => import('@/pages/AdminPage'))
const AdminThemePage = lazy(() => import('@/pages/AdminThemePage'))
const AdminExamPage = lazy(() => import('@/pages/AdminExamPage'))
const AdminAnnouncePage = lazy(() => import('@/pages/AdminAnnouncePage'))
const AdminInvitesPage = lazy(() => import('@/pages/AdminInvitesPage'))

function Lazy({ children }) {
  return <Suspense fallback={<div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>}>{children}</Suspense>
}

export default function App() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          className: 'font-body',
          style: { borderRadius: 'var(--radius-card)', fontFamily: 'var(--font-body)' },
        }}
      />
      <SitePassGate>
      <Routes>
        {/* 公开页面 — 立即加载 */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/rules" element={<RulesPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />

        {/* 讨论区 */}
        <Route path="/discussion" element={<Lazy><ProtectedRoute><AppLayout><DiscussionPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/discussion/:id" element={<Lazy><ProtectedRoute><AppLayout><DiscussionDetailPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/discussion/new" element={<Lazy><ProtectedRoute><AppLayout><PostEditor /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/discussion/:id/edit" element={<Lazy><ProtectedRoute><AppLayout><PostEditor /></AppLayout></ProtectedRoute></Lazy>} />

        {/* 创作区 */}
        <Route path="/creation" element={<Lazy><ProtectedRoute><AppLayout><CreationPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/creation/:id" element={<Lazy><ProtectedRoute><AppLayout><CreationDetailPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/creation/new" element={<Lazy><ProtectedRoute><AppLayout><CreationEditor /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/creation/:id/edit" element={<Lazy><ProtectedRoute><AppLayout><CreationEditor /></AppLayout></ProtectedRoute></Lazy>} />

        {/* 档案馆 */}
        <Route path="/library" element={<Lazy><ProtectedRoute><AppLayout><LibraryPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/library/new" element={<Lazy><ProtectedRoute><AppLayout><LibraryEditorPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/library/submit" element={<Lazy><ProtectedRoute><AppLayout><LibraryEditorPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/library/:id" element={<Lazy><ProtectedRoute><AppLayout><LibraryDetailPage /></AppLayout></ProtectedRoute></Lazy>} />
        <Route path="/library/:id/edit" element={<Lazy><ProtectedRoute><AppLayout><LibraryEditorPage /></AppLayout></ProtectedRoute></Lazy>} />

        {/* 个人主页 */}
        <Route path="/user/:username" element={<Lazy><ProtectedRoute><AppLayout><UserProfilePage /></AppLayout></ProtectedRoute></Lazy>} />

        {/* 管理后台 */}
        <Route path="/admin" element={<Lazy><ProtectedRoute adminOnly><AdminPage /></ProtectedRoute></Lazy>} />
        <Route path="/admin/theme" element={<Lazy><ProtectedRoute adminOnly><AdminThemePage /></ProtectedRoute></Lazy>} />
        <Route path="/admin/exam" element={<Lazy><ProtectedRoute adminOnly><AdminExamPage /></ProtectedRoute></Lazy>} />
        <Route path="/admin/announcements" element={<Lazy><ProtectedRoute adminOnly><AdminAnnouncePage /></ProtectedRoute></Lazy>} />
        <Route path="/admin/invites" element={<Lazy><ProtectedRoute adminOnly><AdminInvitesPage /></ProtectedRoute></Lazy>} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </SitePassGate>
    </>
  )
}
