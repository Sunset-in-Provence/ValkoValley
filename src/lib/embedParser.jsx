/**
 * B站 / YouTube 视频链接解析 → 嵌入播放器 iframe
 */

/**
 * 解析视频链接，返回嵌入 iframe 的 src URL
 * @param {string} url - 视频链接
 * @returns {{ type: 'bilibili'|'youtube'|'unknown', embedUrl: string|null }}
 */
export function parseVideoUrl(url) {
  // B站: https://www.bilibili.com/video/BV1xx411c7mD 或 https://b23.tv/xxxxx
  const biliMatch = url.match(
    /(?:bilibili\.com\/video\/|b23\.tv\/)([a-zA-Z0-9]+)/
  )
  if (biliMatch) {
    const bvid = biliMatch[1]
    return {
      type: 'bilibili',
      embedUrl: `https://player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1`,
    }
  }

  // YouTube: https://www.youtube.com/watch?v=VIDEO_ID 或 https://youtu.be/VIDEO_ID
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/
  )
  if (ytMatch) {
    return {
      type: 'youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
    }
  }

  return { type: 'unknown', embedUrl: null }
}

/**
 * 生成视频嵌入播放器 iframe 元素
 * @param {string} embedUrl - 嵌入链接
 * @param {string} type - 平台类型
 * @returns {JSX.Element}
 */
export function VideoIframe({ embedUrl, type, title = '视频播放器' }) {
  return (
    <div className="relative w-full aspect-video rounded-card overflow-hidden bg-hover">
      <iframe
        src={embedUrl}
        title={title}
        className="absolute inset-0 w-full h-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
