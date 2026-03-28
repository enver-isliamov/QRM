-- F1.3: Ограничить admin_stats VIEW только для admin
-- Мы пересоздаем VIEW с условием WHERE EXISTS, которое проверяет роль пользователя
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM help_requests) as total_help_requests,
    (SELECT COUNT(*) FROM meetings) as total_meetings,
    (SELECT COUNT(*) FROM ethno_events) as total_events
WHERE EXISTS (
  SELECT 1 FROM profiles 
  WHERE id = auth.uid() AND role = 'admin'
);

-- F1.4: audit_logs — безопасная запись через функцию
-- 1. Создаем функцию для логирования
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем, является ли вызывающий админом
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can log actions';
  END IF;

  INSERT INTO audit_logs (admin_id, action, target_type, target_id)
  VALUES (auth.uid(), p_action, p_target_type, p_target_id);
END;
$$;

-- 2. Убеждаемся, что RLS на audit_logs запрещает прямую вставку пользователям
-- (Если нет политики INSERT, то вставка запрещена по умолчанию при включенном RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can insert audit logs" ON audit_logs;
-- Мы НЕ создаем политику INSERT, чтобы пользователи не могли писать напрямую.
-- Функция SECURITY DEFINER будет работать, так как она игнорирует RLS.
