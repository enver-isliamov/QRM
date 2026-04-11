-- Функция для уведомления автора родительского комментария при ответе
CREATE OR REPLACE FUNCTION notify_comment_reply()
RETURNS trigger AS $$
DECLARE
  parent_author_id UUID;
  notification_title TEXT;
  target_link TEXT;
BEGIN
  -- Определяем ссылку и заголовок в зависимости от таблицы
  IF TG_TABLE_NAME = 'help_request_comments' THEN
    SELECT author_id INTO parent_author_id FROM help_request_comments WHERE id = NEW.parent_id;
    target_link := '/micro-yardym';
    notification_title := 'Новый ответ на ваш комментарий в Ярдым';
  ELSIF TG_TABLE_NAME = 'meeting_comments' THEN
    SELECT author_id INTO parent_author_id FROM meeting_comments WHERE id = NEW.parent_id;
    target_link := '/meetings/' || NEW.meeting_id;
    notification_title := 'Новый ответ на ваш комментарий к встрече';
  END IF;

  -- Если это ответ (есть parent_id) и автор ответа не является автором родительского комментария
  IF NEW.parent_id IS NOT NULL AND parent_author_id IS NOT NULL AND parent_author_id != NEW.author_id THEN
    INSERT INTO user_notifications (user_id, type, title, body, link)
    VALUES (
      parent_author_id,
      'comment_reply',
      notification_title,
      substring(NEW.content from 1 for 100),
      target_link
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Активируем триггеры ответов
DROP TRIGGER IF EXISTS on_help_comment_reply ON help_request_comments;
CREATE TRIGGER on_help_comment_reply
  AFTER INSERT ON help_request_comments
  FOR EACH ROW EXECUTE PROCEDURE notify_comment_reply();

DROP TRIGGER IF EXISTS on_meeting_comment_reply ON meeting_comments;
CREATE TRIGGER on_meeting_comment_reply
  AFTER INSERT ON meeting_comments
  FOR EACH ROW EXECUTE PROCEDURE notify_comment_reply();
