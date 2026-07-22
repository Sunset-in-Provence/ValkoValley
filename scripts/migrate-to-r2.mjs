/**
 * 一次性脚本：Supabase Storage → R2 文件迁移
 *
 * 先在 project 根目录创建 .env 文件：
 *   VITE_SUPABASE_URL=https://vajcfjmhxphxsxshqtac.supabase.co
 *   SUPABASE_SERVICE_KEY=你的service_role密钥
 *   R2_ACCESS_KEY_ID=你的R2 Access Key
 *   R2_SECRET_ACCESS_KEY=你的R2 Secret
 *
 * 运行：node scripts/migrate-to-r2.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// 读取 .env 文件
function loadEnv() {
  try {
    const path = resolve(process.cwd(), '.env')
    const content = readFileSync(path, 'utf-8')
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const eq = trimmed.indexOf('=')
      if (eq === -1) continue
      const key = trimmed.slice(0, eq).trim()
      const val = trimmed.slice(eq + 1).trim()
      if (!process.env[key]) process.env[key] = val
    }
  } catch {}
}
loadEnv()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 请在 .env 文件中设置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const r2endpoint = process.env.R2_ENDPOINT || 'https://df174e88e4ae52bd978b68f2d60dd5f4.r2.cloudflarestorage.com'
const r2key = process.env.R2_ACCESS_KEY_ID
const r2secret = process.env.R2_SECRET_ACCESS_KEY

if (!r2key || !r2secret) {
  console.error('❌ 请在 .env 文件中设置 R2_ACCESS_KEY_ID 和 R2_SECRET_ACCESS_KEY')
  process.exit(1)
}

const r2 = new S3Client({
  region: 'auto',
  endpoint: r2endpoint,
  credentials: { accessKeyId: r2key, secretAccessKey: r2secret },
})

const BUCKET = process.env.R2_BUCKET || 'valkovalley-media'

async function listAll(bucket, maxDepth = 5) {
  const results = []
  async function walk(prefix, depth) {
    if (depth > maxDepth) return
    const { data, error } = await supabase.storage.from(bucket).list(prefix)
    if (error) { console.error(`list error at ${prefix}:`, error.message); return }
    if (!data) return
    for (const item of data) {
      const key = prefix ? `${prefix}/${item.name}` : item.name
      if (item.id === null) {
        await walk(key, depth + 1)
      } else {
        results.push(key)
      }
    }
  }
  await walk('', 0)
  return results
}

async function migrateBucket(bucket) {
  console.log(`\n${bucket}: 获取文件列表...`)
  const keys = await listAll(bucket)
  console.log(`${bucket}: 共 ${keys.length} 个文件`)

  let ok = 0, skip = 0
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const r2Key = `${bucket}/${key}`

    // 已存在则跳过
    try { await r2.send(new HeadObjectCommand({ Bucket: BUCKET, Key: r2Key })); skip++; continue } catch {}

    // 先拿文件大小
    const sizeStr = key
    process.stdout.write(`  [${i + 1}/${keys.length}] ${sizeStr} `)

    const { data, error: dlErr } = await supabase.storage.from(bucket).download(key)
    if (dlErr || !data) { console.log(`❌ ${dlErr?.message}`); continue }

    const sizeMB = (data.size / 1024 / 1024).toFixed(1)
    process.stdout.write(`(${sizeMB}MB) `)

    try {
      const buf = Buffer.from(await data.arrayBuffer())
      await r2.send(new PutObjectCommand({
        Bucket: BUCKET, Key: r2Key, Body: buf,
        ContentType: data.type || 'application/octet-stream',
      }))
      console.log('✅')
      ok++
    } catch (err) {
      console.log(`❌ ${err.message}`)
    }
  }
  console.log(`${bucket}: ${ok} 新增 / ${skip} 已存在 / ${keys.length} 总计`)
  return ok
}

console.log('迁移 Supabase Storage → R2 ...\n')
let total = 0
for (const b of ['images', 'videos', 'avatars']) {
  total += await migrateBucket(b)
}
console.log(`\n共 ${total} 个文件`)

// 输出 URL 替换 SQL
console.log('\n========== 在 Supabase SQL Editor 运行以下 SQL ==========\n')
const OLD = 'vajcfjmhxphxsxshqtac.supabase.co/storage/v1/object/public'
const NEW = 'media.valkovalley.com'
console.log(`UPDATE posts SET image_urls = array_replace(image_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE creations SET image_urls = array_replace(image_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE creations SET video_urls = array_replace(video_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE comments SET image_urls = array_replace(image_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE messages SET image_urls = array_replace(image_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE library_entries SET image_urls = array_replace(image_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE library_entries SET video_urls = array_replace(video_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE library_entries SET audio_urls = array_replace(audio_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`UPDATE library_entries SET cover_url = REPLACE(cover_url, '${OLD}', '${NEW}');`)
console.log(`UPDATE profiles SET avatar_url = REPLACE(avatar_url, '${OLD}', '${NEW}');`)
console.log(`UPDATE registration_applications SET image_urls = array_replace(image_urls::text[], '${OLD}', '${NEW}')::text[];`)
console.log(`\nSELECT COUNT(*) FROM posts WHERE array_to_string(image_urls, ',') LIKE '%supabase.co%';`)
console.log('-- 返回 0 表示全部替换完毕')
