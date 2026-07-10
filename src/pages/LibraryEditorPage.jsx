/**
 * 档案馆 — 添加/编辑条目（管理员） 或 用户投稿
 * UI 变量映射：bg-surface, text-primary, text-secondary, text-muted, text-accent,
 *   rounded-card, rounded-button, rounded-input, shadow-card, font-display
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { uploadImage, uploadVideo, uploadAudio } from '@/lib/upload'
import { loadBannedWords, checkBannedWords } from '@/lib/bannedWords'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/shared/LoadingSpinner'
import { ArrowLeft, Upload, X, Loader2, Video, Music, FileText } from 'lucide-react'

const CATEGORY_GROUPS = [
  {
    label: '设定',
    items: [
      { key: 'lore_official', label: '官方设定' },
      { key: 'lore_rumor', label: '坊间传闻' },
    ],
  },
  {
    label: '图鉴',
    items: [
      { key: 'gallery_promo', label: '宣图' },
      { key: 'gallery_card', label: '卡面' },
      { key: 'gallery_text', label: '文案' },
    ],
  },
  {
    label: '视频',
    items: [
      { key: 'video_pv', label: '个人PV' },
      { key: 'video_story', label: '卡面剧情' },
      { key: 'video_other', label: '其它' },
    ],
  },
  {
    label: '音乐',
    items: [
      { key: 'music_official', label: '官方' },
      { key: 'music_fan', label: '同人' },
    ],
  },
]

export default function LibraryEditorPage() {
  const { user, isAdmin } = useAuth()
  const navigate = useNavigate()
  const { id } = useParams()
  const isEditing = !!id
  const [loadingData, setLoadingData] = useState(isEditing)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('character')
  const [coverUrl, setCoverUrl] = useState('')
  const [coverUploading, setCoverUploading] = useState(false)
  const [imageUrls, setImageUrls] = useState([])
  const [imageUploading, setImageUploading] = useState(false)
  const [videoUrls, setVideoUrls] = useState([])
  const [videoInput, setVideoInput] = useState('')
  const [videoUploading, setVideoUploading] = useState(false)
  const [audioUrls, setAudioUrls] = useState([])
  const [audioUploading, setAudioUploading] = useState(false)
  const [lyrics, setLyrics] = useState('')
  const [tags, setTags] = useState([])
  const [tagInput, setTagInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // 编辑模式：加载已有数据
  useEffect(() => {
    if (!id) return
    async function load() {
      const { data } = await supabase.from('library_entries').select('*').eq('id', id).single()
      if (data) {
        setTitle(data.title); setContent(data.content); setCategory(data.category)
        setCoverUrl(data.cover_url || ''); setImageUrls(data.image_urls || [])
        setVideoUrls(data.video_urls || []); setAudioUrls(data.audio_urls || [])
        setLyrics(data.lyrics || ''); setTags(data.tags || [])
      } else { toast.error('条目不存在'); navigate('/library') }
      setLoadingData(false)
    }
    load()
  }, [id, navigate])

  // 封面上传
  async function handleCoverUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverUploading(true)
    const { url, error } = await uploadImage(file, 'images')
    if (error) { toast.error(error.message) } else { setCoverUrl(url) }
    setCoverUploading(false)
  }

  // 附图上传
  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImageUploading(true)
    for (const file of files) {
      const { url, error } = await uploadImage(file, 'images')
      if (error) { toast.error(error.message) } else { setImageUrls((prev) => [...prev, url]) }
    }
    setImageUploading(false)
  }

  function addVideoUrl() {
    if (!videoInput.trim()) return
    setVideoUrls((prev) => [...prev, videoInput.trim()])
    setVideoInput('')
  }

  async function handleVideoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setVideoUploading(true)
    const { url, error } = await uploadVideo(file)
    if (error) { toast.error('视频上传失败: ' + error.message) }
    else { setVideoUrls((prev) => [...prev, url]) }
    setVideoUploading(false)
  }

  async function handleAudioUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setAudioUploading(true)
    const { url, error } = await uploadAudio(file)
    if (error) { toast.error('音频上传失败: ' + error.message) }
    else { setAudioUrls((prev) => [...prev, url]) }
    setAudioUploading(false)
  }

  function addTag() {
    const tag = tagInput.trim()
    if (!tag || tags.includes(tag)) return
    setTags((prev) => [...prev, tag])
    setTagInput('')
  }

  async function handleSubmit(status) {
    const finalStatus = status || (isAdmin ? 'published' : 'pending_review')
    if (!title) { toast.error('请填写标题'); return }
    const words = await loadBannedWords(supabase)
    const hits = checkBannedWords(title + ' ' + content, words)
    if (hits.length > 0) { toast.error(`内容包含违规词：${hits.slice(0, 3).join('、')}`); return }
    setSubmitting(true)

    if (isEditing) {
      const { error } = await supabase.rpc('update_library_entry', {
        _id: id, _title: title, _content: content, _category: category,
        _cover_url: coverUrl || null, _image_urls: imageUrls,
        _video_urls: videoUrls, _audio_urls: audioUrls,
        _lyrics: lyrics || null, _tags: tags, _status: finalStatus,
      })
      setSubmitting(false)
      if (error) { toast.error('更新失败: ' + error.message) }
      else { toast.success('条目已更新'); navigate(`/library/${id}`) }
    } else {
      const { error } = await supabase.rpc('insert_library_entry', {
        _title: title, _content: content, _category: category,
        _cover_url: coverUrl || null, _image_urls: imageUrls,
        _video_urls: videoUrls, _audio_urls: audioUrls,
        _lyrics: lyrics || null, _tags: tags, _status: finalStatus,
      })
      setSubmitting(false)
      if (error) {
        toast.error('发布失败: ' + error.message)
      } else {
        toast.success(finalStatus === 'published' ? '条目已发布！' : '投稿已提交，等待管理员审核')
        navigate('/library')
      }
    }
  }

  if (loadingData) return <div className="flex justify-center py-24"><LoadingSpinner size="lg" /></div>

  return (
    <div>
      <Link to="/library" className="flex items-center gap-1 text-muted text-sm mb-6 no-underline hover:text-accent">
        <ArrowLeft size={14} /> 返回档案馆
      </Link>

      <div className="bg-surface rounded-card shadow-card p-6 md:p-8">
        <h1 className="font-display text-accent text-2xl mb-6">
          {isEditing ? '编辑条目' : (isAdmin ? '添加条目' : '投稿')}
        </h1>

        {!isAdmin && (
          <div className="bg-info/10 border border-info/30 text-secondary text-sm rounded-card p-3 mb-6">
            💡 你的投稿将提交给管理员审核，审核通过后将在档案馆中展示。
          </div>
        )}

        {/* 标题 */}
        <div className="mb-4">
          <label className="text-secondary text-sm font-medium mb-1.5 block">标题 *</label>
          <input
            type="text" value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="条目标题" required maxLength={200}
            className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* 分类 */}
        <div className="mb-4">
          <label className="text-secondary text-sm font-medium mb-1.5 block">分类 *</label>
          <div className="grid grid-cols-3 gap-4">
            {CATEGORY_GROUPS.map((group) => (
              <div key={group.label} className="bg-hover rounded-card p-3">
                <p className="text-muted text-xs font-medium mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map((item) => (
                    <button key={item.key} type="button"
                      onClick={() => setCategory(item.key)}
                      className={`px-2.5 py-1 rounded-button text-xs transition-colors ${
                        category === item.key
                          ? 'bg-accent text-text-inverse'
                          : 'bg-surface text-secondary border border-border hover:border-accent'
                      }`}
                    >{item.label}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 封面 */}
        <div className="mb-4">
          <label className="text-secondary text-sm font-medium mb-1.5 block">封面图</label>
          {coverUrl ? (
            <div className="relative inline-block">
              <img src={coverUrl} alt="封面" className="w-32 h-20 object-cover rounded-card" />
              <button onClick={() => setCoverUrl('')}
                className="absolute -top-1.5 -right-1.5 bg-danger text-text-inverse rounded-full w-5 h-5 flex items-center justify-center">
                <X size={12} />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center w-32 h-20 border-2 border-dashed border-border rounded-card cursor-pointer hover:border-accent transition-colors">
              <input type="file" accept="image/*" onChange={handleCoverUpload} hidden />
              {coverUploading ? <span className="text-muted text-xs">上传中...</span> : <Upload size={20} className="text-muted" />}
            </label>
          )}
        </div>

        {/* 正文 */}
        <div className="mb-4">
          <label className="text-secondary text-sm font-medium mb-1.5 block">正文（Markdown）</label>
          <textarea
            value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="支持 Markdown 格式..." rows={12} required
            className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm focus:outline-none focus:border-accent resize-vertical"
          />
        </div>

        {/* 附图 */}
        <div className="mb-4">
          <label className="text-secondary text-sm font-medium mb-1.5 block">附图</label>
          <label className="flex items-center gap-2 text-muted text-sm cursor-pointer hover:text-accent">
            <Upload size={16} />
            {imageUploading ? '上传中...' : '上传图片'}
            <input type="file" accept="image/*" multiple onChange={handleImageUpload} hidden />
          </label>
          {imageUrls.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {imageUrls.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="w-16 h-16 object-cover rounded-card" />
                  <button onClick={() => setImageUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-danger text-text-inverse rounded-full w-4 h-4 flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 视频 */}
        <div className="mb-4">
          <label className="text-secondary text-sm font-medium mb-1.5 block">视频（链接或本地上传）</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text" value={videoInput} onChange={(e) => setVideoInput(e.target.value)}
              placeholder="粘贴 B站 / YouTube 视频链接"
              className="flex-1 bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm focus:outline-none focus:border-accent"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addVideoUrl() } }}
            />
            <button onClick={addVideoUrl} type="button"
              className="bg-hover border border-border text-secondary px-4 py-2 rounded-button text-sm hover:bg-accent hover:text-text-inverse">
              添加
            </button>
            <label className="flex items-center gap-1 bg-hover border border-border text-secondary px-4 py-2 rounded-button text-sm cursor-pointer hover:bg-accent hover:text-text-inverse">
              {videoUploading ? <Loader2 size={14} className="animate-spin" /> : <Video size={14} />}
              {videoUploading ? '上传中' : '本地上传'}
              <input type="file" accept="video/mp4,video/webm" onChange={handleVideoUpload} hidden />
            </label>
          </div>
          {videoUrls.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {videoUrls.map((url, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted bg-hover rounded-input px-3 py-1.5">
                  <span className="truncate">{url}</span>
                  <button onClick={() => setVideoUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="text-danger hover:underline ml-2 shrink-0">删除</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 音频上传 */}
        <div className="mb-4">
          <label className="text-secondary text-sm font-medium mb-1.5 block">音频（OST/音乐）</label>
          <div className="flex gap-2 mb-2">
            <label className="flex items-center gap-1 bg-hover border border-border text-secondary px-4 py-2 rounded-button text-sm cursor-pointer hover:bg-accent hover:text-text-inverse">
              {audioUploading ? <Loader2 size={14} className="animate-spin" /> : <Music size={14} />}
              {audioUploading ? '上传中' : '上传音频'}
              <input type="file" accept="audio/mpeg,audio/mp3,audio/wav,audio/ogg,audio/flac" onChange={handleAudioUpload} hidden />
            </label>
          </div>
          {audioUrls.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {audioUrls.map((url, i) => (
                <div key={i} className="flex items-center justify-between text-xs text-muted bg-hover rounded-input px-3 py-1.5">
                  <span className="truncate">{url.split('/').pop()}</span>
                  <button onClick={() => setAudioUrls((prev) => prev.filter((_, j) => j !== i))}
                    className="text-danger hover:underline ml-2 shrink-0">删除</button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 歌词（音乐分类时显示） */}
        {category.startsWith('music_') && (
          <div className="mb-4">
            <label className="text-secondary text-sm font-medium mb-1.5 flex items-center gap-1">
              <FileText size={14} /> 滚动歌词
            </label>
            <textarea value={lyrics} onChange={(e) => setLyrics(e.target.value)}
              rows={6} placeholder={`[00:12.34]第一行歌词&#10;[00:15.67]第二行歌词&#10;或者直接粘贴纯文本歌词`}
              className="w-full bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm resize-none focus:outline-none focus:border-accent font-mono" />
            <p className="text-muted text-xs mt-1">支持 LRC 格式（[分:秒.毫秒]歌词），也支持纯文本</p>
          </div>
        )}

        {/* 标签 */}
        <div className="mb-6">
          <label className="text-secondary text-sm font-medium mb-1.5 block">标签</label>
          <div className="flex gap-2">
            <input
              type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              placeholder="输入标签后回车添加"
              className="flex-1 bg-hover border border-border rounded-input px-4 py-2.5 text-primary text-sm focus:outline-none focus:border-accent"
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
            />
            <button onClick={addTag} type="button"
              className="bg-hover border border-border text-secondary px-4 py-2 rounded-button text-sm hover:bg-accent hover:text-text-inverse">
              添加
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">
                  {tag}
                  <button onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 提交按钮 */}
        <div className="flex gap-3">
          {isAdmin ? (
            <>
              <button onClick={() => handleSubmit('published')} disabled={submitting}
                className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-50">
                {submitting ? '发布中...' : '发布'}
              </button>
              <button onClick={() => handleSubmit('draft')} disabled={submitting}
                className="border border-border text-secondary px-6 py-2.5 rounded-button text-sm hover:bg-hover">
                保存草稿
              </button>
            </>
          ) : (
            <button onClick={() => handleSubmit('pending_review')} disabled={submitting}
              className="bg-accent text-text-inverse px-6 py-2.5 rounded-button font-medium text-sm hover:opacity-90 disabled:opacity-50">
              {submitting ? '提交中...' : '提交投稿'}
            </button>
          )}
          <Link to="/library"
            className="border border-border text-secondary px-6 py-2.5 rounded-button text-sm no-underline hover:bg-hover inline-flex items-center">
            取消
          </Link>
        </div>
      </div>
    </div>
  )
}
