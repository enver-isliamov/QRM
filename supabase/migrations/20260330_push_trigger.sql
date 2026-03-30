-- ЭТАП D3.6: Триггер для вызова Edge Function при новом уведомлении
-- Примечание: Для работы этого триггера должна быть развернута Edge Function 'send-push'

CREATE OR REPLACE FUNCTION notify_push_service()
RETURNS trigger AS $$
BEGIN
  -- Вызываем Edge Function через HTTP POST
  -- Замените cksqnhldbrvbmdwtjefq на ваш реальный ID проекта, если он отличается
  PERFORM
    net.http_post(
      url := 'https://cksqnhldbrvbmdwtjefq.supabase.co/functions/v1/send-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true) -- Или передайте ключ явно
      ),
      body := jsonb_build_object('record', row_to_json(NEW))::text
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Примечание: Расширение 'net' (pg_net) должно быть включено в Supabase (Database -> Extensions)
-- Если pg_net не включен, можно использовать альтернативный метод через Webhooks в Dashboard.

-- DROP TRIGGER IF EXISTS on_notification_push ON user_notifications;
-- CREATE TRIGGER on_notification_push
--   AFTER INSERT ON user_notifications
--   FOR EACH ROW EXECUTE PROCEDURE notify_push_service();
