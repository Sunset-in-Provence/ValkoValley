import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import { uploadImage } from '@/lib/upload'
import { loadBannedWords, checkBannedWords } from '@/lib/bannedWords'
import { Image, Loader2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function CommentForm({ postId = null, creationId = null, parentId = null, replyToId = null, depth = 0, onSuccess, onCancel }) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [images, setImages] = useState([])
  const [imgUploading, setImgUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setImgUploading(true)
    for (const file of files) {
      const { url, error } = await uploadImage(file, 'images')
      if (error) toast.error('上传失败')
      else setImages((prev) => [...prev, url])
    }
    setImgUploading(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!content.trim() && !images.length) return
    const words = await loadBannedWords(supabase)
    const hits = checkBannedWords(content, words)
    if (hits.length > 0) { toast.error(`包含违规词：${hits.slice(0, 3).join('、')}`); return }

    setSubmitting(true)
    const { error } = await supabase.from('comments').insert({
      post_id: postId, creation_id: creationId, parent_id: parentId,
      reply_to_id: replyToId, author_id: user.id, content: content.trim() || '', depth, image_urls: images,
    })

    setSubmitting(false)
    if (error) { toast.error('评论失败: ' + error.message) }
    else {
      toast.success(parentId ? '回复成功' : '评论成功')
      supabase.rpc('add_contribution', { _user_id: user.id, _action: '评论', _points: 10 }).then()
      setContent(''); setImages([])
      if (onSuccess) onSuccess()
      if (onCancel) onCancel()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea value={content} onChange={(e) => setContent(e.target.value)}
        placeholder={parentId ? '写下回复...' : '写下评论...'} rows={3}
        className="w-full bg-hover border border-border rounded-input px-3 py-2 text-primary text-sm resize-none focus:outline-none focus:border-accent" />

      {images.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {images.map((url, i) => (
            <div key={i} className="relative"><img src={url} alt="" className="w-12 h-12 object-cover rounded-card border border-border" />
              <button type="button" onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                className="absolute -top-1 -right-1 bg-danger text-text-inverse rounded-full w-4 h-4 flex items-center justify-center text-[10px]"><X size={10} /></button></div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-muted hover:text-accent cursor-pointer">
          <input type="file" accept="image/*" multiple onChange={handleImageUpload} hidden />
          {imgUploading ? <Loader2 size={14} className="animate-spin" /> : <Image size={14} />}
        </label>
        <button type="submit" disabled={submitting || (!content.trim() && !images.length)}
          className="bg-accent text-text-inverse px-4 py-1.5 rounded-button text-xs font-medium hover:opacity-90 disabled:opacity-40">
          {submitting ? '发送中...' : '发送'}
        </button>
        {onCancel && <button type="button" onClick={onCancel} className="text-muted text-xs hover:text-secondary">取消</button>}
      </div>
    </form>
  )
}
