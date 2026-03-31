-- 1. Гарантируем наличие таблицы prayer_completions (для зеленых галочек)
CREATE TABLE IF NOT EXISTS prayer_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    prayer_key TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date, prayer_key)
);

-- 2. Включаем RLS для prayer_completions
ALTER TABLE prayer_completions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own prayer completions" ON prayer_completions;
CREATE POLICY "Users can see their own prayer completions" ON prayer_completions 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own prayer completions" ON prayer_completions;
CREATE POLICY "Users can insert their own prayer completions" ON prayer_completions 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own prayer completions" ON prayer_completions;
CREATE POLICY "Users can delete their own prayer completions" ON prayer_completions 
FOR DELETE USING (auth.uid() = user_id);

-- 3. Исправляем функцию отправки Push-уведомлений
-- Мы вставляем URL и Ключ напрямую, чтобы избежать ошибок прав доступа (permission denied)
CREATE OR REPLACE FUNCTION notify_push_service()
RETURNS trigger AS $$
BEGIN
  -- ВАЖНО: Замените значения ниже на ваши реальные данные из Settings -> API
  PERFORM
    net.http_post(
      url := 'https://ВАШ_ID.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ВАШ_SERVICE_ROLE_KEY'
      ),
      body := jsonb_build_object('record', row_to_json(NEW))::text
    );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Активируем триггер
DROP TRIGGER IF EXISTS on_notification_push ON user_notifications;
CREATE TRIGGER on_notification_push
  AFTER INSERT ON user_notifications
  FOR EACH ROW EXECUTE PROCEDURE notify_push_service();

-- 5. Инструкция для пользователя (выполнить в SQL Editor):
-- ALTER DATABASE postgres SET "app.settings.supabase_url" = 'https://ВАШ_ID.supabase.co';
-- ALTER DATABASE postgres SET "app.settings.service_role_key" = 'ВАШ_SERVICE_ROLE_KEY';
