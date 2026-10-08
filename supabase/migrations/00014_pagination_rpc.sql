-- =====================================================
-- 列表分页与聚合 RPC：热度榜 / 搜索 服务端化
-- =====================================================
-- 背景：此前列表页全量拉取 posts/creations，并在前端对 likes/comments
--       全表 in 查询计算热度。数据增长后既慢又被 PostgREST 1000 行
--       上限静默截断。本迁移将热度计算与搜索下沉到数据库。
--
-- 注意：依赖下列「SQL Editor 手工添加」的列（schema drift 补全前
--       请勿在未执行这些 ALTER 的全新环境运行本迁移）：
--   posts:    hidden, hidden_reason, pending_review, category, is_pinned, image_urls
--   creations: hidden, hidden_reason, pending_review, content_type, is_ai, view_count
--   likes 表本身由本迁移补建（原为手工建表，这里一并纳管）

-- ====================
-- 1. likes 表纳管（原为手工建表，schema drift 补全）
-- ====================
CREATE TABLE IF NOT EXISTS public.likes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL,
  target_id   UUID NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_likes_target ON public.likes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_likes_user ON public.likes(user_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'likes_select_authenticated' AND tablename = 'likes') THEN
    CREATE POLICY "likes_select_authenticated" ON public.likes
      FOR SELECT TO authenticated USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'likes_insert_own' AND tablename = 'likes') THEN
    CREATE POLICY "likes_insert_own" ON public.likes
      FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'likes_delete_own' AND tablename = 'likes') THEN
    CREATE POLICY "likes_delete_own" ON public.likes
      FOR DELETE TO authenticated USING (auth.uid() = user_id);
  END IF;
END;
$$;

-- ====================
-- 2. 帖子热度榜：服务端计算 (点赞+评论)/年龄，置顶优先
-- ====================
CREATE OR REPLACE FUNCTION public.get_hot_posts(p_limit integer DEFAULT 50)
RETURNS TABLE (post jsonb, author jsonb, score double precision)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT to_jsonb(p) AS post,
         jsonb_build_object(
           'username', pr.username,
           'display_name', pr.display_name,
           'avatar_url', pr.avatar_url
         ) AS author,
         (
           (SELECT count(*) FROM public.comments c WHERE c.post_id = p.id AND NOT c.is_deleted)::float8
         + (SELECT count(*) FROM public.likes l WHERE l.target_type = 'post' AND l.target_id = p.id)::float8
         ) / greatest(extract(epoch FROM (now() - p.created_at)) / 3600, 0.1) AS score
  FROM public.posts p
  JOIN public.profiles pr ON pr.id = p.author_id
  WHERE NOT p.is_deleted AND NOT COALESCE(p.hidden, false)
  ORDER BY p.is_pinned DESC, 3 DESC, p.created_at DESC
  LIMIT p_limit;
$$;

-- ====================
-- 3. 帖子搜索：标题 / 作者昵称 / 用户名（参数化 ILIKE，无注入面）
-- ====================
CREATE OR REPLACE FUNCTION public.search_posts(p_query text, p_limit integer DEFAULT 50)
RETURNS TABLE (post jsonb, author jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT to_jsonb(p) AS post,
         jsonb_build_object(
           'username', pr.username,
           'display_name', pr.display_name,
           'avatar_url', pr.avatar_url
         ) AS author
  FROM public.posts p
  JOIN public.profiles pr ON pr.id = p.author_id
  WHERE NOT p.is_deleted AND NOT COALESCE(p.hidden, false)
    AND (
      p.title ILIKE '%' || p_query || '%'
      OR pr.display_name ILIKE '%' || p_query || '%'
      OR pr.username ILIKE '%' || p_query || '%'
    )
  ORDER BY p.created_at DESC
  LIMIT p_limit;
$$;

-- ====================
-- 4. 创作热度榜：(点赞+阅读)/年龄
-- ====================
CREATE OR REPLACE FUNCTION public.get_hot_creations(
  p_limit integer DEFAULT 50,
  p_content_type text DEFAULT 'all',
  p_hide_ai boolean DEFAULT false
)
RETURNS TABLE (creation jsonb, author jsonb, score double precision)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT to_jsonb(c) AS creation,
         jsonb_build_object(
           'username', pr.username,
           'display_name', pr.display_name,
           'avatar_url', pr.avatar_url
         ) AS author,
         (
           (SELECT count(*) FROM public.likes l WHERE l.target_type = 'creation' AND l.target_id = c.id)::float8
         + COALESCE(c.view_count, 0)::float8
         ) / greatest(extract(epoch FROM (now() - c.created_at)) / 3600, 0.1) AS score
  FROM public.creations c
  JOIN public.profiles pr ON pr.id = c.author_id
  WHERE NOT c.is_deleted AND NOT COALESCE(c.hidden, false)
    AND (p_content_type = 'all' OR c.content_type = p_content_type)
    AND (NOT p_hide_ai OR NOT COALESCE(c.is_ai, false))
  ORDER BY 3 DESC, c.created_at DESC
  LIMIT p_limit;
$$;

-- ====================
-- 5. 创作搜索：标题 / 作者 / 标签数组
-- ====================
CREATE OR REPLACE FUNCTION public.search_creations(
  p_query text,
  p_limit integer DEFAULT 50,
  p_content_type text DEFAULT 'all',
  p_hide_ai boolean DEFAULT false
)
RETURNS TABLE (creation jsonb, author jsonb)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT to_jsonb(c) AS creation,
         jsonb_build_object(
           'username', pr.username,
           'display_name', pr.display_name,
           'avatar_url', pr.avatar_url
         ) AS author
  FROM public.creations c
  JOIN public.profiles pr ON pr.id = c.author_id
  WHERE NOT c.is_deleted AND NOT COALESCE(c.hidden, false)
    AND (p_content_type = 'all' OR c.content_type = p_content_type)
    AND (NOT p_hide_ai OR NOT COALESCE(c.is_ai, false))
    AND (
      c.title ILIKE '%' || p_query || '%'
      OR pr.display_name ILIKE '%' || p_query || '%'
      OR pr.username ILIKE '%' || p_query || '%'
      OR EXISTS (SELECT 1 FROM unnest(c.tags) AS t WHERE t ILIKE '%' || p_query || '%')
    )
  ORDER BY c.created_at DESC
  LIMIT p_limit;
$$;
