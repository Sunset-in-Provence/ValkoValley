/**
 * 视频嵌入播放器 — B站 / YouTube 链接解析为 iframe
 * UI 变量映射：bg-surface, text-muted, rounded-card
 */
import { parseVideoUrl } from '@/lib/embedParser'
import { X } from 'lucide-react'

export default function VideoEmbed({ urls = [], onUrlsChange, editable = false }) {
  function addUrl() {
    const input = prompt('粘贴 B站 或 YouTube 视频链接：')
    if (!input) return
    const info = parseVideoUrl(input.trim())
    if (!info) {
      alert('无法识别该视频链接，目前支持 B站（bilibili）和 YouTube')
      return
    }
    onUrlsChange([...urls, input.trim()])
  }

  function removeUrl(index) {
    onUrlsChange(urls.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {/* 已添加的视频 */}
      {urls.map((url, i) => {
        const info = parseVideoUrl(url)
        const embedUrl = info?.embedUrl
        const isLocal = url.includes('supabase.co') || url.endsWith('.mp4') || url.endsWith('.webm')
        return (
          <div key={i} className="relative bg-surface rounded-card overflow-hidden border border-border">
            <div className={isLocal ? '' : 'aspect-video'}>
              {isLocal ? (
                <video controls className="w-full" style={{ maxHeight: 400 }}>
                  <source src={url} />您的浏览器不支持视频播放</video>
              ) : embedUrl ? (
                <iframe src={embedUrl} title={`video-${i}`} className="w-full h-full aspect-video"
                  allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted text-sm">无法加载视频：{url}</div>
              )}
            </div>
            {editable && (
              <button
                onClick={() => removeUrl(i)}
                className="absolute top-2 right-2 bg-danger/80 text-text-inverse rounded-full w-6 h-6 flex items-center justify-center hover:bg-danger"
              >
                <X size={14} />
              </button>
            )}
            {info && (
              <div className="px-3 py-1.5 text-muted text-xs">
                {info.type === 'bilibili' ? '🎬 B站视频' : '▶️ YouTube'}
              </div>
            )}
          </div>
        )
      })}

      {/* 添加视频按钮 */}
      {editable && (
        <button
          type="button" onClick={addUrl}
          className="w-full border-2 border-dashed border-border rounded-card py-4 text-muted text-sm hover:border-accent hover:text-accent transition-colors"
        >
          + 添加视频链接（B站 / YouTube）
        </button>
      )}
    </div>
  )
}
