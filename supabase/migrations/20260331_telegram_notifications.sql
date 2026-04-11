-- Функция для отправки уведомления в Telegram через Edge Function
CREATE OR REPLACE FUNCTION notify_telegram_service()
RETURNS trigger AS $$
DECLARE
  supabase_url TEXT;
  service_role_key TEXT;
BEGIN
  -- Пытаемся получить настройки из БД
  supabase_url := current_setting('app.settings.supabase_url', true);
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Если настройки заданы, отправляем запрос
  IF supabase_url IS NOT NULL AND service_role_key IS NOT NULL THEN
    PERFORM
      net.http_post(
        url := supabase_url || '/functions/v1/telegram-bot',
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

-- Активируем триггер для Telegram
DROP TRIGGER IF EXISTS on_notification_telegram ON user_notifications;
CREATE TRIGGER on_notification_telegram
  AFTER INSERT ON user_notifications
  FOR EACH ROW EXECUTE PROCEDURE notify_telegram_service();
