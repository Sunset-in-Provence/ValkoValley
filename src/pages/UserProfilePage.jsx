/**
 * 个人主页 — 用户资料 + 帖子/创作 Tab
 * URL: /user/:username
 * Query: ?edit=true → 打开编辑面板
 *
 * UI 变量映射：bg-primary, bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-full, shadow-card, font-display, font-body, border-border
 */
import { useState, useEffect } from 'react'
import { useParams, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import ProfileHeader from '@/components/user/ProfileHeader'
import ProfileEditor from '@/components/user/ProfileEditor'
import UserPostsTab from '@/components/user/UserPostsTab'
import UserCreationsTab from '@/components/user/UserCreationsTab'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import EmptyState from '@/components/shared/EmptyState'
import { ArrowLeft, MessageSquare, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { key: 'posts', label: '讨论帖', icon: MessageSquare },
  { key: 'creations', label: '创作', icon: Palette },
]

export default function UserProfilePage() {
  const { username } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user } = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')

  const isOwn = user?.id === profile?.id
  const isEditing = searchParams.get('edit') === 'true' && isOwn

  useEffect(() => {
    async function fetch() {
      setLoading(true)
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single()

      if (!data) {
        setNotFound(true)
      } else {
        setProfile(data)
      }
      setLoading(false)
    }
    fetch()
  }, [username])

  if (loading) {
    return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>
  }

  if (notFound) {
    return (
      <div>
        <Link to="/discussion" className="flex items-center gap-1 text-muted text-sm mb-6 no-underline hover:text-accent">
          <ArrowLeft size={14} /> 返回
        </Link>
        <EmptyState title="用户不存在" description={`未找到用户 @${username}`} />
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Link to="/discussion" className="flex items-center gap-1 text-muted text-sm no-underline hover:text-accent">
          <ArrowLeft size={14} /> 返回
        </Link>
        {searchParams.get('from') === 'admin' && (
          <Link to="/admin" className="flex items-center gap-1 text-accent text-sm no-underline hover:underline">
            返回管理后台
          </Link>
        )}
      </div>

      {/* 编辑模式 */}
      {isEditing ? (
        <ProfileEditor
          profile={profile}
          onClose={() => setSearchParams({})}
        />
      ) : (
        <ProfileHeader profile={profile} isOwn={isOwn} />
      )}

      {/* Tab 切换 */}
      <div className="flex items-center gap-1 mt-6 mb-4 border-b border-border pb-2">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 text-sm rounded-t-card transition-colors',
              activeTab === key
                ? 'text-accent border-b-2 border-accent -mb-[2px] font-medium'
                : 'text-muted hover:text-secondary'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* Tab 内容 */}
      {activeTab === 'posts' && <UserPostsTab userId={profile.id} />}
      {activeTab === 'creations' && <UserCreationsTab userId={profile.id} />}
    </div>
  )
}
