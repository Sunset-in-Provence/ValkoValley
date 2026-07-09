/**
 * Supabase Storage 文件上传封装
 */
import { supabase } from './supabaseClient'

const ALLOWED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024 // 100MB

/**
 * 上传图片到 Supabase Storage
 * @param {File} file - 图片文件
 * @param {string} bucket - 存储桶名（默认 'images'）
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadImage(file, bucket = 'images') {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return { url: null, error: new Error('仅支持 PNG、JPG、WebP 格式的图片') }
  }
  if (file.size > MAX_IMAGE_SIZE) {
    return { url: null, error: new Error('图片大小不能超过 10MB') }
  }

  const ext = file.name.split('.').pop()
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      cacheControl: '31536000',
      upsert: false,
    })

  if (error) return { url: null, error }

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path)
  return { url: urlData.publicUrl, error: null }
}

/**
 * 上传视频到 Supabase Storage
 * @param {File} file - 视频文件
 * @returns {Promise<{url: string, error: Error|null}>}
 */
export async function uploadVideo(file) {
  if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
    return { url: null, error: new Error('仅支持 MP4、WebM 格式的视频') }
  }
  if (file.size > MAX_VIDEO_SIZE) {
    return { url: null, error: new Error('视频大小不能超过 100MB') }
  }

  return uploadImage(file, 'videos')
}
