-- 给 changelog type 约束添加 'remove'
DO $$
DECLARE
  _cname TEXT;
BEGIN
  SELECT conname INTO _cname FROM pg_constraint
    WHERE conrelid = 'public.changelog'::regclass AND contype = 'c';
  IF _cname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.changelog DROP CONSTRAINT %I', _cname);
  END IF;
  EXECUTE 'ALTER TABLE public.changelog ADD CONSTRAINT changelog_type_check CHECK (type IN (''feat'', ''fix'', ''remove''))';
END;
$$;
