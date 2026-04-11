-- 1. Добавление колонки cloudtips_url в таблицу help_requests
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS cloudtips_url TEXT;

-- 2. Обновление VIEW для Ярдым
DROP VIEW IF EXISTS help_requests_with_count;
CREATE OR REPLACE VIEW help_requests_with_count AS
SELECT hr.*, COUNT(r.id) as responses_count
FROM help_requests hr
LEFT JOIN help_responses r ON r.request_id = hr.id
GROUP BY hr.id;

-- 3. Обновление VIEW для Встреч (чтобы пробросить fund_cloudtips_url)
DROP VIEW IF EXISTS meetings_with_stats;
CREATE OR REPLACE VIEW meetings_with_stats AS
SELECT m.*,
  COUNT(DISTINCT ma.user_id) as attendees_count,
  COUNT(DISTINCT ms.user_id) as subscribers_count,
  CASE WHEN m.fund_goal > 0 THEN ROUND((m.fund_current / m.fund_goal) * 100) ELSE NULL END as fund_progress
FROM meetings m
LEFT JOIN meeting_attendees ma ON ma.meeting_id = m.id
LEFT JOIN meeting_subscriptions ms ON ms.meeting_id = m.id
GROUP BY m.id;
