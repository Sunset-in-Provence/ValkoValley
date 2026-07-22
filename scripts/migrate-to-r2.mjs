/**
 * 一次性脚本：Supabase Storage → R2 文件迁移
 *
 * 准备：
 *   1. 去 Supabase Dashboard → Settings → API → 复制 service_role key
 *   2. 在终端设置环境变量：
 *      set VITE_SUPABASE_URL=https://vajcfjmhxphxsxshqtac.supabase.co
 *      set SUPABASE_SERVICE_KEY=你的service_role_key
 *      set R2_ACCESS_KEY_ID=你的key
 *      set R2_SECRET_ACCESS_KEY=你的secret
 *
 * 运行：node scripts/migrate-to-r2.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || 'https://vajcfjmhxphxsxshqtac.supabase.co',
  process.env.SUPABASE_SERVICE_KEY,
)

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || 'https://df174e88e4ae52bd978b68f2d60dd5f4.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
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
        // 文件夹
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

  let ok = 0
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    process.stdout.write(`  [${i + 1}/${keys.length}] ${key} ... `)

    // 下载
    const { data, error: dlErr } = await supabase.storage.from(bucket).download(key)
    if (dlErr || !data) { console.log(`❌ ${dlErr?.message}`); continue }

    // 上传到 R2（保持路径：images/xxx, videos/xxx）
    const r2Key = `${bucket}/${key}`
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
  console.log(`${bucket}: ${ok}/${keys.length} 成功\n`)
  return ok
}

console.log('开始迁移...\n')
let total = 0
for (const b of ['images', 'videos', 'avatars']) {
  total += await migrateBucket(b)
}
console.log(`共用 ${total} 个文件迁移完成`)

// 输出 URL 替换 SQL
console.log('\n===== 在 Supabase SQL Editor 运行以下 SQL =====\n')
const OLD = 'vajcfjmhxphxsxshqtac.supabase.co/storage/v1/object/public'
const NEW = 'media.valkovalley.com'
console.log(`-- 替换所有旧 Supabase 文件 URL 到 R2\n`)
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
console.log('\nSELECT * FROM posts WHERE array_to_string(image_urls, \',\') LIKE \'%supabase.co%\';')
console.log('-- 返回 0 行即表示全部替换完毕')
