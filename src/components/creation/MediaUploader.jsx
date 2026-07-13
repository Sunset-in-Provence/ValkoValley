import { useState, useRef } from 'react'
import { uploadImage } from '@/lib/upload'
import { Upload, X, Loader2, GripVertical } from 'lucide-react'

export default function MediaUploader({ images = [], onImagesChange, maxFiles = 9 }) {
  const [uploading, setUploading] = useState(false)
  const dragItem = useRef(null)
  const dragOverItem = useRef(null)

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
      if (error) alert(`上传失败: ${error.message}`)
      else results.push(url)
    }
    onImagesChange([...images, ...results])
    setUploading(false)
  }

  function removeImage(index) {
    onImagesChange(images.filter((_, i) => i !== index))
  }

  function handleDragStart(i) { dragItem.current = i }
  function handleDragEnter(i) { dragOverItem.current = i }
  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return
    const copy = [...images]
    const dragged = copy.splice(dragItem.current, 1)[0]
    copy.splice(dragOverItem.current, 0, dragged)
    onImagesChange(copy)
    dragItem.current = null
    dragOverItem.current = null
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {images.map((url, i) => (
          <div key={i} className="relative group" draggable onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)} onDragEnd={handleDragEnd} onDragOver={(e) => e.preventDefault()}>
            <div className="absolute -top-1.5 -left-1.5 bg-surface border border-border rounded-full w-5 h-5 flex items-center justify-center cursor-grab z-10 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <GripVertical size={10} className="text-muted" />
            </div>
            <img src={url} alt="" className="w-20 h-20 object-cover rounded-card border border-border" loading="lazy" />
            <button onClick={(e) => { e.preventDefault(); removeImage(i) }}
              className="absolute -top-1.5 -right-1.5 bg-danger text-text-inverse rounded-full w-5 h-5 flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length < maxFiles && (
          <label className="flex items-center gap-1.5 bg-hover border border-border text-secondary px-4 py-2 rounded-button text-sm cursor-pointer hover:bg-accent hover:text-text-inverse transition-colors">
            <input type="file" accept="image/png,image/jpeg,image/webp" multiple onChange={handleUpload} hidden />
            {uploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
            {uploading ? '上传中...' : '上传图片'}
          </label>
        )}
      </div>
      <p className="text-muted text-xs">支持 PNG / JPG / WebP，单张 ≤10MB</p>
    </div>
  )
}
