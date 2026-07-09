# ValkoValley 项目企划书（修订版 v3）

> 域名：**ValkoValley.com**
> 英文名：**ValkoValley**
> 中文名：狼和铃兰的幸福归来
> 定位：敖尹 CP 同人创作与讨论的垂直社区

---

## 一、技术栈（不变）

| 层面 | 选型 |
|------|------|
| 前端框架 | React 18 + Vite |
| 样式方案 | Tailwind CSS（所有样式通过 className 控制） |
| UI 骨架 | shadcn/ui（仅做结构骨架，颜色/圆角/间距全部在 tailwind.config.js 覆盖） |
| 后端/BaaS | Supabase（Auth / Database / Storage / Realtime） |
| 部署 | Vercel（连接 GitHub 仓库自动部署） |

---

## 二、UI 设计体系（强化版）

### 2.1 语义化类名体系（组件只能使用这些）

```
背景层：  bg-primary   bg-secondary   bg-surface   bg-hover   bg-accent
文字层：  text-primary text-secondary text-muted  text-accent text-inverse
边框层：  border-primary
功能色：  color-success  color-warning  color-danger  color-info
圆角层：  rounded-card  rounded-button  rounded-input  rounded-full
阴影层：  shadow-card  shadow-elevated
字体层：  font-display  font-body
```

### 2.2 UI 管理功能（Phase 1 即内置）

你需要的能力，我在项目中预埋以下机制：

| 你的需求 | 实现方式 |
|----------|----------|
| **全局手动调整** | 修改 `tailwind.config.js` 中 `theme.extend` 的颜色值/圆角值/字体族，全站自动同步 |
| **上传素材并识别** | 管理员后台 → "主题素材"页面，上传图片后前端 Canvas 提取主色调，**自动生成完整调色板建议**（含互补色、类似色、分裂互补色、三角色方案供选择） |
| **文字描述生成 UI** | 管理员后台 → "AI 主题生成器"，输入文字描述（如"暖色调手绘水彩风"），**先预留 UI 界面和 API 调用位置**，你后续填入 API Key 即可激活 |
| **深色/浅色模式** | Tailwind `dark:` 前缀全覆盖，切换状态存 localStorage，管理员可为浅色/深色分别配置独立的配色方案 |

### 2.3 组件文件规范

每个组件文件顶部必须有如下注释：

```jsx
/**
 * UI 变量映射 — 本组件使用的语义类名：
 *   背景：bg-primary, bg-surface
 *   文字：text-primary, text-secondary, text-muted
 *   圆角：rounded-card, rounded-button
 *   阴影：shadow-card
 *   （如需调整视觉效果，请修改 tailwind.config.js 中对应值，无需编辑本文件）
 */
```

---

## 三、修订后的功能清单

### P0 — 核心功能

#### 1. 用户认证系统（增强版）

**注册流程（v3 两阶段考试）**：

```
用户点击"注册"
  → 阅读并同意《ValkoValley 社区公约》（勾选复选框）
  → 填写邮箱 + 密码 + 用户名
  → ═══════════════════════════════════════════
    ║  第一阶段：社区文明公约考试               ║
    ║  从公约题库随机抽取 10 题                 ║
    ║  每题即时判断对错，必须答对 ≥ 80%（≥8题） ║
    ║  未达标 → "未通过公约考试，请重读公约"    ║
    ║          → 24 小时内不可重试              ║
    ═══════════════════════════════════════════
      ↓（第一阶段 ≥ 80% 通过）
    ═══════════════════════════════════════════
    ║  第二阶段：敖尹个人知识考试               ║
    ║  从敖尹题库随机抽取 10 题                 ║
    ║  每题即时判断对错，必须答对 ≥ 80%（≥8题） ║
    ║  未达标 → "未能通过入站考试，              ║
    ║             请重温敖尹的故事后重试"        ║
    ║          → 24 小时内不可重试              ║
    ═══════════════════════════════════════════
      ↓（两阶段全部通过）
  → Supabase Auth 创建账户
  → 写入 profiles 表（exam_passed_at = now()）
  → 自动登录 → 跳转首页
```

**考试详细规则**：
- 每阶段独立计分，任一阶段不通过即整体失败
- 每题答完即时显示对错，答错不中断，继续答完该阶段全部 10 题
- 最终统计正确率：≥ 80% = 通过，< 80% = 不通过
- 同一阶段内题目不会重复
- 失败后 24 小时冷却期（`last_exam_at` 记录），防止反复刷题

**题库双存储设计**（`src/lib/examQuestions.js` + 数据库 `exam_questions` 表）：
- **公约题库**：预设 20+ 道，涵盖：文明发言、禁止人身攻击、禁止盗图/抄袭、禁止恶意引战、版权声明、分级内容规范、隐私保护等
- **敖尹题库**：预设 20+ 道，涵盖：角色背景、剧情细节、世界观设定等
- **管理员 CRUD**：`/admin/exam` 页面提供题目增删改查，你和指定管理员可随时维护题库
- **同步机制**：前端文件 `examQuestions.js` 作为默认题库，可在管理后台一键同步到数据库

**用户协议**：
- 注册前必须勾选"我已阅读并同意《ValkoValley 社区公约》"
- 公约内容写入 `src/lib/communityRules.js`，方便修改
- 公约在独立页面 `/rules` 也可查看

#### 2. 三专区架构

**讨论区**（`/discussion`）：
- 发文字帖（Markdown 格式），实时预览
- 评论（**楼中楼嵌套结构**，支持回复特定评论，最多 3 层缩进）
- 帖子可按"最新发布 / 最多评论" 排序

**创作区**（`/creation`）：
- 发布创作：标题 + 正文 + 图片上传（Supabase Storage） + 视频嵌入（B站/YouTube 链接自动转换，也支持本地视频上传）
- **标签系统（修订）**：
  - 必须选择**年龄分级**：`全年龄` / `15+` / `18+`（预设必选）
  - 必须选择**创作类型**：`原创` / `二创`（预设必选）
  - **自定义标签**：用户可自由输入任意标签文字（如"同人文""手绘""MAD""考据"等），保存后可供其他用户检索和选择（标签云）
- 可按"最新发布 / 最多点赞"排序

**设定图书馆**（`/library`）：
- 敖尹官方设定资料存档，社区共建 Wiki 式资料库
- **分类体系**：角色设定 / 世界观 / 剧情年表 / 官方图鉴 / 音乐·OST / 其他
- **权限分级**：
  - 管理员：直接发布条目（`status = 'published'`）
  - 普通用户：投稿需管理员审核（`status = 'pending_review'`）
- 支持封面图、附图、视频链接（B站/YouTube）、自定义标签
- 管理员可置顶重要条目（`is_pinned = true`）
- 按分类筛选 + 全文搜索 + 标签检索
- 阅读量统计

#### 3. 个人主页（`/user/[username]`）

- 展示用户发布的帖子和创作
- 可编辑：头像（上传）、昵称、简介
- 展示 **入站考试通过日期**（老成员身份标识徽章）
- 展示该用户的自定义标签使用偏好

#### 4. 举报与审核系统（增强版）

**举报流程**：
```
用户点击"举报" → 填写理由 → 提交 → 写入 reports 表 (status='pending')
```

**审核后台（`/admin`）**：
- 仅管理员邮箱（环境变量 `ADMIN_EMAIL`）可访问
- **每日 6:00 UTC+8 自动排序**：按被举报次数 DESC + 严重程度权重排列
- 审核操作：
  | 操作 | 效果 |
  |------|------|
  | 删除内容 | 软删除 `is_deleted = true` |
  | 驳回举报 | `status = 'dismissed'` |
  | 封禁用户 | `profiles.is_banned = true`，时长可选（1天/7天/30天/永久） |
  | 发送警告通知 | 向被举报用户推送系统通知 |
- **违规公示板**（`/violations`）：
  - 严重违规记录在站内公示 7 天
  - **对全部用户可见（含未登录）**
  - **违规用户的昵称和头像模糊打码处理**（前端 CSS `filter: blur()` + 文字替换为"用***户"格式）
  - 公示内容写入 `violations` 表
  - 7 天后自动隐藏（不删除，仅前端按 `expires_at` 过滤）

**未来 AI 辅助**：预留 `reports` 表的 `ai_score` 字段（float），等你积累审核经验后接入。

---

### P1 — 安全与体验

#### 5. 安全防护

| 措施 | 说明 |
|------|------|
| Supabase RLS | 行级安全策略，用户只能修改自己的数据 |
| DOMPurify | 所有用户输入在渲染前清洗，防 XSS |
| Supabase Rate Limit | 登录/注册接口限速 |
| 内容审核 | posts/creations 软删除，不在 DB 层物理删除 |
| 文件上传校验 | 图片格式/大小限制（白名单：png/jpg/webp，≤10MB） |

#### 6. 深色/浅色模式

- Tailwind `dark:` 前缀
- localStorage 持久化主题偏好
- 默认跟随系统 `prefers-color-scheme`
- **管理员可配置两套配色方案**（浅色一组颜色值 + 深色一组颜色值）

---

### P2 — 未来迭代

#### 7. 私信功能
- 用户对用户一对一实时聊天
- Supabase Realtime 订阅

#### 8. 热门排序
- 按回复量/点赞数降序排列

#### 9. AI 辅助审核
- 等管理员积累经验后定义规则

---

## 四、修订后的数据库表设计

### 新增/修改的表

#### `profiles` — 用户资料表（修改）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK, FK→auth.users | |
| `username` | `varchar(30)` | UNIQUE, NOT NULL | |
| `display_name` | `varchar(50)` | | 昵称 |
| `avatar_url` | `text` | | 头像 URL |
| `bio` | `text` | | 简介 |
| `exam_passed_at` | `timestamptz` | NOT NULL | 入站考试通过日期 |
| `exam_attempts` | `int` | DEFAULT 1 | 考试尝试次数 |
| `last_exam_at` | `timestamptz` | | 上次考试时间（用于 24h 冷却） |
| `is_banned` | `boolean` | DEFAULT false | 是否被封禁 |
| `ban_expires_at` | `timestamptz` | | 封禁到期时间（null = 永久） |
| `created_at` | `timestamptz` | DEFAULT now() | |

#### `exam_questions` — 题库表（新增 ★）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `category` | `varchar(20)` | NOT NULL | `aoyin` / `rules` |
| `question` | `text` | NOT NULL | 题目内容 |
| `options` | `jsonb` | NOT NULL | `["A选项","B选项","C选项","D选项"]` |
| `correct_index` | `int` | NOT NULL | 正确答案索引 (0-3) |
| `is_active` | `boolean` | DEFAULT true | 是否启用 |

> 预设题目写在 `src/lib/examQuestions.js` 中作为默认数据，可同步到数据库表。

#### `community_rules` — 社区公约表（新增 ★）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `version` | `int` | NOT NULL | 版本号 |
| `content` | `text` | NOT NULL | Markdown 格式公约正文 |
| `published_at` | `timestamptz` | DEFAULT now() | |
| `is_current` | `boolean` | DEFAULT true | 当前生效版本 |

> 预设公约写在 `src/lib/communityRules.js` 中。

#### `violations` — 违规公示表（新增 ★）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `report_id` | `uuid` | FK→reports.id | 关联举报 |
| `user_id` | `uuid` | FK→profiles.id | 违规用户 |
| `violation_type` | `varchar(50)` | NOT NULL | 违规类型 |
| `description` | `text` | NOT NULL | 违规描述（脱敏后） |
| `penalty` | `varchar(50)` | NOT NULL | 处罚结果 |
| `published_at` | `timestamptz` | DEFAULT now() | 公示发布时间 |
| `expires_at` | `timestamptz` | NOT NULL | 7 天后自动隐藏 |

#### `notifications` — 系统通知表（新增 ★）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `user_id` | `uuid` | FK→profiles.id | 接收用户 |
| `type` | `varchar(30)` | NOT NULL | `violation_warning` / `ban_notice` / `content_removed` / `system` |
| `title` | `varchar(200)` | NOT NULL | |
| `content` | `text` | NOT NULL | |
| `is_read` | `boolean` | DEFAULT false | |
| `created_at` | `timestamptz` | DEFAULT now() | |

#### `tags` — 标签表（新增 ★）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `name` | `varchar(30)` | UNIQUE, NOT NULL | 标签名 |
| `usage_count` | `int` | DEFAULT 1 | 使用次数（用于标签云） |
| `is_preset` | `boolean` | DEFAULT false | 是否为预设标签 |

#### `site_content` — 首页可编辑内容表（新增 ★ 带版本历史）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `section` | `varchar(50)` | NOT NULL | 区块标识 e.g. `home_hero`, `home_intro`, `home_features` |
| `content` | `text` | NOT NULL | Markdown 内容 |
| `status` | `varchar(20)` | DEFAULT 'published' | `draft` / `published` |
| `version` | `int` | DEFAULT 1 | 版本号（自增） |
| `updated_at` | `timestamptz` | DEFAULT now() | |
| `updated_by` | `uuid` | FK→profiles.id | 编辑者 |

> **版本历史机制**：每次编辑保存时，旧版本不覆盖，而是新增一行 version+1 的记录。管理员可查看最近 2 个历史版本并回滚。草稿状态的内容仅管理员可见，不影响前端展示。
#### `theme_config` — 主题配置表（新增 ★）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `name` | `varchar(50)` | NOT NULL | 主题名称 |
| `is_active` | `boolean` | DEFAULT false | 当前启用的主题 |
| `mode` | `varchar(10)` | NOT NULL | `light` / `dark` |
| `colors` | `jsonb` | NOT NULL | `{ primary: "#8B5CF6", secondary: "#FDE68A", ... }` |
| `generated_by_ai` | `boolean` | DEFAULT false | AI 生成标记 |
| `created_at` | `timestamptz` | DEFAULT now() | |

### 完整定义的表

#### `posts` — 讨论区帖子表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `author_id` | `uuid` | FK → `profiles.id` | |
| `title` | `varchar(200)` | NOT NULL | |
| `content` | `text` | NOT NULL | Markdown 原文 |
| `is_deleted` | `boolean` | DEFAULT false | 软删除 |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | | |

#### `comments` — 评论表（楼中楼嵌套）
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `post_id` | `uuid` | FK → `posts.id`, CASCADE | 所属帖子 |
| `parent_id` | `uuid` | FK → `comments.id`, SET NULL | ★ 父评论 ID（null = 一级评论） |
| `reply_to_id` | `uuid` | FK → `comments.id`, SET NULL | ★ 被回复评论 ID（用于精确定位通知目标） |
| `author_id` | `uuid` | FK → `profiles.id` | |
| `content` | `text` | NOT NULL | |
| `depth` | `int` | DEFAULT 0 | ★ 嵌套深度：0=一级，1=二级，2=三级（封顶 3 层） |
| `is_deleted` | `boolean` | DEFAULT false | |
| `created_at` | `timestamptz` | DEFAULT now() | |

#### `creations` — 创作区作品表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `author_id` | `uuid` | FK → `profiles.id` | |
| `title` | `varchar(200)` | NOT NULL | |
| `content` | `text` | NOT NULL | 正文 |
| `tags` | `text[]` | NOT NULL | 标签数组 |
| `rating` | `varchar(20)` | NOT NULL | `general` / `15plus` / `18plus` |
| `image_urls` | `text[]` | DEFAULT '{}' | 图片 URL 数组 (Storage) |
| `video_urls` | `text[]` | DEFAULT '{}' | 视频链接数组 |
| `is_deleted` | `boolean` | DEFAULT false | |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `updated_at` | `timestamptz` | | |

#### `reports` — 举报表
| 列名 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | PK | |
| `reporter_id` | `uuid` | FK → `profiles.id` | 举报人 |
| `target_type` | `varchar(20)` | NOT NULL | `post` / `comment` / `creation` / `user` |
| `target_id` | `uuid` | NOT NULL | 被举报内容/用户 ID |
| `reason` | `text` | NOT NULL | 举报理由 |
| `status` | `varchar(20)` | DEFAULT 'pending' | `pending` / `resolved` / `dismissed` |
| `reviewer_id` | `uuid` | FK → `profiles.id` | 审核员 |
| `action_taken` | `varchar(50)` | | `content_deleted` / `user_banned` / `warning_sent` / `none` |
| `ai_score` | `float` | | ★ 预留 AI 辅助审核评分字段 |
| `created_at` | `timestamptz` | DEFAULT now() | |
| `resolved_at` | `timestamptz` | | |

---

## 五、修订后的文件结构

```
aoyin-valko/
├── docs/
│   └── PROJECT_PLAN.md              # 本文件
├── .env.example
├── .gitignore
├── index.html
├── package.json
├── tailwind.config.js               # ★ 全站视觉变量
├── vite.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css                     # ★ 全局纹理/手绘风格 + @tailwind 指令
    │
    ├── lib/
    │   ├── supabaseClient.js         # Supabase 客户端
    │   ├── examQuestions.js          # ★ 入库题库（敖尹 + 公约）
    │   ├── communityRules.js         # ★ 社区公约原文
    │   ├── auth.js                   # 注册/登录/登出
    │   ├── sanitize.js               # DOMPurify 封装
    │   ├── upload.js                 # Storage 上传封装
    │   ├── report.js                 # 举报逻辑
    │   ├── admin.js                  # 管理员操作
    │   ├── notifications.js          # 通知逻辑
    │   ├── markdown.js               # Markdown 渲染
    │   ├── embedParser.js            # B站/YT 链接解析
    │   ├── colorExtractor.js         # ★ Canvas 主色调提取
    │   └── themeGenerator.js         # ★ AI 主题生成接口封装
    │
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useTheme.js
    │   ├── usePosts.js
    │   ├── useCreations.js
    │   ├── useNotifications.js
    │   └── useRealtime.js
    │
    ├── context/
    │   ├── AuthContext.jsx
    │   └── ThemeContext.jsx
    │
    ├── components/
    │   ├── ui/                       # shadcn/ui 骨架
    │   │   ├── button.jsx
    │   │   ├── input.jsx
    │   │   ├── textarea.jsx
    │   │   ├── card.jsx
    │   │   ├── dialog.jsx
    │   │   ├── dropdown-menu.jsx
    │   │   ├── badge.jsx
    │   │   ├── avatar.jsx
    │   │   ├── tabs.jsx
    │   │   ├── select.jsx
    │   │   ├── toast.jsx
    │   │   ├── checkbox.jsx
    │   │   └── tooltip.jsx
    │   │
    │   ├── layout/
    │   │   ├── AppLayout.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── Footer.jsx
    │   │
    │   ├── auth/
    │   │   ├── LoginForm.jsx
    │   │   ├── RegisterForm.jsx
    │   │   ├── ExamModal.jsx         # 考试弹窗（动态刷新题目）
    │   │   ├── ExamQuestion.jsx      # 单道题组件
    │   │   ├── UserAgreement.jsx     # ★ 用户协议勾选
    │   │   └── ProtectedRoute.jsx
    │   │
    │   ├── discussion/
    │   │   ├── PostCard.jsx
    │   │   ├── PostDetail.jsx
    │   │   ├── PostEditor.jsx
    │   │   ├── PostList.jsx
    │   │   ├── CommentItem.jsx
    │   │   ├── CommentForm.jsx
    │   │   └── MarkdownPreview.jsx
    │   │
    │   ├── creation/
    │   │   ├── CreationCard.jsx
    │   │   ├── CreationDetail.jsx
    │   │   ├── CreationEditor.jsx
    │   │   ├── CreationList.jsx
    │   │   ├── TagSelector.jsx       # 分级 + 自定义标签
    │   │   ├── TagCloud.jsx          # ★ 标签云
    │   │   ├── MediaUploader.jsx
    │   │   └── VideoEmbed.jsx
    │   │
    │   ├── user/
    │   │   ├── ProfileHeader.jsx
    │   │   ├── ProfileEditor.jsx
    │   │   ├── UserPostsTab.jsx
    │   │   └── UserCreationsTab.jsx
    │   │
    │   ├── admin/
    │   │   ├── AdminLayout.jsx
    │   │   ├── ReportList.jsx        # 带自动排序
    │   │   ├── ReportCard.jsx
    │   │   ├── ActionConfirm.jsx
    │   │   ├── ViolationBoard.jsx    # ★ 违规公示板
    │   │   ├── ThemeEditor.jsx       # ★ 主题编辑器
    │   │   ├── ColorPicker.jsx       # ★ 颜色选择器
    │   │   ├── ThemeImportUploader.jsx # ★ 素材上传识别
    │   │   ├── AiThemeGenerator.jsx  # ★ AI 主题生成
    │   │   ├── ExamManager.jsx       # ★ 题库管理列表
    │   │   └── ExamQuestionEditor.jsx # ★ 题目编辑弹窗
    │   │
    │   ├── report/
    │   │   ├── ReportButton.jsx
    │   │   └── ReportDialog.jsx
    │   │
    │   ├── notification/             # ★ 新增
    │   │   ├── NotificationBell.jsx  # 通知铃铛
    │   │   └── NotificationList.jsx  # 通知列表
    │   │
    │   ├── messaging/                # (P2)
    │   │   ├── MessageList.jsx
    │   │   ├── MessageBubble.jsx
    │   │   └── MessageInput.jsx
    │   │
    │   └── shared/
    │       ├── EmptyState.jsx
    │       ├── LoadingSpinner.jsx
    │       ├── ErrorBoundary.jsx
    │       ├── Pagination.jsx
    │       ├── SortSelector.jsx
    │       └── UserBadge.jsx
    │
    └── pages/
        ├── HomePage.jsx              # 首页（可编辑内容）
        ├── DiscussionPage.jsx
        ├── DiscussionDetailPage.jsx
        ├── CreationPage.jsx
        ├── CreationDetailPage.jsx
        ├── UserProfilePage.jsx
        ├── LoginPage.jsx
        ├── RegisterPage.jsx
        ├── RulesPage.jsx             # ★ 社区公约展示页
        ├── ViolationsPage.jsx        # ★ 违规公示页
        ├── AdminPage.jsx
        ├── AdminThemePage.jsx        # ★ 主题管理页
        ├── AdminExamPage.jsx         # ★ 题库管理页
        └── NotFoundPage.jsx
```

---

## 六、路由设计（修订）

| 路径 | 页面 | 权限 | 说明 |
|------|------|------|------|
| `/` | `HomePage` | 公开 | 社区介绍 + 注册入口 |
| `/login` | `LoginPage` | 未登录 | |
| `/register` | `RegisterPage` | 未登录 | 含用户协议勾选 |
| `/rules` | `RulesPage` | 公开 | 社区公约全文 |
| `/violations` | `ViolationsPage` | 公开 | 违规公示板（仅展示 7 天内） |
| `/discussion` | `DiscussionPage` | 登录 | |
| `/discussion/:id` | `DiscussionDetailPage` | 登录 | |
| `/creation` | `CreationPage` | 登录 | |
| `/creation/:id` | `CreationDetailPage` | 登录 | |
| `/library` | `LibraryPage` | 登录 | ★ 设定图书馆主页 |
| `/library/:id` | `LibraryDetailPage` | 登录 | ★ 条目详情 |
| `/library/new` | `LibraryEditorPage` | 管理员 | ★ 添加条目 |
| `/library/submit` | `LibraryEditorPage` | 登录 | ★ 用户投稿 |
| `/user/:username` | `UserProfilePage` | 登录 | |
| `/admin` | `AdminPage` | 管理员 | 举报审核 |
| `/admin/theme` | `AdminThemePage` | 管理员 | 主题管理 |
| `/admin/exam` | `AdminExamPage` | 管理员 | ★ 题库管理（增删改题目） |
| `*` | `NotFoundPage` | 公开 | 404 |

---

## 七、tailwind.config.js 预设配色示例

```js
// tailwind.config.js
module.exports = {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // ★ 颜色（所有组件只引用这些语义名）
      colors: {
        primary: '#8B5CF6',      // 主色（紫）
        secondary: '#FDE68A',    // 辅色（暖黄）
        surface: '#FFFFFF',      // 卡片/组件底色
        muted: '#9CA3AF',        // 弱化文字
        accent: '#7C3AED',       // 强调色（深紫）
        danger: '#EF4444',       // 危险操作
        success: '#10B981',      // 成功状态
        warning: '#F59E0B',      // 警告状态
        info: '#3B82F6',         // 信息
        // 深色模式覆盖
        'primary-dark': '#A78BFA',
        'secondary-dark': '#FDE68A',
        'surface-dark': '#1F2937',
        // ...后续替换为手绘风格色板
      },
      // ★ 圆角
      borderRadius: {
        card: '12px',
        button: '8px',
        input: '6px',
      },
      // ★ 阴影
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.08)',
        elevated: '0 4px 16px rgba(0,0,0,0.12)',
      },
      // ★ 字体
      fontFamily: {
        display: ['"ZCOOL KuaiLe"', 'cursive'], // 标题字体（后续替换）
        body: ['"Noto Sans SC"', 'sans-serif'],  // 正文字体
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```

---

## 八、开发阶段规划（修订）

| 阶段 | 内容 | 文件数 |
|------|------|--------|
| **P0-1: 项目脚手架** | Vite + Tailwind + shadcn/ui + 路由框架 + Supabase 客户端 | ~15 |
| **P0-2: 认证系统** | 注册/登录/登出 + 入站考试（动态刷新题库）+ 用户协议 + AuthContext | ~15 |
| **P0-3: 讨论区** | 帖子 CRUD + Markdown + 评论 | ~12 |
| **P0-4: 创作区** | 创作发布 + 图片/视频上传 + 标签系统 + B站/YT 嵌入 | ~14 |
| **P0-5: 个人主页** | 资料展示/编辑 + 帖子/创作列表 | ~6 |
| **P0-6: 举报与审核** | 举报提交 + 管理后台 + 自动排序 + 违规公示 + 通知系统 | ~12 |
| **P0-7: 首页与公约** | 可编辑首页 + 社区公约页 + 违规公示页 | ~5 |
| **P1-1: 安全加固** | RLS + DOMPurify + Rate Limit | ~4 |
| **P1-2: 深色模式** | 全局 dark: 适配 + 主题切换 + ThemeContext | ~6 |
| **P1-3: UI 管理工具** | 主题编辑器 + 素材上传识别 + AI 主题生成 | ~8 |
| **P2: 未来功能** | 私信 + 热门排序 + AI 辅助审核 | ~10 |
| **合计** | | ~107 文件 |

---

## 九、决策清单（全部确认完毕）

| # | 决策项 | 结论 |
|---|--------|------|
| 1 | 域名/英文名 | ✅ ValkoValley.com / ValkoValley |
| 2 | 首页介绍页 | ✅ 介绍页 + 管理员可编辑 |
| 3 | 入站考试 | ✅ **v3 两阶段**：公约考试 ≥80% → 敖尹考试 ≥80%，题库管理员 CRUD |
| 4 | 用户协议 | ✅ 注册时勾选，公约文写入 `communityRules.js` + `/rules` 页面 |
| 5 | 标签体系 | ✅ 年龄分级必选 + 原创/二创必选 + 其余自定义 |
| 6 | 评论结构 | ✅ **扁平列表**（不做嵌套盖楼，适合初期社区规模） |
| 7 | 首页编辑 | ✅ **保留最近 2 个历史版本 + 草稿功能**（site_content 表 version 字段） |
| 8 | AI 主题生成 | ✅ **先留 UI 界面和 API 调用位**，API Key 你自己后面填 |
| 9 | 调色板功能 | ✅ **需要完整调色板建议**（互补色、类似色、分裂互补、三角色方案） |
| 10 | 违规公示板 | ✅ **对所有用户可见**（含未登录），**违规用户昵称+头像模糊打码** |
| 11 | 创建项目 | ⏳ 待你确认后，我输出 Supabase + Vercel 创建指引 |

---

## 十、下一步

所有决策已确认。你回复"开始"后，我将按以下顺序执行：

```
Phase 1: 项目脚手架 → 输出 Supabase/Vercel 创建指引 → 继续后续阶段
```

**确认无误后请回复"开始"，我即刻动手。**
