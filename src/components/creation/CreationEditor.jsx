/**
 * 创作编辑器 — 新建/编辑创作
 * UI 变量映射：bg-surface, bg-hover, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, shadow-card, border-border, font-display
 */
import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import MarkdownPreview from '@/components/discussion/MarkdownPreview'
import TagSelector from './TagSelector'
import MediaUploader from './MediaUploader'
import VideoEmbed from './VideoEmbed'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import toast from 'react-hot-toast'

export default function CreationEditor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [rating, setRating] = useState('')
  const [type, setType] = useState('')
  const [customTags, setCustomTags] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [videoUrls, setVideoUrls] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [loadingData, setLoadingData] = useState(isEditing)

  // 编辑模式：加载已有创作
  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase
        .from('creations')
        .select('*')
        .eq('id', id).eq('author_id', user.id).single()
      if (data) {
        setTitle(data.title)
        setContent(data.content)
        setRating(data.rating)
        setImageUrls(data.image_urls || [])
        setVideoUrls(data.video_urls || [])
        const fullTags = data.tags || []
        const typeTag = fullTags.find((t) => ['原创', '二创'].includes(t))
        if (typeTag) { setType(typeTag) }
        setCustomTags(fullTags.filter((t) => !['原创', '二创'].includes(t)))
      } else {
        toast.error('创作不存在或无权限编辑')
        navigate('/creation')
      }
      setLoadingData(false)
    }
    load()
  }, [id, user.id, navigate])

  async function handleSubmit() {
    if (!title.trim()) { toast.error('请填写标题'); return }
    if (!content.trim()) { toast.error('请填写正文'); return }
    if (!rating) { toast.error('请选择年龄分级'); return }
    if (!type) { toast.error('请选择原创或二创'); return }

    const allTags = [type, ...customTags]

    setSubmitting(true)
    const payload = {
      author_id: user.id, title: title.trim(), content,
      rating, tags: allTags, image_urls: imageUrls, video_urls: videoUrls,
    }

    if (isEditing) {
      const { error } = await supabase.from('creations').update({
        ...payload, updated_at: new Date().toISOString(),
      }).eq('id', id).eq('author_id', user.id)
      if (error) { toast.error('更新失败: ' + error.message) }
      else { toast.success('创作已更新'); navigate(`/creation/${id}`) }
    } else {
      const { data, error } = await supabase.from('creations').insert(payload).select('id').single()
      if (error) { toast.error('发布失败: ' + error.message) }
      else { toast.success('创作发布成功！'); navigate(`/creation/${data.id}`) }
    }
    setSubmitting(false)
  }

  if (loadingData) {
    return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="bg-surface rounded-card shadow-card p-6 space-y-5">
      <h1 className="font-display text-accent text-xl">{isEditing ? '编辑创作' : '发布创作'}</h1>

      {/* 标题 */}
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder="创作标题" maxLength={200}
        className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm placeholder:text-muted focus:outline-none focus:border-accent" />

      {/* 正文 */}
      <MarkdownPreview content={content} onChange={setContent} rows={14} />

      {/* 标签 */}
      <TagSelector
        rating={rating} onRatingChange={setRating}
        type={type} onTypeChange={setType}
        customTags={customTags} onCustomTagsChange={setCustomTags}
      />

      {/* 图片上传 */}
      <div>
        <label className="text-secondary text-sm font-medium mb-2 block">附图</label>
        <MediaUploader images={imageUrls} onImagesChange={setImageUrls} />
      </div>

      {/* 视频链接 */}
      <div>
        <label className="text-secondary text-sm font-medium mb-2 block">视频链接</label>
        <VideoEmbed urls={videoUrls} onUrlsChange={setVideoUrls} editable />
      </div>

      {/* 操作 */}
      <div className="flex items-center gap-3 pt-2 border-t border-border">
        <button onClick={handleSubmit} disabled={submitting}
          className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-50">
          {submitting ? '发布中...' : (isEditing ? '保存修改' : '发布创作')}
        </button>
        <button type="button" onClick={() => navigate(-1)}
          className="border border-border text-secondary px-6 py-2.5 rounded-button text-sm hover:bg-hover">
          取消
        </button>
      </div>
    </div>
  )
}
