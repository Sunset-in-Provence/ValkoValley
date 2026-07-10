import { supabase } from './supabaseClient'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const MAX_VIDEO_SIZE = 50 * 1024 * 1024
const MAX_AUDIO_SIZE = 50 * 1024 * 1024

async function uploadToBucket(file, bucket) {
  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const { data, error } = await supabase.storage.from(bucket).upload(fileName, file, { cacheControl: '31536000', upsert: false })
  if (error) return { url: null, error }
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { url: urlData.publicUrl, error: null }
}

export async function uploadImage(file, bucket = 'images') {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return { url: null, error: new Error('仅支持 PNG、JPG、WebP 格式的图片') }
  if (file.size > MAX_IMAGE_SIZE) return { url: null, error: new Error('图片大小不能超过 10MB') }
  return uploadToBucket(file, bucket)
}

export async function uploadVideo(file) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) return { url: null, error: new Error('仅支持 MP4、WebM 格式的视频') }
  if (file.size > MAX_VIDEO_SIZE) return { url: null, error: new Error('视频大小不能超过 100MB') }
  return uploadToBucket(file, 'videos')
}

export async function uploadAudio(file) {
  if (!ALLOWED_AUDIO_TYPES.includes(file.type)) return { url: null, error: new Error('仅支持 MP3、WAV、OGG、FLAC 格式的音频') }
  if (file.size > MAX_AUDIO_SIZE) return { url: null, error: new Error('音频大小不能超过 50MB') }
  return uploadToBucket(file, 'videos')
}
