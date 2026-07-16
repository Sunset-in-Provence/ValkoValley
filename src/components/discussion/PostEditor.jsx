/**
 * 帖子编辑器 — 新建/编辑帖子
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, shadow-card, border-border, font-display
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import MarkdownPreview from './MarkdownPreview'
import MediaUploader from '@/components/creation/MediaUploader'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { loadBannedWords, checkBannedWords } from '@/lib/bannedWords'
import { EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

export default function PostEditor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [imageUrls, setImageUrls] = useState([])
  const [wasHidden, setWasHidden] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loadingPost, setLoadingPost] = useState(isEditing)

  // 编辑模式：加载已有帖子
  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase
        .from('posts')
        .select('*')
        .eq('id', id)
        .eq('author_id', user.id)
        .single()
      if (data) {
        setTitle(data.title)
        setContent(data.content)
        setImageUrls(data.image_urls || [])
        if (data.hidden) setWasHidden(true)
      } else {
        toast.error('帖子不存在或无权限编辑')
        navigate('/discussion')
      }
      setLoadingPost(false)
    }
    load()
  }, [id, user.id, navigate])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { toast.error('请填写标题'); return }
    if (!content.trim()) { toast.error('请填写内容'); return }

    const words = await loadBannedWords(supabase)
    const hits = checkBannedWords(title + ' ' + content, words)
    if (hits.length > 0) { toast.error(`内容包含违规词：${hits.slice(0, 3).join('、')}`); return }

    setSubmitting(true)

    if (isEditing) {
      const updateData = { title: title.trim(), content, image_urls: imageUrls, updated_at: new Date().toISOString() }
      // 被隐藏的帖子编辑后标记为待审核
      if (wasHidden) updateData.pending_review = true

      const { error } = await supabase
        .from('posts')
        .update(updateData)
        .eq('id', id)
        .eq('author_id', user.id)

      if (error) { toast.error('更新失败: ' + error.message) }
      else {
        if (wasHidden) {
          toast.success('修改已提交审核，请等待管理员处理')
          supabase.rpc('notify_admins', {
            _title: '隐藏帖待审核',
            _content: `用户编辑了被隐藏的帖子「${title.trim()}」，请前往审核`,
            _link: `/discussion/${id}`,
          }).then()
        } else {
          toast.success('帖子已更新')
        }
        navigate(`/discussion/${id}`)
      }
    } else {
      const { data, error } = await supabase
        .from('posts')
        .insert({ author_id: user.id, title: title.trim(), content, image_urls: imageUrls, category: window.location.pathname.includes('recommend') ? 'recommend' : 'discussion' })
        .select('id')
        .single()

      if (error) { toast.error('发布失败: ' + error.message) }
      else {
        toast.success('帖子发布成功！')
        supabase.rpc('add_contribution', { _user_id: user.id, _action: '发帖', _points: 10 }).then()
        navigate(`/discussion/${data.id}`)
      }
    }

    setSubmitting(false)
  }

  if (loadingPost) {
    return (
      <div className="flex justify-center py-16">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="bg-surface rounded-card shadow-card p-6 space-y-4">
      <h1 className="font-display text-accent text-xl">
        {isEditing ? '编辑帖子' : '发起讨论'}
      </h1>

      {/* 隐藏帖提示 */}
      {wasHidden && (
        <div className="bg-warning/10 border border-warning/30 rounded-card p-3 text-warning text-xs flex items-start gap-2">
          <EyeOff size={14} className="shrink-0 mt-0.5" />
          <span>此帖已被管理员隐藏。编辑并保存后，修改将提交审核，由管理员决定是否解除隐藏。</span>
        </div>
      )}

      {/* 标题 */}
      <input
        type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="帖子标题" required maxLength={200}
        className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent"
      />

      {/* Markdown 编辑器 */}
      <MarkdownPreview content={content} onChange={setContent} rows={12} />

      {/* 附图 */}
      <MediaUploader images={imageUrls} onImagesChange={setImageUrls} />

      {/* 操作按钮 */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit" disabled={submitting}
          className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? '发布中...' : (isEditing ? '保存修改' : '发布帖子')}
        </button>
        <button
          type="button" onClick={() => navigate(-1)}
          className="border border-border text-secondary px-6 py-2.5 rounded-button text-sm hover:bg-hover"
        >
          取消
        </button>
      </div>
    </form>
  )
}
