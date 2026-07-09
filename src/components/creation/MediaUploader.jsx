/**
 * 媒体上传组件 — 图片上传到 Supabase Storage
 * UI 变量映射：bg-hover, text-muted, text-secondary, text-danger,
 *   rounded-card, rounded-button, border-border
 */
import { useState } from 'react'
import { uploadImage } from '@/lib/upload'
import { Upload, X, Loader2 } from 'lucide-react'

export default function MediaUploader({ images = [], onImagesChange, maxFiles = 9 }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    if (images.length + files.length > maxFiles) {
      alert(`最多上传 ${maxFiles} 张图片`)
      return
    }

    setUploading(true)
    const results = []
    for (const file of files) {
      const { url, error } = await uploadImage(file, 'images')
      if (error) { alert(`上传失败: ${error.message}`) }
      else { results.push(url) }
    }
    onImagesChange([...images, ...results])
    setUploading(false)
  }

  function removeImage(index) {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative group">
            <img src={url} alt="" className="w-20 h-20 object-cover rounded-card border border-border" loading="lazy" />
            <button
              onClick={() => removeImage(i)}
              className="absolute -top-1.5 -right-1.5 bg-danger text-text-inverse rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length < maxFiles && (
          <label className="w-20 h-20 border-2 border-dashed border-border rounded-card flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleUpload} hidden />
            {uploading ? <Loader2 size={20} className="text-muted animate-spin" /> : <Upload size={20} className="text-muted" />}
            <span className="text-muted text-[10px] mt-0.5">上传</span>
          </label>
        )}
      </div>
      <p className="text-muted text-xs">支持 PNG / JPG / WebP，单张 ≤10MB</p>
    </div>
  )
}
