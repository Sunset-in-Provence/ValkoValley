-- =====================================================
-- 安全加固：邮箱枚举防护 + IP 限流基础设施
-- =====================================================
-- 问题：check_email_exists 是 SECURITY DEFINER 函数，默认向所有角色
--       （含未登录 anon）开放 EXECUTE，且不检查 auth.uid()。
--       任何人可用公开 anon key 无限调用，枚举任意邮箱是否已注册。
--
-- 方案：注册页需要在注册前（未登录）查询邮箱占用情况，不能简单
--       REVOKE anon。改为「按客户端真实 IP 限流」——每小时最多 10 次，
--       超限静默返回 false。攻击者枚举成本被抬高两个数量级。

-- ====================
-- 1. 限流桶表（仅供 RPC 内部使用，不创建任何客户端策略）
-- ====================
CREATE TABLE IF NOT EXISTS public.rate_limit_buckets (
  bucket       TEXT NOT NULL,
  key          TEXT NOT NULL,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (bucket, key)
);

ALTER TABLE public.rate_limit_buckets ENABLE ROW LEVEL SECURITY;
-- 不创建任何 SELECT/INSERT/UPDATE 策略：
-- 仅 SECURITY DEFINER 函数（以 owner 身份运行）可读写此表。

-- ====================
-- 2. 加固 check_email_exists
-- ====================
CREATE OR REPLACE FUNCTION public.check_email_exists(email_to_check TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _ip           TEXT;
  _max_per_hour INTEGER := 10;
  _rec          RECORD;
BEGIN
  -- 邮箱格式校验，防止把函数当探测工具乱扫
  IF email_to_check IS NULL
     OR email_to_check !~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' THEN
    RETURN false;
  END IF;

  -- 取真实客户端 IP（cf-connecting-ip 由 Cloudflare 边缘注入，终端用户无法伪造；
  -- 本地/无头环境下 request.headers 不存在，回退到共享桶 'unknown'）
  BEGIN
    _ip := COALESCE(
      current_setting('request.headers', true)::json ->> 'cf-connecting-ip',
      current_setting('request.headers', true)::json ->> 'x-real-ip',
      'unknown'
    );
  EXCEPTION WHEN OTHERS THEN
    _ip := 'unknown';
  END IF;

  -- 行锁：并发调用下计数不被绕过（首次并发插入的竞态最多多计一次，可接受）
  SELECT * INTO _rec FROM public.rate_limit_buckets
    WHERE bucket = 'email_check' AND key = _ip
    FOR UPDATE;

  IF _rec.window_start IS NULL OR _rec.window_start < now() - interval '1 hour' THEN
    IF _rec.window_start IS NULL THEN
      INSERT INTO public.rate_limit_buckets (bucket, key, count, window_start)
        VALUES ('email_check', _ip, 1, now());
    ELSE
      UPDATE public.rate_limit_buckets
        SET count = 1, window_start = now()
        WHERE bucket = 'email_check' AND key = _ip;
    END IF;
  ELSIF _rec.count >= _max_per_hour THEN
    RETURN false; -- 超限：静默返回"未注册"，不泄露限流机制
  ELSE
    UPDATE public.rate_limit_buckets
      SET count = count + 1
      WHERE bucket = 'email_check' AND key = _ip;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM auth.users WHERE email = lower(email_to_check)
  );
END;
$$;
