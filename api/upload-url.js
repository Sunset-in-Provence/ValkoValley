/**
 * Vercel Serverless Function — 生成 Cloudflare R2 预签名上传 URL
 * POST /api/upload-url
 */
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const PUBLIC_URL = process.env.R2_PUBLIC_URL || process.env.R2_ENDPOINT

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function GET() {
  // 仅健康检查，不暴露 bucket / endpoint 等内部信息
  return Response.json({ status: 'ok' }, { headers: CORS_HEADERS })
}

export async function POST(request) {
  try {
    const body = await request.json()
    const { fileName, contentType, fileSize } = body

    if (!fileName || !contentType || !fileSize) {
      return Response.json({ error: '缺少 fileName、contentType 或 fileSize' }, { status: 400, headers: CORS_HEADERS })
    }

    // 验证登录
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return Response.json({ error: '未登录' }, { status: 401, headers: CORS_HEADERS })
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    const supabase = createClient(supabaseUrl, supabaseKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return Response.json({ error: '登录已过期' }, { status: 401, headers: CORS_HEADERS })
    }

    // 限制类型和大小
    const allowedTypes = [
      'image/png', 'image/jpeg', 'image/webp', 'image/heic', 'image/heif',
      'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/flac',
    ]
    if (!allowedTypes.includes(contentType)) {
      return Response.json({ error: '不支持的文件类型' }, { status: 400, headers: CORS_HEADERS })
    }

    // 分文件夹 + 日期 + 随机 id
    const folder = contentType.startsWith('video/') ? 'videos' :
                   contentType.startsWith('audio/') ? 'audio' : 'images'

    // 服务端大小限制（客户端限制可被绕过，这里才是防线）
    const MAX_SIZES = {
      images: 50 * 1024 * 1024,     // 50MB
      videos: 500 * 1024 * 1024,    // 500MB
      audio: 100 * 1024 * 1024,     // 100MB
    }
    if (!Number.isFinite(fileSize) || fileSize <= 0) {
      return Response.json({ error: '非法的文件大小' }, { status: 400, headers: CORS_HEADERS })
    }
    if (fileSize > MAX_SIZES[folder]) {
      return Response.json({ error: `文件大小不能超过 ${MAX_SIZES[folder] / 1024 / 1024}MB` }, { status: 400, headers: CORS_HEADERS })
    }

    const ts = new Date().toISOString().slice(0, 10).replace(/-/g, '/')
    const rand = Math.random().toString(36).slice(2, 10)
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
    const key = `${folder}/${ts}/${rand}-${safeName}`

    // ContentLength 参与签名：超限大小的 PUT 会被 R2 直接拒绝
    const command = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET,
      Key: key,
      ContentType: contentType,
      ContentLength: fileSize,
    })

    const uploadUrl = await getSignedUrl(R2, command, { expiresIn: 300 })
    const publicUrl = `${PUBLIC_URL}/${key}`

    return Response.json({ uploadUrl, publicUrl, key }, { headers: CORS_HEADERS })
  } catch (err) {
    console.error('upload-url error:', err)
    return Response.json({ error: err.message || '服务器错误' }, { status: 500, headers: CORS_HEADERS })
  }
}
