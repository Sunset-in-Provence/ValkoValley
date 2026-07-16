-- ====================
-- 邮箱查重 RPC（绕过 RLS 查询 auth.users）
-- ====================
CREATE OR REPLACE FUNCTION check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_to_check
  );
END;
$$;
