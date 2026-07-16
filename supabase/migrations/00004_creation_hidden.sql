-- ====================
-- 给创作区作品表添加管理员隐藏功能
-- ====================
ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS hidden BOOLEAN DEFAULT false;
ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS hidden_reason TEXT;
