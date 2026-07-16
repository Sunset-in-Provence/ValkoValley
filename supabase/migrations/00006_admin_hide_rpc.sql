-- =====================================================
-- 管理员隐藏 RPC（SECURITY DEFINER 绕过 RLS）
-- =====================================================

-- 隐藏/取消隐藏帖子
CREATE OR REPLACE FUNCTION admin_hide_post(
  _post_id UUID,
  _hidden BOOLEAN,
  _reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _email TEXT;
BEGIN
  -- 从 auth.users 取当前用户邮箱
  SELECT email FROM auth.users WHERE id = auth.uid() INTO _email;
  -- 检查是否为管理员（大小写不敏感）
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_emails WHERE LOWER(email) = LOWER(_email)
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.posts
  SET hidden = _hidden,
      hidden_reason = CASE WHEN _hidden = TRUE THEN _reason ELSE NULL END,
      pending_review = CASE WHEN _hidden = FALSE THEN FALSE ELSE pending_review END
  WHERE id = _post_id;
  RETURN FOUND;
END;
$$;

-- 隐藏/取消隐藏创作
CREATE OR REPLACE FUNCTION admin_hide_creation(
  _creation_id UUID,
  _hidden BOOLEAN,
  _reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _email TEXT;
BEGIN
  SELECT email FROM auth.users WHERE id = auth.uid() INTO _email;
  IF NOT EXISTS (
    SELECT 1 FROM public.admin_emails WHERE LOWER(email) = LOWER(_email)
  ) THEN
    RETURN FALSE;
  END IF;

  UPDATE public.creations
  SET hidden = _hidden,
      hidden_reason = CASE WHEN _hidden = TRUE THEN _reason ELSE NULL END,
      pending_review = CASE WHEN _hidden = FALSE THEN FALSE ELSE pending_review END
  WHERE id = _creation_id;
  RETURN FOUND;
END;
$$;
