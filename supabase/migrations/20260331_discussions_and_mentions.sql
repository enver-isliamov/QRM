-- 1. Добавляем username в профили (для упоминаний через @)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- 2. Добавляем вложенность (threading) в комментарии Ярдым
ALTER TABLE help_request_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES help_request_comments(id) ON DELETE CASCADE;

-- 3. Создаем таблицу комментариев для встреч
CREATE TABLE IF NOT EXISTS meeting_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    author_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES meeting_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Включаем RLS для новых комментариев
ALTER TABLE meeting_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view meeting comments" ON meeting_comments;
CREATE POLICY "Anyone can view meeting comments" ON meeting_comments 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can insert meeting comments" ON meeting_comments;
CREATE POLICY "Authenticated can insert meeting comments" ON meeting_comments 
FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own meeting comments" ON meeting_comments;
CREATE POLICY "Authors can delete their own meeting comments" ON meeting_comments 
FOR DELETE USING (auth.uid() = author_id);

-- 5. Функция для обработки упоминаний через @
-- Она ищет в тексте @username и создает уведомление для этого пользователя
CREATE OR REPLACE FUNCTION notify_mentions()
RETURNS trigger AS $$
DECLARE
  mentioned_user_id UUID;
  mention_text TEXT;
  target_link TEXT;
  notification_title TEXT;
BEGIN
  -- Определяем ссылку и заголовок в зависимости от таблицы
  IF TG_TABLE_NAME = 'help_request_comments' THEN
    target_link := '/micro-yardym'; -- Можно уточнить ссылку, если будет детальная страница
    notification_title := 'Вас упомянули в обсуждении Ярдым';
  ELSIF TG_TABLE_NAME = 'meeting_comments' THEN
    target_link := '/meetings/' || NEW.meeting_id;
    notification_title := 'Вас упомянули в обсуждении встречи';
  END IF;

  -- Ищем все вхождения @username (упрощенный поиск по одному упоминанию для начала)
  -- В идеале нужен цикл по всем совпадениям, но для MVP сделаем первое
  mention_text := substring(NEW.content from '@([a-zA-Z0-9_]+)');
  
  IF mention_text IS NOT NULL THEN
    SELECT id INTO mentioned_user_id FROM profiles WHERE lower(username) = lower(mention_text);
    
    IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.author_id THEN
      INSERT INTO user_notifications (user_id, type, title, body, link)
      VALUES (
        mentioned_user_id,
        'system',
        notification_title,
        substring(NEW.content from 1 for 100),
        target_link
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Активируем триггеры упоминаний
DROP TRIGGER IF EXISTS on_help_comment_mention ON help_request_comments;
CREATE TRIGGER on_help_comment_mention
  AFTER INSERT ON help_request_comments
  FOR EACH ROW EXECUTE PROCEDURE notify_mentions();

DROP TRIGGER IF EXISTS on_meeting_comment_mention ON meeting_comments;
CREATE TRIGGER on_meeting_comment_mention
  AFTER INSERT ON meeting_comments
  FOR EACH ROW EXECUTE PROCEDURE notify_mentions();
