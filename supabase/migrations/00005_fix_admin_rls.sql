-- =====================================================
-- 修复：管理员 WAL 更新权限（隐藏 / 置顶 / 等）
-- =====================================================

-- 1. 修正 is_admin() 函数 — 之前只判断 profile 存在且未被封禁，
--    等同于 "任何普通用户都是管理员"，导致 RLS 策略从未起作用。
--    现在正确检查 admin_emails 表。
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
DECLARE
  _email TEXT;
BEGIN
  SELECT email FROM auth.users WHERE id = auth.uid() INTO _email;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = _email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 管理员可更新任何帖子（隐藏、置顶等操作）
--    原策略 posts_update_own 只允许作者本人更新，管理员点隐藏会被 RLS 静默拦截。
--    IF NOT EXISTS 避免重复创建（兼容已有迁移）。
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'posts_update_admin' AND tablename = 'posts'
  ) THEN
    CREATE POLICY "posts_update_admin" ON public.posts
      FOR UPDATE TO authenticated USING (public.is_admin());
  END IF;
END;
$$;

-- 3. 管理员可更新任何创作（隐藏操作）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'creations_update_admin' AND tablename = 'creations'
  ) THEN
    CREATE POLICY "creations_update_admin" ON public.creations
      FOR UPDATE TO authenticated USING (public.is_admin());
  END IF;
END;
$$;
