# ValkoValley 狼和铃兰的幸福归来

> 敖尹×你 同人创作与讨论的垂直社区 —— 一个有准入门槛、内容经审核、数据受保护的同人创作乐园。

[![技术栈](https://img.shields.io/badge/stack-React%2019%20%2B%20Vite%208%20%2B%20Supabase-5DAF7C)](https://valkovalley.com)
[![部署](https://img.shields.io/badge/deploy-Vercel-000000)](https://vercel.com)
[![存储](https://img.shields.io/badge/storage-Cloudflare%20R2-F6821F)](https://www.cloudflare.com/developer-platform/r2/)

## ✨ 功能特性

| 模块 | 说明 |
|------|------|
| 🛡 准入体系 | 邀请码 / 申请审核制 + 两阶段入站考试（社区公约 + 敖尹知识，80% 及格线，24h 冷却） |
| 💬 讨论区 | 发帖、三级楼中楼评论（depth 约束）、点赞、收藏、举报、时间/热度排序（服务端热度榜）、关键词搜索、游标分页加载 |
| 🎨 创作区 | 图文 / 视频 / 音频投稿，标签系统（GIN 索引），AI 作品标注与过滤 |
| 📚 档案馆 | 世界观设定投稿 → 管理员审核 → 发布，置顶与阅读量排行 |
| 🛠 管理后台 | 举报审核、违规永久公示、公告发布、用户/设备封禁、敏感词库、邀请码管理 |
| 🌌 宇宙共创企划 | 星纪（赛季）周期管理、投稿、每日领票（幂等）与原子投票 |
| 🤖 防 AI 爬虫 | 全站 Row Level Security：未登录用户无法读取任何社区内容 |

## 🧱 技术栈

- **前端**：React 19 · Vite 8 · Tailwind CSS 4 · React Router 7（路由级代码分割）
- **后端 / BaaS**：Supabase（PostgreSQL + PostgREST + Auth + Storage）
- **媒体存储**：Cloudflare R2（S3 兼容，浏览器预签名直传），Supabase Storage 兜底
- **Serverless**：Vercel Functions（Node.js，AWS SDK v3 生成 R2 预签名 URL）
- **安全**：DOMPurify 输入清洗、RLS 行级权限、`SECURITY DEFINER` 原子 RPC

## 🏗 架构

```
浏览器 (React 19 SPA)
   │  React Router 7（懒加载 + 代码分割）
   │
   ├─ 静态资源 → Vercel CDN（SPA rewrite）
   ├─ /api/upload-url → Vercel Serverless Function
   │       │ 验证 Supabase JWT → AWS SDK 签发 R2 预签名 URL（5 分钟有效）
   │       ▼
   │  Cloudflare R2 对象存储（浏览器直传，50MB 图 / 500MB 视频）
   │       └─ 失败自动回退 → Supabase Storage
   │
   └─ Supabase（PostgreSQL）
          ├─ Row Level Security —— 所有内容表仅认证用户可读
          ├─ SECURITY DEFINER RPC —— 原子业务逻辑（投票、删除、管理操作）
          └─ Auth（JWT，localStorage + 自动刷新）
```

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制 .env.example 为 .env）
VITE_SUPABASE_URL=https://xxxx.supabase.co      # Supabase 项目 URL
VITE_SUPABASE_ANON_KEY=eyJhbGci...              # anon key（设计上公开，可进前端 bundle）
VITE_ADMIN_EMAIL=admin@example.com              # 管理员邮箱（UI 层快捷判断）

# 3. 启动开发服务器
npm run dev

# 4. 数据库迁移
# 在 Supabase Dashboard → SQL Editor 中按序号依次执行 supabase/migrations/ 下的 SQL 文件
# （00013 起包含安全加固与分页 RPC，必须执行）

# 5. 创建 Storage 存储桶（images / videos / avatars）
# 详见 docs/DEPLOYMENT_GUIDE.md
```

## 🗄 数据库设计

核心表（完整迁移见 [supabase/migrations/](supabase/migrations/)）：

```
profiles (用户资料，FK → auth.users)
 ├─ posts (帖子) ── comments (评论，自引用楼中楼：parent_id / reply_to_id / depth 0-2)
 ├─ creations (创作)      ├─ reports (举报，多态 target_type + target_id)
 ├─ library_entries (档案馆) ├─ notifications (通知)
 └─ universe_entries (星纪投稿)
universe_seasons ── universe_vote_options / universe_vote_wallets（每日领票）
universe_votes（投票流水）
```

设计要点：

- **全表启用 RLS**：内容表仅认证用户可读；用户只能改自己的内容；被封禁用户不可发布
- **索引覆盖查询路径**：外键列、`created_at DESC` 排序列、`tags` GIN 数组索引、`(user_id, is_read)` 组合索引
- **软删除**：`is_deleted` 标记 + RLS 过滤，保留审计痕迹
- **分页与聚合下沉**：列表游标分页（每页 20 条）；热度榜与搜索由数据库 RPC 计算（`get_hot_posts` / `search_posts` / `get_hot_creations` / `search_creations`），评论楼中楼按页加载
- **业务逻辑下沉数据库**：投票领票幂等（`claim_daily_votes`）、余额原子扣减（`cast_universe_vote`）、越权删除防护（`delete_own_*`），绕过前端不可伪造

## 🔐 安全设计

| 威胁 | 措施 |
|------|------|
| 未授权数据抓取 | 全站 RLS，匿名请求无法读取任何内容表 |
| SQL 注入 | PostgREST 参数化查询；RPC 统一 `SET search_path = ''` 防搜索路径劫持 |
| XSS | DOMPurify 白名单清洗全部用户输入；全项目零 `dangerouslySetInnerHTML` |
| CSRF | 无 Cookie 会话（纯 Bearer JWT），SPA 天然免疫 |
| 恶意文件上传 | 服务端验证 JWT + MIME 白名单 + 文件名清洗 + 预签名 URL 限时失效 |
| 越权操作 | 前端守卫仅为体验层；数据权限在 RLS / `is_admin()` 数据库函数强制执行 |
| 暴力注册 | Supabase Auth 速率限制 + 入站考试冷却 + 邀请码绑定邮箱 |

## 📁 项目结构

```
src/
├── components/        # 组件（按域划分：discussion / creation / admin / universe ...）
│   ├── auth/          # 登录守卫 ProtectedRoute（adminOnly 支持）
│   └── shared/        # 通用组件（LikeButton / ImageViewer / ReportButton ...）
├── context/           # AuthContext（session 监听 + 封禁检查）/ ThemeContext
├── lib/               # Supabase 客户端 / 上传（R2+回退）/ DOMPurify / 设备指纹
├── pages/             # 页面组件（路由级懒加载）
└── hooks/             # 数据 Hook
api/
└── upload-url.js      # Vercel Serverless：R2 预签名上传 URL
supabase/migrations/   # 数据库迁移（12+ 个，按序执行）
docs/                  # 部署指引 / 项目企划书
```

## 🚢 部署

- **Vercel**：连接 GitHub 仓库自动部署（构建命令 `npm run build`，输出 `dist`，根目录 [vercel.json](vercel.json) 处理 SPA rewrite 与 Serverless Functions）
- **Supabase**：PostgreSQL 区域 Tokyo（Northeast Asia）
- **Cloudflare R2**：媒体文件对象存储，出口流量免费
- 完整步骤见 [docs/DEPLOYMENT_GUIDE.md](docs/DEPLOYMENT_GUIDE.md)

## 📈 路线图

- [ ] 宇宙共创 Phase 2：星纪内投票榜、建设模式、星辉贡献榜
- [ ] 私信 Realtime 实时推送
- [ ] 自动化测试（组件测试 + RPC 集成测试）
- [ ] 数据库 schema drift 补全（手工建表 SQL 纳入迁移）

## 📄 License

本项目为社区私人项目，代码仅供学习交流，请勿用于商业用途。
