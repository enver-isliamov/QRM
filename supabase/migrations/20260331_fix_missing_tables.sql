-- Создаем таблицу комментариев для Ярдым, если она отсутствует
CREATE TABLE IF NOT EXISTS public.help_request_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID REFERENCES public.help_requests(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.help_request_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Включаем RLS
ALTER TABLE public.help_request_comments ENABLE ROW LEVEL SECURITY;

-- Политики для help_request_comments
DROP POLICY IF EXISTS "Anyone can view help request comments" ON public.help_request_comments;
CREATE POLICY "Anyone can view help request comments" ON public.help_request_comments 
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can insert help request comments" ON public.help_request_comments;
CREATE POLICY "Authenticated can insert help request comments" ON public.help_request_comments 
FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own help request comments" ON public.help_request_comments;
CREATE POLICY "Authors can delete their own help request comments" ON public.help_request_comments 
FOR DELETE USING (auth.uid() = author_id);

-- Убеждаемся, что username есть в профилях
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

-- Добавляем parent_id в meeting_comments если вдруг пропустили (хотя в прошлой миграции было)
ALTER TABLE public.meeting_comments ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.meeting_comments(id) ON DELETE CASCADE;
