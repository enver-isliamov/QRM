-- ЭТАП A2: Настройка RLS (Row Level Security)
-- Цель: Обеспечить безопасность данных на уровне строк

-- 1. Таблица profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" ON profiles 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles 
FOR UPDATE USING (auth.uid() = id);

-- 2. Таблица prayer_completions
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

-- 3. Таблица help_requests
ALTER TABLE help_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Help requests are viewable by everyone" ON help_requests;
CREATE POLICY "Help requests are viewable by everyone" ON help_requests 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own help requests" ON help_requests;
CREATE POLICY "Users can insert their own help requests" ON help_requests 
FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own help requests" ON help_requests;
CREATE POLICY "Users can update their own help requests" ON help_requests 
FOR UPDATE USING (auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- 4. Таблица help_responses
ALTER TABLE help_responses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Help responses are viewable by everyone" ON help_responses;
CREATE POLICY "Help responses are viewable by everyone" ON help_responses 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own help responses" ON help_responses;
CREATE POLICY "Users can insert their own help responses" ON help_responses 
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 5. Таблица meeting_attendees
ALTER TABLE meeting_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Meeting attendees are viewable by everyone" ON meeting_attendees;
CREATE POLICY "Meeting attendees are viewable by everyone" ON meeting_attendees 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own attendance" ON meeting_attendees;
CREATE POLICY "Users can insert their own attendance" ON meeting_attendees 
FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own attendance" ON meeting_attendees;
CREATE POLICY "Users can delete their own attendance" ON meeting_attendees 
FOR DELETE USING (auth.uid() = user_id);

-- 6. Таблица user_notifications
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can see their own notifications" ON user_notifications;
CREATE POLICY "Users can see their own notifications" ON user_notifications 
FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON user_notifications;
CREATE POLICY "Users can update their own notifications" ON user_notifications 
FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON user_notifications;
CREATE POLICY "Users can delete their own notifications" ON user_notifications 
FOR DELETE USING (auth.uid() = user_id);

-- 7. Таблица audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can see audit logs" ON audit_logs;
CREATE POLICY "Admins can see audit logs" ON audit_logs 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- 8. Таблица reports
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert reports" ON reports;
CREATE POLICY "Users can insert reports" ON reports 
FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins and moderators can see reports" ON reports;
CREATE POLICY "Admins and moderators can see reports" ON reports 
FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')
));

-- 9. Таблица meetings
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Meetings are viewable by everyone" ON meetings;
CREATE POLICY "Meetings are viewable by everyone" ON meetings 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert meetings" ON meetings;
CREATE POLICY "Users can insert meetings" ON meetings 
FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update their own meetings" ON meetings;
CREATE POLICY "Users can update their own meetings" ON meetings 
FOR UPDATE USING (auth.uid() = author_id OR EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
));
