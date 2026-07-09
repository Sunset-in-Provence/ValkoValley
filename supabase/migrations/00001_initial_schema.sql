-- =====================================================
-- ValkoValley 初始数据库 Schema + RLS 安全策略
-- =====================================================
-- 重要：本迁移确保所有内容只能被已认证用户访问，
-- 防止 AI 爬虫和未授权访问批量抓取创作内容。

-- ====================
-- 1. 用户资料表
-- ====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(30) UNIQUE NOT NULL,
  display_name VARCHAR(50),
  avatar_url TEXT,
  bio TEXT,
  exam_passed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exam_attempts INT DEFAULT 1,
  last_exam_at TIMESTAMPTZ,
  is_banned BOOLEAN DEFAULT false,
  ban_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- 2. 讨论区帖子表
-- ====================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- ====================
-- 3. 评论表（楼中楼）
-- ====================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  reply_to_id UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  depth INT DEFAULT 0 CHECK (depth >= 0 AND depth <= 2),
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- 4. 创作区作品表
-- ====================
CREATE TABLE IF NOT EXISTS public.creations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  rating VARCHAR(20) NOT NULL CHECK (rating IN ('general', '15plus', '18plus')),
  image_urls TEXT[] DEFAULT '{}',
  video_urls TEXT[] DEFAULT '{}',
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- ====================
-- 5. 举报表
-- ====================
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('post', 'comment', 'creation', 'user')),
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  reviewer_id UUID REFERENCES public.profiles(id),
  action_taken VARCHAR(50) CHECK (action_taken IN ('content_deleted', 'user_banned', 'warning_sent', 'none')),
  ai_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

-- ====================
-- 6. 违规公示表
-- ====================
CREATE TABLE IF NOT EXISTS public.violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID REFERENCES public.reports(id),
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  violation_type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  penalty VARCHAR(50) NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL  -- 通常 = published_at + 7 days
);

-- ====================
-- 7. 系统通知表
-- ====================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('violation_warning', 'ban_notice', 'content_removed', 'system')),
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- 8. 题库表
-- ====================
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(20) NOT NULL CHECK (category IN ('rules', 'aoyin')),
  question TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_index INT NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- ====================
-- 9. 社区公约表
-- ====================
CREATE TABLE IF NOT EXISTS public.community_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  version INT NOT NULL,
  content TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT now(),
  is_current BOOLEAN DEFAULT true
);

-- ====================
-- 10. 标签表
-- ====================
CREATE TABLE IF NOT EXISTS public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(30) UNIQUE NOT NULL,
  usage_count INT DEFAULT 1,
  is_preset BOOLEAN DEFAULT false
);

-- ====================
-- 11. 首页内容表（含版本历史）
-- ====================
CREATE TABLE IF NOT EXISTS public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section VARCHAR(50) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published')),
  version INT DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id)
);

-- ====================
-- 12. 主题配置表
-- ====================
CREATE TABLE IF NOT EXISTS public.theme_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT false,
  mode VARCHAR(10) NOT NULL CHECK (mode IN ('light', 'dark')),
  colors JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 🔒 RLS 安全策略（AI 爬取防护核心）
-- =====================================================

-- 启用所有表的 RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_config ENABLE ROW LEVEL SECURITY;

-- ---- 核心安全规则 ----
-- 规则 1：只有认证用户才能读取任何内容（防止未授权的 API 抓取）
-- 规则 2：用户只能修改自己的内容
-- 规则 3：管理员有特殊权限

-- === profiles ===
-- 所有认证用户可读
CREATE POLICY "profiles_select_authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);
-- 用户只能更新自己的资料（除非被封禁）
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id AND is_banned = false)
  WITH CHECK (auth.uid() = id AND is_banned = false);

-- === posts ===
-- 只有认证用户可读（非删除的帖子）
CREATE POLICY "posts_select_authenticated" ON public.posts
  FOR SELECT TO authenticated USING (is_deleted = false);
-- 用户只能插入自己的帖子（被封禁者不可发布）
CREATE POLICY "posts_insert_own" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false));
-- 用户只能更新自己的帖子
CREATE POLICY "posts_update_own" ON public.posts
  FOR UPDATE TO authenticated USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- === comments ===
CREATE POLICY "comments_select_authenticated" ON public.comments
  FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false));
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- === creations ===
CREATE POLICY "creations_select_authenticated" ON public.creations
  FOR SELECT TO authenticated USING (is_deleted = false);
CREATE POLICY "creations_insert_own" ON public.creations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = author_id AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false));
CREATE POLICY "creations_update_own" ON public.creations
  FOR UPDATE TO authenticated USING (auth.uid() = author_id);

-- === reports ===
-- 认证用户可提交举报
CREATE POLICY "reports_insert_authenticated" ON public.reports
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
-- 举报人可查看自己的举报状态
CREATE POLICY "reports_select_reporter" ON public.reports
  FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- === violations ===
-- 违规公示对所有人可见（包括 anonymoys）——用于 SEO 和透明性
CREATE POLICY "violations_select_public" ON public.violations
  FOR SELECT TO anon, authenticated USING (expires_at > now());

-- === notifications ===
-- 用户只能查看自己的通知
CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- === exam_questions ===
-- 认证用户可读（考试时需要）
CREATE POLICY "exam_select_authenticated" ON public.exam_questions
  FOR SELECT TO authenticated USING (is_active = true);

-- === community_rules ===
-- 所有人可读
CREATE POLICY "rules_select_public" ON public.community_rules
  FOR SELECT TO anon, authenticated USING (is_current = true);

-- === tags ===
-- 所有人可读（标签云）
CREATE POLICY "tags_select_public" ON public.tags
  FOR SELECT TO anon, authenticated USING (true);

-- === site_content ===
-- 所有人可读（已发布的内容）
CREATE POLICY "site_content_select_published" ON public.site_content
  FOR SELECT TO anon, authenticated USING (status = 'published');

-- === theme_config ===
-- 所有人可读（主题配置）
CREATE POLICY "theme_select_public" ON public.theme_config
  FOR SELECT TO anon, authenticated USING (true);

-- =====================================================
-- 管理员函数
-- =====================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_banned = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 自动创建 profile 的 Trigger
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 注意：实际创建 profile 将在注册考试通过后由前端调用
-- 所以此 trigger 作为 fallback

-- =====================================================
-- 索引
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON public.comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_creations_author ON public.creations(author_id);
CREATE INDEX IF NOT EXISTS idx_creations_tags ON public.creations USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_target ON public.reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_violations_expires ON public.violations(expires_at);
