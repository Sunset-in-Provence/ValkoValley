-- =====================================================
-- AI 标签功能：创作区 AI 标记 + 用户屏蔽 AI 选项
-- =====================================================

-- 1. 创作表加 is_ai 标记
ALTER TABLE public.creations ADD COLUMN IF NOT EXISTS is_ai BOOLEAN DEFAULT false;

-- 2. 用户表加 hide_ai 偏好设置
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_ai BOOLEAN DEFAULT false;
