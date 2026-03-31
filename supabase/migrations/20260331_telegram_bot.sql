-- Таблица для связки пользователей Supabase и Telegram
CREATE TABLE IF NOT EXISTS public.telegram_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  telegram_id BIGINT UNIQUE,
  chat_id BIGINT UNIQUE,
  auth_code TEXT UNIQUE, -- Код для привязки (например, /start 123456)
  auth_code_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Индексы
CREATE INDEX IF NOT EXISTS idx_telegram_users_user_id ON public.telegram_users(user_id);
CREATE INDEX IF NOT EXISTS idx_telegram_users_auth_code ON public.telegram_users(auth_code);

-- RLS
ALTER TABLE public.telegram_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own telegram link"
  ON public.telegram_users FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own telegram link"
  ON public.telegram_users FOR DELETE
  USING (auth.uid() = user_id);

-- Функция для генерации кода привязки
CREATE OR REPLACE FUNCTION generate_telegram_auth_code(target_user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Генерируем 6-значный код
  new_code := floor(random() * 900000 + 100000)::TEXT;
  
  -- Вставляем или обновляем запись для пользователя
  INSERT INTO public.telegram_users (user_id, auth_code, auth_code_expires_at)
  VALUES (target_user_id, new_code, now() + interval '15 minutes')
  ON CONFLICT (user_id) DO UPDATE
  SET auth_code = new_code,
      auth_code_expires_at = now() + interval '15 minutes',
      updated_at = now();
      
  RETURN new_code;
END;
$$;
