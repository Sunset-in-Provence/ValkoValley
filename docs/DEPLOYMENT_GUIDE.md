# ValkoValley 部署指引

## 一、Supabase 项目创建

### 1.1 创建项目
1. 打开 [supabase.com/dashboard](https://supabase.com/dashboard)
2. 点击 **New project**
3. 选择 Organization，填写：
   - **Name**: `valkovalley`
   - **Database Password**: 生成一个强密码并保存
   - **Region**: 选择离用户最近的区域（推荐 Northeast Asia / Tokyo）
4. 点击 **Create project**，等待初始化完成（约 2 分钟）

### 1.2 获取 API 密钥
1. 进入项目 → **Settings** → **API**
2. 复制以下值：
   - **Project URL** → 填入 `.env` 的 `VITE_SUPABASE_URL`
   - **anon public key** → 填入 `.env` 的 `VITE_SUPABASE_ANON_KEY`

### 1.3 配置环境变量
```bash
# 复制 .env.example 为 .env
cp .env.example .env

# 编辑 .env 填入实际值
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
VITE_ADMIN_EMAIL=admin@valkovalley.com
```

### 1.4 运行数据库迁移
1. 进入 Supabase Dashboard → **SQL Editor**
2. 复制 `supabase/migrations/00001_initial_schema.sql` 的全部内容
3. 粘贴到 SQL Editor 中，点击 **Run**
4. 确认所有表创建成功（Table Editor 中查看）

### 1.5 开启 Realtime（用于私信 P2）
1. 进入 **Database** → **Replication**
2. 将 `messages` 表加入 Realtime 发布列表（后续需要时操作）

### 1.6 配置认证
1. 进入 **Authentication** → **Settings**
2. **Auth Providers**: 确保 **Email** 已启用
3. **Email Auth**: 
   - 关闭 **Confirm email**（注册后直接激活，考试已做用户筛选）
   - 或保持开启（更安全，但需要配置邮件模板）
4. **Rate Limiting**: 
   - 在 **Authentication** → **Rate Limiting** 中
   - 设置登录速率限制为 5 次/分钟

### 1.7 创建 Storage 存储桶
1. 进入 **Storage** → **New bucket**
2. 创建以下公开存储桶：
   - `images`（用户上传图片，公开）
   - `videos`（用户上传视频，公开）
   - `avatars`（用户头像，公开）
3. 每个 bucket 设置 **RLS Policy**：
   ```sql
   -- 允许所有用户读取
   CREATE POLICY "public_read" ON storage.objects
     FOR SELECT USING (bucket_id IN ('images', 'videos', 'avatars'));
   
   -- 仅认证用户可上传
   CREATE POLICY "authenticated_upload" ON storage.objects
     FOR INSERT TO authenticated
     WITH CHECK (bucket_id IN ('images', 'videos', 'avatars'));
   ```

---

## 二、Vercel 部署

### 2.1 连接 GitHub
1. 确保项目已推送到 GitHub 仓库：
   ```bash
   git remote add origin https://github.com/你的用户名/valkovalley.git
   git push -u origin main
   ```

### 2.2 导入到 Vercel
1. 打开 [vercel.com/new](https://vercel.com/new)
2. 选择你的 GitHub 仓库 `valkovalley`
3. 配置构建设置：
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
4. **Environment Variables**（添加以下环境变量）：
   ```
   VITE_SUPABASE_URL = https://xxxxxxxxxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY = eyJhbGci...
   VITE_ADMIN_EMAIL = admin@valkovalley.com
   ```
5. 点击 **Deploy**

### 2.3 绑定自定义域名
1. 进入项目 → **Settings** → **Domains**
2. 添加 `valkovalley.com`
3. 按 Vercel 指引在域名 DNS 中添加 CNAME 记录指向 `cname.vercel-dns.com`
4. 等待 SSL 证书自动签发（约 1 分钟）

---

## 三、管理员初次配置

### 3.1 创建管理员账户
1. 用你的管理员邮箱在网站注册（通过入站考试）
2. 确保邮箱与 `.env` 中 `VITE_ADMIN_EMAIL` 完全一致
3. 重新登录后，导航栏应出现 🛡️ 盾牌图标

### 3.2 初始化题库
1. 访问 `/admin/exam`
2. 点击「从默认题库同步」，将 `src/lib/examQuestions.js` 导入数据库
3. 此后可在后台直接增删改题目

### 3.3 编辑首页内容
1. 访问 `/admin` → 进入内容管理
2. 编辑首页各区块（hero、介绍、特色卡片）
3. 支持草稿保存和历史版本回滚

### 3.4 配置主题
1. 访问 `/admin/theme`
2. 手动调整配色或上传素材提取主色调
3. 或直接向 Claude 描述你想要的 UI 风格，由 Claude 修改 `src/index.css` 的 `@theme` 块

---

## 四、AI 爬取防护体系

| 层级 | 措施 | 文件/位置 |
|------|------|-----------|
| **robots.txt** | 拦截 GPTBot、CCBot、Bytespider 等 12+ AI 爬虫 | `public/robots.txt` |
| **Meta 标签** | `noai, noimageai` 声明 | `index.html` |
| **数据库 RLS** | 全部内容表仅对认证用户开放读取，未登录匿名请求无法获取任何创作数据 | `supabase/migrations/00001_initial_schema.sql` |
| **Supabase Rate Limit** | 认证接口速率限制，防暴力注册 | Supabase Dashboard Auth Settings |
| **封禁机制** | 可疑 IP/用户可被管理员封禁 | `profiles.is_banned = true` |

---

## 五、后续开发启动

部署完成后，按企划书阶段继续开发：
- **P0-2**: 完善认证系统（入站考试接入真实题库）
- **P0-3**: 讨论区 CRUD + 楼中楼评论
- **P0-4**: 创作区 + 标签系统 + 媒体上传
- **P0-5**: 个人主页
- **P0-6**: 举报审核后台
- **P1**: 深色模式 + UI 管理工具 + 安全加固
