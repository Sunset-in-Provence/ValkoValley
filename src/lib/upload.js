import { supabase } from './supabaseClient'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
const MAX_AUDIO_SIZE = 50 * 1024 * 1024

/** 通过 Vercel API 上传到 R2，fallback 到 Supabase Storage */
async function uploadViaR2(file) {
  try {
    // 获取当前登录 token
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) throw new Error('未登录')

    // 调用 API 获取预签名 URL
    const res = await fetch('/api/upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ fileName: file.name, contentType: file.type }),
    })
    const body = await res.json()
    if (!res.ok || !body.uploadUrl) throw new Error(body.error || '获取上传地址失败')

    // 直传 R2
    const putRes = await fetch(body.uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    })
    if (!putRes.ok) throw new Error('上传到 R2 失败: ' + putRes.status)

    return { url: body.publicUrl, error: null }
  } catch (err) {
    // R2 不可用时回退到 Supabase Storage
    console.warn('R2 upload failed, falling back to Supabase:', err.message)
    return null // 返回 null 表示需要 fallback
  }
}

async function uploadToSupabase(file, bucket) {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '31536000', upsert: false })
  if (error) return { url: null, error }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { url: urlData.publicUrl, error: null }
}

async function uploadWithFallback(file, supabaseBucket) {
  // 先尝试 R2
  const r2Result = await uploadViaR2(file)
  if (r2Result) return r2Result
  // 回退到 Supabase
  return uploadToSupabase(file, supabaseBucket)
}

export async function uploadImage(file, bucket = 'images') {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { url: null, error: new Error('仅支持 PNG、JPG、WebP 格式的图片') }
  if (file.size > MAX_IMAGE_SIZE) return { url: null, error: new Error('图片大小不能超过 10MB') }
  return uploadWithFallback(file, bucket)
}

export async function uploadVideo(file) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) return { url: null, error: new Error('仅支持 MP4、WebM 格式的视频') }
  if (file.size > MAX_VIDEO_SIZE) return { url: null, error: new Error('视频大小不能超过 100MB') }
  return uploadWithFallback(file, 'videos')
}

export async function uploadAudio(file) {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) return { url: null, error: new Error('仅支持 MP3、WAV、OGG、FLAC 格式的音频') }
  if (file.size > MAX_AUDIO_SIZE) return { url: null, error: new Error('音频大小不能超过 50MB') }
  return uploadWithFallback(file, 'videos')
}
