-- =====================================================
-- 收藏功能：帖子 + 创作
-- =====================================================

-- 1. 收藏表
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(10) NOT NULL CHECK (target_type IN ('post', 'creation')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- RLS：用户只能读写自己的收藏
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bookmarks_select_own" ON public.bookmarks
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "bookmarks_insert_own" ON public.bookmarks
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "bookmarks_delete_own" ON public.bookmarks
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 公开收藏夹查看策略（只有开启公开的用户才能被他人看到）
CREATE POLICY "bookmarks_select_public" ON public.bookmarks
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles WHERE id = bookmarks.user_id AND bookmarks_public = true
  ));

-- 2. 用户收藏夹公开开关
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bookmarks_public BOOLEAN DEFAULT false;
