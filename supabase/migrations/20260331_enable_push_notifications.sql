-- ЭТАП D3.6: Включение расширения pg_net и активация триггера push-уведомлений
-- Это расширение необходимо для выполнения HTTP-запросов из PostgreSQL (вызов Edge Functions)

-- 1. Включаем расширение pg_net (если оно доступно в вашем плане Supabase)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Активируем триггер для отправки push-уведомлений при появлении записи в user_notifications
-- Мы используем функцию notify_push_service(), которая уже определена в миграции 20260330_push_trigger.sql

DROP TRIGGER IF EXISTS on_notification_push ON user_notifications;
CREATE TRIGGER on_notification_push
  AFTER INSERT ON user_notifications
  FOR EACH ROW EXECUTE PROCEDURE notify_push_service();

-- Примечание: Убедитесь, что в функции notify_push_service() указан правильный ID проекта
-- и что Edge Function 'send-push' развернута.
