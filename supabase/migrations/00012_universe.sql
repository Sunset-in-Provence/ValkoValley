-- =====================================================
-- ValkoValley 敖尹宇宙共创企划 — 数据库 Schema + RLS
-- =====================================================

-- ====================
-- 1. 星纪表
-- ====================
CREATE TABLE IF NOT EXISTS public.universe_seasons (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  theme         TEXT NOT NULL,
  description   TEXT,
  color_hex     TEXT NOT NULL DEFAULT '#5DAF7C',
  status        TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'active', 'archived')),
  start_date    TIMESTAMPTZ,
  end_date      TIMESTAMPTZ,
  display_order INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- 2. 投稿表
-- ====================
CREATE TABLE IF NOT EXISTS public.universe_entries (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id     UUID NOT NULL REFERENCES public.universe_seasons(id) ON DELETE CASCADE,
  author_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  cover_url     TEXT,
  content_type  TEXT NOT NULL DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video')),
  build_type    TEXT NOT NULL DEFAULT 'canon' CHECK (build_type IN ('canon', 'if')),
  status        TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'hidden')),
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- 3. 协作者表
-- ====================
CREATE TABLE IF NOT EXISTS public.universe_collaborators (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id      UUID NOT NULL REFERENCES public.universe_entries(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('editor', 'viewer')),
  invited_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(entry_id, user_id)
);

-- ====================
-- 4. 投票选项表
-- ====================
CREATE TABLE IF NOT EXISTS public.universe_vote_options (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id     UUID NOT NULL REFERENCES public.universe_seasons(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  description   TEXT,
  submitted_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  is_auto       BOOLEAN DEFAULT FALSE,
  vote_count    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- 5. 票仓表（当天来领，不用攒着，没来不给）
-- ====================
CREATE TABLE IF NOT EXISTS public.universe_vote_wallets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id     UUID NOT NULL REFERENCES public.universe_seasons(id) ON DELETE CASCADE,
  balance       INTEGER NOT NULL DEFAULT 0,
  last_claim_at DATE,
  UNIQUE(user_id, season_id)
);

-- ====================
-- 6. 投票记录表
-- ====================
CREATE TABLE IF NOT EXISTS public.universe_votes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  option_id     UUID NOT NULL REFERENCES public.universe_vote_options(id) ON DELETE CASCADE,
  amount        INTEGER NOT NULL DEFAULT 1,
  voted_at      TIMESTAMPTZ DEFAULT now()
);

-- ====================
-- 索引
-- ====================
CREATE INDEX IF NOT EXISTS idx_universe_entries_season ON public.universe_entries(season_id);
CREATE INDEX IF NOT EXISTS idx_universe_entries_author ON public.universe_entries(author_id);
CREATE INDEX IF NOT EXISTS idx_universe_votes_user ON public.universe_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_universe_votes_option ON public.universe_votes(option_id);
CREATE INDEX IF NOT EXISTS idx_universe_vote_options_season ON public.universe_vote_options(season_id);

-- ====================
-- RLS 策略
-- ====================

-- 辅助函数：判断当前用户是否为管理员
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _email text;
BEGIN
  _email := (SELECT email FROM auth.users WHERE id = auth.uid());
  IF _email IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.admin_emails WHERE email = LOWER(_email)
  );
END;
$$;

-- === universe_seasons RLS ===
ALTER TABLE public.universe_seasons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人可查看星纪" ON public.universe_seasons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "管理员可管理星纪" ON public.universe_seasons
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === universe_entries RLS ===
ALTER TABLE public.universe_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人可查看已发布投稿" ON public.universe_entries
  FOR SELECT TO authenticated USING (status = 'published');

CREATE POLICY "作者可管理自己的投稿" ON public.universe_entries
  FOR ALL TO authenticated
  USING (author_id = auth.uid())
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "管理员可管理所有投稿" ON public.universe_entries
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === universe_collaborators RLS ===
ALTER TABLE public.universe_collaborators ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人可查看协作者" ON public.universe_collaborators
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "投稿作者可管理协作者" ON public.universe_collaborators
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.universe_entries WHERE id = entry_id AND author_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.universe_entries WHERE id = entry_id AND author_id = auth.uid()
  ));

-- === universe_vote_options RLS ===
ALTER TABLE public.universe_vote_options ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人可查看投票选项" ON public.universe_vote_options
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "管理员可管理投票选项" ON public.universe_vote_options
  FOR ALL TO authenticated USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- === universe_vote_wallets RLS ===
ALTER TABLE public.universe_vote_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看自己的票仓" ON public.universe_vote_wallets
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "用户可领取自己的票" ON public.universe_vote_wallets
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "管理员可查看所有票仓" ON public.universe_vote_wallets
  FOR SELECT TO authenticated USING (public.is_admin());

-- === universe_votes RLS ===
ALTER TABLE public.universe_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "任何人可查看投票记录" ON public.universe_votes
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "用户可投票" ON public.universe_votes
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- ====================
-- RPC: 领取每日票（幂等：同一天多次调用只领一次）
-- ====================
CREATE OR REPLACE FUNCTION public.claim_daily_votes(p_season_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _user_id  uuid;
  _today    date;
  _wallet   record;
  _daily    integer := 2; -- 每日票数
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION '未登录';
  END IF;

  _today := CURRENT_DATE;

  -- 查或建票仓
  SELECT * INTO _wallet FROM public.universe_vote_wallets
    WHERE user_id = _user_id AND season_id = p_season_id;

  IF NOT FOUND THEN
    INSERT INTO public.universe_vote_wallets (user_id, season_id, balance, last_claim_at)
      VALUES (_user_id, p_season_id, _daily, _today)
      RETURNING * INTO _wallet;
  ELSIF _wallet.last_claim_at IS NULL OR _wallet.last_claim_at < _today THEN
    UPDATE public.universe_vote_wallets
      SET balance = balance + _daily, last_claim_at = _today
      WHERE id = _wallet.id
      RETURNING * INTO _wallet;
  END IF;

  RETURN _wallet.balance;
END;
$$;

-- ====================
-- RPC: 投票（检查余额 + 原子扣减）
-- ====================
CREATE OR REPLACE FUNCTION public.cast_universe_vote(p_option_id uuid, p_amount integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _user_id   uuid;
  _season_id uuid;
  _wallet    record;
  _balance   integer;
BEGIN
  _user_id := auth.uid();
  IF _user_id IS NULL THEN
    RAISE EXCEPTION '未登录';
  END IF;

  IF p_amount <= 0 THEN
    RAISE EXCEPTION '投票数必须大于 0';
  END IF;

  -- 获取选项所属星纪
  SELECT season_id INTO _season_id FROM public.universe_vote_options WHERE id = p_option_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION '投票选项不存在';
  END IF;

  -- 检查票仓余额
  SELECT * INTO _wallet FROM public.universe_vote_wallets
    WHERE user_id = _user_id AND season_id = _season_id;

  IF NOT FOUND OR _wallet.balance < p_amount THEN
    RAISE EXCEPTION '票数不足';
  END IF;

  -- 原子操作：扣余额 + 记投票 + 更新选项票数
  UPDATE public.universe_vote_wallets
    SET balance = balance - p_amount
    WHERE id = _wallet.id;

  INSERT INTO public.universe_votes (user_id, option_id, amount)
    VALUES (_user_id, p_option_id, p_amount);

  UPDATE public.universe_vote_options
    SET vote_count = vote_count + p_amount
    WHERE id = p_option_id;

  SELECT balance INTO _balance FROM public.universe_vote_wallets WHERE id = _wallet.id;
  RETURN _balance;
END;
$$;
