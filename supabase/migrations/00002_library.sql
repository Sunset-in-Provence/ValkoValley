-- =====================================================
-- ValkoValley 设定图书馆
-- =====================================================

-- ====================
-- 图书馆条目表
-- ====================
CREATE TABLE IF NOT EXISTS public.library_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,                          -- Markdown 正文
  cover_url TEXT,                                 -- 封面图
  category VARCHAR(30) NOT NULL CHECK (category IN (
    'character',    -- 角色设定
    'worldview',    -- 世界观
    'timeline',     -- 剧情年表
    'gallery',      -- 官方图鉴
    'music',        -- 音乐/OST
    'other'         -- 其他
  )),
  status VARCHAR(20) DEFAULT 'pending_review' CHECK (status IN (
    'published',
    'pending_review',
    'draft'
  )),
  -- 对于管理员直接发布：status = 'published'
  -- 对于用户投稿：status = 'pending_review'，需管理员审核
  image_urls TEXT[] DEFAULT '{}',                 -- 图片附件
  video_urls TEXT[] DEFAULT '{}',                 -- 视频附件
  tags TEXT[] DEFAULT '{}',                       -- 标签（搜索用）
  is_pinned BOOLEAN DEFAULT false,                -- 管理员置顶
  view_count INT DEFAULT 0,                       -- 阅读量
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ
);

-- ====================
-- RLS 策略
-- ====================
ALTER TABLE public.library_entries ENABLE ROW LEVEL SECURITY;

-- 认证用户可读已发布的条目
CREATE POLICY "library_select_published" ON public.library_entries
  FOR SELECT TO authenticated
  USING (status = 'published');

-- 管理员可读所有状态的条目（在审核列表中使用）
-- 通过 is_admin() 函数判断

-- 认证用户可投稿（状态为 pending_review）
CREATE POLICY "library_insert_authenticated" ON public.library_entries
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id AND
    status = 'pending_review' AND
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_banned = false)
  );

-- 用户可编辑自己投稿中/草稿的条目
CREATE POLICY "library_update_own" ON public.library_entries
  FOR UPDATE TO authenticated
  USING (auth.uid() = author_id AND status IN ('pending_review', 'draft'))
  WITH CHECK (auth.uid() = author_id AND status IN ('pending_review', 'draft'));

-- ====================
-- 索引
-- ====================
CREATE INDEX IF NOT EXISTS idx_library_category ON public.library_entries(category);
CREATE INDEX IF NOT EXISTS idx_library_status ON public.library_entries(status);
CREATE INDEX IF NOT EXISTS idx_library_pinned ON public.library_entries(is_pinned);
CREATE INDEX IF NOT EXISTS idx_library_tags ON public.library_entries USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_library_created ON public.library_entries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_library_views ON public.library_entries(view_count DESC);
