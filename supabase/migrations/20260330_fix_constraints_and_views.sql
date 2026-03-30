-- 1. Исправление констрейнта статуса для help_requests
-- Сначала удаляем старый констрейнт если он есть. 
-- Обычно Supabase создает его с именем table_column_check
ALTER TABLE help_requests DROP CONSTRAINT IF EXISTS help_requests_status_check;
ALTER TABLE help_requests ADD CONSTRAINT help_requests_status_check 
CHECK (status IN ('active', 'pending', 'completed', 'cancelled', 'rejected'));

-- 2. Гарантия наличия колонок (на случай если предыдущие миграции не сработали)
ALTER TABLE help_requests ADD COLUMN IF NOT EXISTS cloudtips_url TEXT;
ALTER TABLE meetings ADD COLUMN IF NOT EXISTS fund_cloudtips_url TEXT;

-- 3. Унификация полей в meetings (если вдруг fund_target еще жив)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meetings' AND column_name = 'fund_target'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'meetings' AND column_name = 'fund_goal'
    ) THEN
        ALTER TABLE meetings RENAME COLUMN fund_target TO fund_goal;
    END IF;
END $$;

-- 4. Обновление VIEW для Ярдым (пробрасываем cloudtips_url)
DROP VIEW IF EXISTS help_requests_with_count;
CREATE OR REPLACE VIEW help_requests_with_count AS
SELECT hr.*, COUNT(r.id) as responses_count
FROM help_requests hr
LEFT JOIN help_responses r ON r.request_id = hr.id
GROUP BY hr.id;

-- 5. Обновление VIEW для Встреч (пробрасываем fund_cloudtips_url и используем fund_goal)
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
