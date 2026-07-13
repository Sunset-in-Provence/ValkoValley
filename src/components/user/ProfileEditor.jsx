/**
 * 个人资料编辑器 — 头像上传 + 昵称 + 简介
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, rounded-full, shadow-card, border-border, font-display
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { uploadImage } from '@/lib/upload'
import toast from 'react-hot-toast'
import { Upload, User, Loader2 } from 'lucide-react'

export default function ProfileEditor({ profile, onClose }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(profile?.display_name || profile?.username || '')
  const [bio, setBio] = useState(profile?.bio || '')
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  async function handleAvatarUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarUploading(true)
    const { url, error } = await uploadImage(file, 'images')
    if (error) { toast.error('头像上传失败: ' + error.message) }
    else { setAvatarUrl(url) }
    setAvatarUploading(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!displayName.trim()) { toast.error('昵称不能为空'); return }
    setSaving(true)
    const { error } = await supabase.from('profiles').update({
      display_name: displayName.trim(),
      bio: bio.trim(),
      avatar_url: avatarUrl,
    }).eq('id', user.id)

    if (error) { toast.error('保存失败: ' + error.message) }
    else { toast.success('资料已更新'); onClose(); navigate(window.location.pathname) }
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
