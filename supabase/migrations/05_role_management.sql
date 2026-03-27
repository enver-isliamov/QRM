-- 1. Создание защищенной функции для изменения роли пользователя
-- SECURITY DEFINER позволяет функции выполняться с правами создателя (администратора БД),
-- обходя стандартные политики RLS, которые запрещают пользователям редактировать чужие профили.
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role TEXT;
BEGIN
  -- Получаем роль пользователя, вызывающего функцию
  SELECT role INTO caller_role FROM profiles WHERE id = auth.uid();

  -- Проверяем, является ли вызывающий администратором
  IF caller_role <> 'admin' THEN
    RAISE EXCEPTION 'Только администраторы могут изменять роли пользователей.';
  END IF;

  -- Проверяем валидность новой роли
  IF new_role NOT IN ('user', 'moderator', 'admin') THEN
    RAISE EXCEPTION 'Недопустимая роль.';
  END IF;

  -- Обновляем роль целевого пользователя
  UPDATE profiles SET role = new_role WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

-- 2. Политики RLS для таблицы profiles (Аудит)
-- Убедимся, что RLS включен
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Разрешаем чтение профилей всем аутентифицированным пользователям
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Разрешаем пользователям обновлять ТОЛЬКО свой собственный профиль
-- Защита от изменения роли напрямую на клиенте обеспечивается тем, 
-- что клиент использует RPC функцию set_user_role.
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);
