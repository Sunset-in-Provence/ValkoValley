/**
 * 个人主页头部 — 头像 + 昵称 + 简介 + 入站日期徽章
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-full, shadow-card, font-display, border-border
 */
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { User, Calendar, Award, Edit3, Mail } from 'lucide-react'

export default function ProfileHeader({ profile, isOwn }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const daysSinceExam = profile?.exam_passed_at
    ? Math.floor((Date.now() - new Date(profile.exam_passed_at).getTime()) / (1000 * 60 * 60 * 24))
    : null

  return (
    <div className="bg-surface rounded-card shadow-card p-6">
      <div className="flex flex-col sm:flex-row items-start gap-5">
        {/* 头像 */}
        <div className="shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.display_name}
              className="w-20 h-20 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-hover flex items-center justify-center border-2 border-border">
              <User size={36} className="text-muted" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* 昵称 + 编辑按钮 */}
          <div className="flex items-center gap-2 mb-1">
            <h1 className="font-display text-accent text-xl truncate">
              {profile?.display_name || profile?.username || '未知用户'}
            </h1>
            {isOwn && (
              <Link to="?edit=true" className="text-muted hover:text-accent transition-colors shrink-0">
                <Edit3 size={14} />
              </Link>
            )}
            {user && !isOwn && (
              <button onClick={() => navigate(`/messages?to=${profile.id}`)}
                  className="text-accent hover:text-accent/80 transition-colors shrink-0 flex items-center gap-1 text-xs">
                  <Mail size={14} /> 私信
                </button>
            )}
          </div>

          {/* 简介 */}
          {profile?.bio ? (
            <p className="text-secondary text-sm leading-relaxed mb-3">{profile.bio}</p>
          ) : (
            <p className="text-muted text-sm italic mb-3">
              {isOwn ? '还没有简介，点击编辑添加吧 ✏️' : '该用户暂无简介'}
            </p>
          )}

          {/* 徽章行 */}
          <div className="flex flex-wrap gap-2">
            {/* 入站时间徽章 */}
            {daysSinceExam !== null && (
              <span className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-2 py-1 rounded-full"
                title={`入站考试通过于 ${new Date(profile.exam_passed_at).toLocaleDateString('zh-CN')}`}>
                <Award size={12} />
                已加入 {daysSinceExam} 天
              </span>
            )}
            <span className="inline-flex items-center gap-1 bg-hover text-muted text-xs px-2 py-1 rounded-full">
              <Calendar size={12} />
              {new Date(profile.created_at).toLocaleDateString('zh-CN')} 加入
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
