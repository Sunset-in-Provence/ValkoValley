-- =====================================================
-- 通知所有管理员 RPC + posts/creations pending_review 列
-- =====================================================

-- 1. 通知所有管理员
CREATE OR REPLACE FUNCTION notify_admins(_title TEXT, _content TEXT, _link TEXT DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _admin RECORD;
BEGIN
  FOR _admin IN
    SELECT ae.email, p.id as user_id
    FROM public.admin_emails ae
    JOIN auth.users au ON LOWER(au.email) = LOWER(ae.email)
    LEFT JOIN public.profiles p ON p.id = au.id
  LOOP
    IF _admin.user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, content, link, is_read, created_at)
      VALUES (_admin.user_id, _title, _content, _link, FALSE, now());
    END IF;
  END LOOP;
END;
$$;

-- 2. posts 表加 pending_review
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS pending_review BOOLEAN DEFAULT false;

-- 3. creations 表加 pending_review
ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS pending_review BOOLEAN DEFAULT false;
