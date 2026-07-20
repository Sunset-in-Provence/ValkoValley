-- =====================================================
-- 修复档案馆卡片排序（限制同分类内交换 + 处理 NULL sort_order）
-- =====================================================
CREATE OR REPLACE FUNCTION move_library_entry(_id UUID, _direction INT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  _entry RECORD;
  _other RECORD;
BEGIN
  -- 取当前条目
  SELECT id, sort_order, category FROM public.library_entries WHERE id = _id INTO _entry;
  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- NULL 初始化为 0
  IF _entry.sort_order IS NULL THEN
    UPDATE public.library_entries SET sort_order = 0 WHERE id = _id;
    _entry.sort_order := 0;
  END IF;

  -- 在同一分类内找相邻条目（sort_order 升序，越小越靠前）
  IF _direction < 0 THEN
    -- 上移：找排在前面的（sort_order 更小）
    SELECT id, sort_order FROM public.library_entries
    WHERE category = _entry.category
      AND id != _id
      AND sort_order < _entry.sort_order
    ORDER BY sort_order DESC LIMIT 1
    INTO _other;
  ELSE
    -- 下移：找排在后面的（sort_order 更大）
    SELECT id, sort_order FROM public.library_entries
    WHERE category = _entry.category
      AND id != _id
      AND sort_order > _entry.sort_order
    ORDER BY sort_order ASC LIMIT 1
    INTO _other;
  END IF;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- 交换 sort_order
  UPDATE public.library_entries SET sort_order = _other.sort_order WHERE id = _id;
  UPDATE public.library_entries SET sort_order = _entry.sort_order WHERE id = _other.id;

  RETURN TRUE;
END;
$$;
