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
import { loadBannedWords, checkBannedWords } from '@/lib/bannedWords'
import { uploadVideo, uploadImage } from '@/lib/upload'
import { Loader2, Video, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

// 生成文字封面
async function generateTextCover(title, content) {
  const canvas = document.createElement('canvas')
  canvas.width = 800; canvas.height = 450
  const ctx = canvas.getContext('2d')
  // 渐变背景
  const grad = ctx.createLinearGradient(0, 0, 800, 450)
  grad.addColorStop(0, '#5DAF7C'); grad.addColorStop(1, '#2D5A3A')
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 800, 450)
  // 标题
  ctx.fillStyle = '#fff'; ctx.font = 'bold 36px serif'
  ctx.fillText(title.slice(0, 20), 40, 140)
  // 正文预览
  ctx.font = '18px serif'; ctx.fillStyle = 'rgba(255,255,255,0.8)'
  const lines = content.replace(/\s+/g, ' ').slice(0, 200).match(/.{1,35}/g) || []
  lines.slice(0, 6).forEach((line, i) => ctx.fillText(line, 40, 200 + i * 30))
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) { resolve(null); return }
      const file = new File([blob], 'cover.png', { type: 'image/png' })
      uploadImage(file, 'images').then(({ url }) => resolve(url || null))
    }, 'image/png')
  })
}

// 视频帧截取
function captureVideoFrames(file, count = 4) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.preload = 'metadata'; video.muted = true; video.crossOrigin = 'anonymous'
    video.style.position = 'fixed'; video.style.top = '-9999px'
    document.body.appendChild(video)
    const url = URL.createObjectURL(file)
    video.src = url
    video.onloadedmetadata = () => {
      const duration = video.duration
      const frames = []
      let loaded = 0
      for (let i = 0; i < count; i++) {
        const t = (i + 1) / (count + 1) * Math.min(duration, 10)
        setTimeout(() => {
          video.currentTime = t
        }, i * 2000)
      }
      video.onseeked = () => {
        const c = document.createElement('canvas')
        c.width = 320; c.height = 180
        c.getContext('2d').drawImage(video, 0, 0, 320, 180)
        c.toBlob((blob) => {
          if (blob) frames.push(URL.createObjectURL(blob))
          loaded++
          if (loaded >= count) {
            URL.revokeObjectURL(url)
            document.body.removeChild(video)
            resolve(frames)
          }
        }, 'image/jpeg', 0.7)
      }
    }
    video.onerror = () => { URL.revokeObjectURL(url); document.body.removeChild(video); resolve([]) }
    setTimeout(() => { if (frames.length === 0) { URL.revokeObjectURL(url); document.body.removeChild(video); resolve([]) } }, 15000)
  })
}

export default function CreationEditor() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentType, setContentType] = useState('')
  const [type, setType] = useState('')
  const [isAi, setIsAi] = useState(null) // null = 未选择, true = AI, false = 非AI
  const [customTags, setCustomTags] = useState([])
  const [imageUrls, setImageUrls] = useState([])
  const [videoUrls, setVideoUrls] = useState([])
  const [videoUploading, setVideoUploading] = useState(false)
  const [videoFrames, setVideoFrames] = useState([])
  const [selectedFrame, setSelectedFrame] = useState(null)
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
        setContentType(data.content_type || '')
        setIsAi(data.is_ai || false)
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

  async function handleVideoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setVideoUploading(true)
    const { url, error } = await uploadVideo(file)
    if (error) toast.error('视频上传失败: ' + error.message)
    else {
      setVideoUrls((prev) => [...prev, url])
      if (contentType === 'video') {
        const frames = await captureVideoFrames(file)
        setVideoFrames(frames)
      }
    }
    setVideoUploading(false)
  }

  async function handleSubmit() {
    if (!title.trim()) { toast.error('请填写标题'); return }
    if (!contentType) { toast.error('请选择内容类型'); return }
    if (!type) { toast.error('请选择原创或二创'); return }
    if (isAi === null) { toast.error('请选择是否 AI 生成'); return }

    const words = await loadBannedWords(supabase)
    const hits = checkBannedWords(title + ' ' + content, words)
    if (hits.length > 0) { toast.error(`内容包含违规词：${hits.slice(0, 3).join('、')}`); return }

    const allTags = [type, ...customTags]

    setSubmitting(true)

    // 纯文字创作无图时自动生成文字封面
    let finalImageUrls = imageUrls
    if (contentType === 'text' && imageUrls.length === 0 && content.trim()) {
      const coverUrl = await generateTextCover(title.trim(), content.trim())
      if (coverUrl) finalImageUrls = [coverUrl]
    }

    const payload = {
      author_id: user.id, title: title.trim(), content,
      content_type: contentType, tags: allTags, is_ai: isAi, image_urls: finalImageUrls, video_urls: videoUrls,
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
        rating={contentType} onRatingChange={setContentType}
        type={type} onTypeChange={setType}
        customTags={customTags} onCustomTagsChange={setCustomTags}
      />

      {/* AI 标记 */}
      <div>
        <label className="text-secondary text-sm font-medium mb-2 block">
          AI 标记 <span className="text-danger">*</span>
          <span className="text-muted text-xs ml-1">是否使用 AI 生成/辅助创作</span>
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={() => setIsAi(false)}
            className={`flex-1 px-3 py-2 rounded-button text-xs text-center border transition-colors ${
              isAi === false ? 'bg-accent text-text-inverse border-accent' : 'bg-hover text-secondary border-border hover:border-accent'
            }`}>
            🖊️ 非 AI
          </button>
          <button type="button" onClick={() => setIsAi(true)}
            className={`flex-1 px-3 py-2 rounded-button text-xs text-center border transition-colors ${
              isAi ? 'bg-accent text-text-inverse border-accent' : 'bg-hover text-secondary border-border hover:border-accent'
            }`}>
            🤖 AI 生成
          </button>
        </div>
      </div>

      {/* 图片上传 */}
      <div>
        {contentType === 'video' && imageUrls.length === 0 && (
          <p className="text-warning text-xs mb-2">建议上传封面图，第一张图将作为视频封面展示</p>
        )}
        <MediaUploader images={imageUrls} onImagesChange={setImageUrls} />
      </div>

      {/* 视频 */}
      <div>
        <label className="text-secondary text-sm font-medium mb-2 block">视频链接</label>
        <VideoEmbed urls={videoUrls} onUrlsChange={setVideoUrls} editable />
        <div className="mt-2">
          <label className="flex items-center gap-1 bg-hover border border-border text-secondary px-4 py-2 rounded-button text-sm cursor-pointer hover:bg-accent hover:text-text-inverse w-fit">
            {videoUploading ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
            {videoUploading ? '上传中...' : '本地上传视频'}
            <input type="file" accept="video/mp4,video/webm,video/quicktime,video/x-msvideo" onChange={handleVideoUpload} hidden />
          </label>
          <span className="text-muted text-xs ml-2">最大 500MB</span>
        </div>
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
