-- БАГ-1: Создание RPC для безопасного изменения роли пользователя
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Проверяем, является ли вызывающий пользователь админом
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can change roles';
  END IF;

  -- Обновляем роль
  UPDATE profiles
  SET role = new_role
  WHERE id = target_user_id;
END;
$$;

-- БАГ-4: Named FK для help_request_comments
-- Если внешний ключ уже существует без имени или с другим именем, его нужно пересоздать
-- Сначала удаляем старый FK если он есть (полагаемся на то, что это можно сделать вручную если нужно)
-- ALTER TABLE help_request_comments DROP CONSTRAINT IF EXISTS help_request_comments_author_id_fkey;
-- Добавляем именованный FK
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'help_request_comments_author_id_fkey'
    ) THEN
        ALTER TABLE help_request_comments
        ADD CONSTRAINT help_request_comments_author_id_fkey
        FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- БАГ-5: Добавление trust_score и badges в profiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'trust_score'
    ) THEN
        ALTER TABLE profiles ADD COLUMN trust_score INTEGER DEFAULT 100;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'badges'
    ) THEN
        ALTER TABLE profiles ADD COLUMN badges JSONB DEFAULT '[]'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'language'
    ) THEN
        ALTER TABLE profiles ADD COLUMN language TEXT DEFAULT 'ru';
    END IF;
END $$;

-- A1.4: Убедиться что prayer_completions имеет уникальный индекс
CREATE UNIQUE INDEX IF NOT EXISTS prayer_completions_user_date_key_idx ON prayer_completions (user_id, date, prayer_key);

-- A1.6: Проверить что meeting_subscriptions существует
CREATE TABLE IF NOT EXISTS meeting_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(meeting_id, user_id)
);

-- A1.7: Проверить user_notifications
CREATE TABLE IF NOT EXISTS user_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- A1.8: Создать/проверить admin_stats VIEW
CREATE OR REPLACE VIEW admin_stats AS
SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM help_requests) as total_help_requests,
    (SELECT COUNT(*) FROM meetings) as total_meetings,
    (SELECT COUNT(*) FROM ethno_events) as total_events;

-- A1.9: Создать/проверить help_requests_with_count VIEW
CREATE OR REPLACE VIEW help_requests_with_count AS
SELECT 
    hr.*,
    (SELECT COUNT(*) FROM help_responses WHERE request_id = hr.id) as responses_count,
    p.name as author_name,
    p.avatar_url as author_avatar
FROM help_requests hr
LEFT JOIN profiles p ON hr.author_id = p.id;

-- A1.10: Создать/проверить meetings_with_stats VIEW
CREATE OR REPLACE VIEW meetings_with_stats AS
SELECT 
    m.*,
    (SELECT COUNT(*) FROM meeting_attendees WHERE meeting_id = m.id) as attendees_count,
    (SELECT COUNT(*) FROM meeting_subscriptions WHERE meeting_id = m.id) as subscribers_count,
    CASE 
        WHEN m.fund_target > 0 THEN (m.fund_current::FLOAT / m.fund_target::FLOAT) * 100 
        ELSE 0 
    END as fund_progress
FROM meetings m;

-- A3.1: Создать trigger on_auth_user_created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Сначала удаляем триггер, если он есть, чтобы избежать ошибок
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- B4.1: Функция update_user_badges
CREATE OR REPLACE FUNCTION update_user_badges(target_user_id UUID)
RETURNS void AS $$
DECLARE
  current_score INT;
  new_badges JSONB := '[]'::jsonb;
BEGIN
  SELECT trust_score INTO current_score FROM profiles WHERE id = target_user_id;
  
  IF current_score >= 100 THEN
    new_badges := new_badges || '{"id": "trusted", "name": "Надёжный", "icon": "Shield", "desc": "Базовый уровень доверия"}'::jsonb;
  END IF;
  IF current_score >= 500 THEN
    new_badges := new_badges || '{"id": "helper", "name": "Помощник", "icon": "Heart", "desc": "Активный участник взаимопомощи"}'::jsonb;
  END IF;
  IF current_score >= 1000 THEN
    new_badges := new_badges || '{"id": "activist", "name": "Активист", "icon": "Star", "desc": "Организатор и лидер сообщества"}'::jsonb;
  END IF;
  IF current_score >= 5000 THEN
    new_badges := new_badges || '{"id": "veteran", "name": "Ветеран", "icon": "Award", "desc": "Выдающийся вклад в развитие"}'::jsonb;
  END IF;

  UPDATE profiles SET badges = new_badges WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- B3.1: Trigger на INSERT help_responses
CREATE OR REPLACE FUNCTION increment_trust_score_on_response()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET trust_score = trust_score + 10 WHERE id = NEW.user_id;
  PERFORM update_user_badges(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_help_response_trust ON help_responses;
CREATE TRIGGER on_help_response_trust
  AFTER INSERT ON help_responses
  FOR EACH ROW EXECUTE PROCEDURE increment_trust_score_on_response();

-- B3.2: Trigger на INSERT help_requests
CREATE OR REPLACE FUNCTION increment_trust_score_on_request()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET trust_score = trust_score + 5 WHERE id = NEW.author_id;
  PERFORM update_user_badges(NEW.author_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_help_request_trust ON help_requests;
CREATE TRIGGER on_help_request_trust
  AFTER INSERT ON help_requests
  FOR EACH ROW EXECUTE PROCEDURE increment_trust_score_on_request();

-- B3.3: Trigger на INSERT meetings
CREATE OR REPLACE FUNCTION increment_trust_score_on_meeting()
RETURNS trigger AS $$
BEGIN
  UPDATE profiles SET trust_score = trust_score + 20 WHERE id = NEW.author_id;
  PERFORM update_user_badges(NEW.author_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_meeting_trust ON meetings;
CREATE TRIGGER on_meeting_trust
  AFTER INSERT ON meetings
  FOR EACH ROW EXECUTE PROCEDURE increment_trust_score_on_meeting();

-- B1.1: Функция notify_help_author
CREATE OR REPLACE FUNCTION notify_help_author() RETURNS trigger AS $$
BEGIN
  INSERT INTO user_notifications (user_id, type, title, body, link)
  SELECT hr.author_id, 'help_response',
         'Новый отклик на ваше обращение',
         'Кто-то откликнулся на вашу просьбу о помощи',
         '/micro-yardym'
  FROM help_requests hr WHERE hr.id = NEW.request_id AND hr.author_id IS NOT NULL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_help_response ON help_responses;
CREATE TRIGGER on_help_response
  AFTER INSERT ON help_responses
  FOR EACH ROW EXECUTE PROCEDURE notify_help_author();

CREATE OR REPLACE FUNCTION notify_meeting_subscribers()
RETURNS trigger AS $$
BEGIN
  -- Если изменилось время встречи (с null на значение)
  IF OLD.meeting_time IS NULL AND NEW.meeting_time IS NOT NULL THEN
    INSERT INTO user_notifications (user_id, type, title, body, link)
    SELECT DISTINCT user_id, 'meeting_date_set',
           'Назначено время встречи',
           'Встреча в ' || NEW.village || ' состоится в ' || NEW.meeting_time,
           '/meetings/' || NEW.id
    FROM (
      SELECT user_id FROM meeting_subscriptions WHERE meeting_id = NEW.id
      UNION
      SELECT user_id FROM meeting_attendees WHERE meeting_id = NEW.id
    ) as subs;
  -- Если изменились другие важные поля
  ELSIF OLD.meeting_date IS DISTINCT FROM NEW.meeting_date OR OLD.location IS DISTINCT FROM NEW.location THEN
    INSERT INTO user_notifications (user_id, type, title, body, link)
    SELECT DISTINCT user_id, 'meeting_update',
           'Встреча обновлена',
           'Изменились детали встречи в ' || NEW.village,
           '/meetings/' || NEW.id
    FROM (
      SELECT user_id FROM meeting_subscriptions WHERE meeting_id = NEW.id
      UNION
      SELECT user_id FROM meeting_attendees WHERE meeting_id = NEW.id
    ) as subs;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_meeting_update ON meetings;
CREATE TRIGGER on_meeting_update
  AFTER UPDATE ON meetings
  FOR EACH ROW EXECUTE PROCEDURE notify_meeting_subscribers();




