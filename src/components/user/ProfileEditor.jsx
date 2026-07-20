/**
 * 个人资料编辑器 — 头像上传 + 昵称 + 简介
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, rounded-full, shadow-card, border-border, font-display
 */
import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { uploadImage } from '@/lib/upload'
import AvatarCropper from '@/components/shared/AvatarCropper'
import toast from 'react-hot-toast'
import { Upload, User, Loader2 } from 'lucide-react'

export default function ProfileEditor({ profile, onClose }) {
  const { user, refreshProfile } = useAuth()

  const [displayName, setDisplayName] = useState(profile?.display_name || profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [hideAi, setHideAi] = useState(profile?.hide_ai || false)
  const [bookmarksPublic, setBookmarksPublic] = useState(profile?.bookmarks_public || false)
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [cropFile, setCropFile] = useState(null)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setCropFile(file)
  }

  async function handleCropped(file) {
    setCropFile(null)
    setAvatarUploading(true)
    const { url, error } = await uploadImage(file, 'images')
    if (error) { toast.error('头像上传失败: ' + error.message) }
    else { setAvatarUrl(url) }
    setAvatarUploading(false)
  }

  if (cropFile) return <AvatarCropper file={cropFile} onCrop={handleCropped} onCancel={() => setCropFile(null)} />

  async function handleSave(e) {
    e.preventDefault()
    if (!displayName.trim()) { toast.error('昵称不能为空'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
      hide_ai: hideAi,
      bookmarks_public: bookmarksPublic,
    }).eq('id', user.id)

    if (error) { toast.error('保存失败: ' + error.message) }
    else {
      toast.success('资料已更新')
      if (refreshProfile) refreshProfile()
      onClose()
    }
    setSaving(false)
  }

  return (
    <form onSubmit={handleSave} className="bg-surface rounded-card shadow-card p-6 space-y-4">
      <h2 className="font-display text-accent text-lg">编辑资料</h2>

      {/* 头像 */}
      <div className="flex items-center gap-4">
        <div className="shrink-0 relative group">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-border" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-hover flex items-center justify-center border-2 border-border">
              <User size={28} className="text-muted" />
            </div>
          )}
        </div>
        <label className="flex items-center gap-1.5 text-muted text-sm cursor-pointer hover:text-accent">
          <input type="file" accept="image/*" onChange={handleAvatarUpload} hidden />
          {avatarUploading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Upload size={16} />
          )}
          {avatarUploading ? '上传中...' : '更换头像'}
        </label>
      </div>

      {/* 昵称 */}
      <div>
        <label className="text-secondary text-sm font-medium mb-1 block">昵称</label>
        <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50} className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm focus:outline-none focus:border-accent" />
      </div>

      {/* 简介 */}
      <div>
        <label className="text-secondary text-sm font-medium mb-1 block">简介</label>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)}
          rows={4} maxLength={500} placeholder="介绍一下自己..."
          className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm resize-none focus:outline-none focus:border-accent" />
        <p className="text-muted text-xs mt-1">{bio.length}/500</p>
      </div>

      {/* 屏蔽 AI 内容 */}
      <div className="flex items-center justify-between bg-hover rounded-card p-3">
        <div>
          <p className="text-secondary text-sm font-medium">屏蔽 AI 生成内容</p>
          <p className="text-muted text-xs">开启后创作区将不显示 AI 标签的作品</p>
        </div>
        <button type="button" onClick={() => setHideAi(!hideAi)}
          className={`relative w-10 h-6 rounded-full transition-colors ${hideAi ? 'bg-accent' : 'bg-border'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${hideAi ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {/* 收藏夹公开 */}
      <div className="flex items-center justify-between bg-hover rounded-card p-3">
        <div>
          <p className="text-secondary text-sm font-medium">公开收藏夹</p>
          <p className="text-muted text-xs">开启后他人可以查看你的收藏内容</p>
        </div>
        <button type="button" onClick={() => setBookmarksPublic(!bookmarksPublic)}
          className={`relative w-10 h-6 rounded-full transition-colors ${bookmarksPublic ? 'bg-accent' : 'bg-border'}`}>
          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${bookmarksPublic ? 'translate-x-4' : ''}`} />
        </button>
      </div>

      {/* 按钮 */}
      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="bg-accent text-text-inverse px-6 py-2 rounded-button text-sm font-medium hover:opacity-90 disabled:opacity-50">
          {saving ? '保存中...' : '保存'}
        </button>
        <button type="button" onClick={onClose}
          className="border border-border text-secondary px-6 py-2 rounded-button text-sm hover:bg-hover">
          取消
        </button>
      </div>
    </form>
  )
}
