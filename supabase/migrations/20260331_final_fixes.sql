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
-- Мы будем использовать более надежный способ вызова Edge Function
CREATE OR REPLACE FUNCTION notify_push_service()
RETURNS trigger AS $$
DECLARE
  project_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Пытаемся получить URL и ключ из настроек, если они там есть
  -- Если нет - используем дефолтные (пользователю нужно будет их настроить в Supabase Dashboard)
  -- Или можно прописать их здесь явно для надежности
  project_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  IF project_url IS NOT NULL AND service_role_key IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := project_url || '/functions/v1/send-push',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || service_role_key
        ),
        body := jsonb_build_object('record', row_to_json(NEW))::text
      );
  END IF;
  
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
