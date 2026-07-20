/**
 * 跨域文件强制下载 — 绕过浏览器对 <a download> 的同源限制
 * @param {string} url - 文件 URL（可跨域）
 * @param {string} filename - 下载文件名
 */
export async function forceDownload(url, filename) {
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error('下载失败')
    const blob = await res.blob()
    const blobUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = blobUrl
    a.download = filename || url.split('/').pop() || 'download'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(blobUrl)
  } catch (err) {
    console.error('下载失败:', err)
    // 回退：直接打开
    window.open(url, '_blank')
  }
}
