# .Instruction.MD — Системная инструкция разработки ORAZA
> Для разработчиков, ИИ-ассистентов и себя в 3 часа ночи
> Репозиторий: `github.com/enver-isliamov/QRM` · v3.0.0 · Март 2026

---

## 1. ИДЕНТИЧНОСТЬ ПРОЕКТА

**ORAZA** — прогрессивное веб-приложение (PWA) для крымскотатарского сообщества.
Продукт решает три задачи: духовная практика (намазы), культурная память (календарь/обряды), взаимопомощь (Ярдым + встречи сёл).

**Целевая аудитория:** крымские татары преимущественно в Крыму, мобильные пользователи, возраст 18–60 лет, Android/iOS.

**Языки интерфейса:** Русский (основной) + Крымскотатарский (параллельно).

---

## 2. ТЕХНИЧЕСКИЙ СТЕК

### Frontend
| Технология | Версия | Роль |
|-----------|--------|------|
| React | 18 | UI framework |
| TypeScript | 5.3 | Типизация |
| Vite | 5 | Bundler + dev server |
| Tailwind CSS | 3.4 | Стилизация (utility-first) |
| React Router | 6 | SPA маршрутизация |
| Zustand | 4.5 | Глобальный стейт (persist) |
| SWR | 2.4 | Кэширование запросов (Admin) |
| i18next | 25 + react-i18next | Локализация |
| date-fns | 3 | Работа с датами |
| lucide-react | 0.344 | Иконки |

### Backend / Инфраструктура
| Технология | Роль |
|-----------|------|
| Supabase | PostgreSQL + Auth + Realtime + Storage |
| Vercel | Хостинг, автодеплой из main ветки |
| Yandex Metrika | Аналитика (ID: 106936532) |
| CloudTips | Монетизация (донаты) |

### Переменные окружения (`.env.local`)
```
VITE_SUPABASE_URL=https://cksqnhldbrvbmdwtjefq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_SUPPORT_URL=https://pay.cloudtips.ru/p/8a27e9ab
```

---

## 3. СТРУКТУРА ПРОЕКТА

```
QRM/
├── public/
│   ├── manifest.json          # PWA манифест
│   ├── sw.js                  # Service Worker (кэш + push handler)
│   └── icon-{72..512}x.png    # PWA иконки (все размеры обязательны)
├── src/
│   ├── components/
│   │   ├── Layout.tsx         # Header + Outlet + BottomNavigation
│   │   ├── Header.tsx         # Заголовок, колокольчик, профиль
│   │   ├── BottomNavigation.tsx # 5 табов (зависит от featureToggles)
│   │   ├── PwaInstallPrompt.tsx # Подсказка установки PWA
│   │   └── YandexMetrika.tsx  # Трекинг маршрутов для Метрики
│   ├── pages/
│   │   ├── Home.tsx           # Главная: намазы + события + fast nav
│   │   ├── PrayerTimes.tsx    # Расписание намазов с отметками
│   │   ├── EthnoCalendar.tsx  # Календарь с событиями
│   │   ├── Rituals.tsx        # Список обрядов
│   │   ├── RitualDetail.tsx   # Шаги обряда
│   │   ├── MicroYardym.tsx    # Система взаимопомощи
│   │   ├── VillageMeetings.tsx# Список встреч сёл
│   │   ├── MeetingDetail.tsx  # Детальная встречи + фонд
│   │   ├── MeetingEdit.tsx    # Редактирование встречи (автор/admin)
│   │   ├── Notifications.tsx  # Лента уведомлений
│   │   ├── Sections.tsx       # Хаб: Календарь/Обряды/Уведомления/Support
│   │   ├── Profile.tsx        # Профиль + stats + badges
│   │   ├── Login.tsx          # Magic Link + Google OAuth
│   │   ├── AuthCallback.tsx   # Обработка редиректа после OAuth
│   │   ├── Admin.tsx          # Панель: stats/users/moderation/content
│   │   └── Support.tsx        # Страница поддержки проекта
│   ├── hooks/
│   │   ├── useAuth.ts         # Сессия Supabase + профиль
│   │   ├── usePrayerTimes.ts  # Намазы + отметки
│   │   ├── useEthnoEvents.ts  # События календаря
│   │   ├── useRituals.ts      # Обряды и шаги
│   │   ├── useHelpRequests.ts # Ярдым: запросы, отклики, закрытие
│   │   ├── useMeetings.ts     # Встречи: список, детальная, attend/subscribe
│   │   └── useNotifications.ts# Уведомления + realtime channel
│   ├── lib/
│   │   └── supabase.ts        # Supabase client + все TypeScript типы строк БД
│   ├── store/
│   │   └── useStore.ts        # Zustand: featureToggles, legacy state
│   ├── data/
│   │   ├── prayerTimes.ts     # Статические данные намазов (fallback)
│   │   ├── ethnoCalendar.ts   # Статические события (fallback)
│   │   └── rituals.ts         # Статические обряды (fallback)
│   ├── types/
│   │   └── index.ts           # Базовые TypeScript интерфейсы
│   ├── i18n.ts                # Настройка i18next (ru + crh)
│   ├── App.tsx                # Роутер + ProtectedRoute
│   ├── main.tsx               # Entry point + SW регистрация
│   └── index.css              # Tailwind + кастомные анимации
├── .env.example               # Шаблон переменных (commit в репо)
├── vercel.json                # SPA rewrites + security headers
├── vite.config.ts             # Vite + PWA плагин
├── Todo.MD                    # Текущий план разработки (этот файл)
└── .Instruction.MD            # Системная инструкция (этот файл)
```

---

## 4. АРХИТЕКТУРНЫЕ РЕШЕНИЯ

### 4.1 Паттерн данных: Supabase-first с static fallback

Каждый хук загружает данные из Supabase. При ошибке или пустом ответе — использует статические данные из `src/data/`.

```typescript
// Пример паттерна
const { data, error } = await supabase.from('table').select('*')
if (data && !error && data.length > 0) {
  setState(data)
} else {
  setState(staticFallback) // из src/data/
}
```

### 4.2 Авторизация

- **useAuth hook** — единственный источник истины для сессии
- **ProtectedRoute** — проверяет `isAuthenticated` и `profile.role`
- **Роли:** `user` → `moderator` → `admin`
- Auth провайдеры: Magic Link (email) + Google OAuth
- Callback URL: `/auth/callback` обрабатывает токен из hash

### 4.3 Realtime

Supabase Realtime channels используются в:
- `useHelpRequests` — новые обращения
- `useNotifications` — новые уведомления конкретного пользователя

Паттерн:
```typescript
const channel = supabase.channel('channel_name')
  .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'table_name' }, callback)
  .subscribe()
return () => { supabase.removeChannel(channel) }
```

### 4.4 Состояние (State Management)

**Zustand** используется для:
- `featureToggles` — переключатели разделов (persist в localStorage)
- Legacy state (helpRequests, meetings) — сейчас дублируется с Supabase hooks, постепенно выводится

**Правило:** новый функционал реализовывать через Supabase hooks, НЕ через Zustand.

### 4.5 Feature Toggles

Флаги хранятся в Zustand (localStorage). Admin может менять через панель настроек.
Важно: флаги per-user (localStorage), не глобальные. Для глобального управления нужна таблица в Supabase.

---

## 5. БАЗА ДАННЫХ — СХЕМА

### Основные таблицы

```sql
-- Профили пользователей
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user', -- 'user' | 'moderator' | 'admin'
  provider TEXT,
  language TEXT DEFAULT 'ru', -- 'ru' | 'crh'
  phone TEXT,
  trust_score INT DEFAULT 100,
  badges JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  last_login TIMESTAMPTZ
)

-- Намазы
prayer_times (
  id SERIAL PRIMARY KEY,
  date DATE UNIQUE NOT NULL,
  fajr TIME, sunrise TIME, dhuhr TIME,
  asr TIME, maghrib TIME, isha TIME
)

-- Отметки намазов
prayer_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  prayer_key TEXT NOT NULL, -- 'fajr'|'dhuhr'|'asr'|'maghrib'|'isha'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, date, prayer_key)
)

-- События календаря
ethno_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_date DATE NOT NULL,
  title TEXT NOT NULL,
  title_crh TEXT,
  description TEXT,
  description_crh TEXT,
  type TEXT DEFAULT 'holiday', -- 'holiday'|'memorial'|'custom'
  is_recurring BOOLEAN DEFAULT false
)

-- Обряды и шаги
rituals (id TEXT PRIMARY KEY, title TEXT, title_crh TEXT, subtitle TEXT, subtitle_crh TEXT, icon TEXT, sort_order INT)
ritual_steps (id SERIAL PRIMARY KEY, ritual_id TEXT REFERENCES rituals(id), step_order INT, title TEXT, title_crh TEXT, description TEXT, description_crh TEXT)

-- Микро-Ярдым
help_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  type TEXT, -- 'blood'|'money'|'other'
  urgency TEXT DEFAULT 'normal', -- 'urgent'|'normal'
  title TEXT NOT NULL,
  location TEXT NOT NULL,
  description TEXT,
  contact_phone TEXT,
  status TEXT DEFAULT 'active', -- 'active'|'pending'|'completed'|'cancelled'|'rejected'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
)
help_responses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES help_requests(id),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, user_id)
)
help_request_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES help_requests(id),
  author_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
)
-- FK должен быть именован: CONSTRAINT help_request_comments_author_id_fkey

-- Встречи
meetings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  village TEXT NOT NULL,
  village_crh TEXT,
  organizer TEXT NOT NULL,
  organizer_phone TEXT,
  organizer_email TEXT,
  location TEXT,
  meeting_date DATE NOT NULL,
  meeting_time TIME,
  description TEXT,
  fund_purpose TEXT,
  fund_goal NUMERIC,
  fund_current NUMERIC DEFAULT 0,
  fund_cloudtips_url TEXT,
  fund_instructions TEXT,
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT now()
)
meeting_attendees (
  meeting_id UUID REFERENCES meetings(id),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(meeting_id, user_id)
)
meeting_subscriptions (
  meeting_id UUID REFERENCES meetings(id),
  user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY(meeting_id, user_id)
)

-- Уведомления
user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
)

-- Модерация
reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES profiles(id),
  target_type TEXT NOT NULL, -- 'help_request'|'comment'|'profile'
  target_id UUID NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- 'pending'|'reviewed'|'dismissed'
  created_at TIMESTAMPTZ DEFAULT now()
)
audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
)
```

### Обязательные Views

```sql
-- Обращения с числом откликов
CREATE OR REPLACE VIEW help_requests_with_count AS
SELECT hr.*, COUNT(r.id) as responses_count
FROM help_requests hr
LEFT JOIN help_responses r ON r.request_id = hr.id
GROUP BY hr.id;

-- Встречи со статистикой
CREATE OR REPLACE VIEW meetings_with_stats AS
SELECT m.*,
  COUNT(DISTINCT ma.user_id) as attendees_count,
  COUNT(DISTINCT ms.user_id) as subscribers_count,
  CASE WHEN m.fund_goal > 0 THEN ROUND((m.fund_current / m.fund_goal) * 100) ELSE NULL END as fund_progress
FROM meetings m
LEFT JOIN meeting_attendees ma ON ma.meeting_id = m.id
LEFT JOIN meeting_subscriptions ms ON ms.meeting_id = m.id
GROUP BY m.id;

-- Статистика для Админа (только через SECURITY DEFINER)
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'active') as active_help,
  (SELECT COUNT(*) FROM help_requests WHERE status = 'active' AND urgency = 'urgent') as urgent_help,
  (SELECT COUNT(*) FROM meetings WHERE status = 'upcoming') as upcoming_meetings,
  (SELECT COUNT(*) FROM prayer_completions WHERE date = CURRENT_DATE) as prayers_today;
```

### Обязательные RPC функции

```sql
-- Безопасная смена роли (только admin через DEFINER)
CREATE OR REPLACE FUNCTION set_user_role(target_user_id UUID, new_role TEXT)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Проверить что вызывающий — admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  UPDATE profiles SET role = new_role WHERE id = target_user_id;
END;
$$;
```

---

## 6. СОГЛАШЕНИЯ ПО КОДУ

### TypeScript

- Все типы строк Supabase определены в `src/lib/supabase.ts` как `type RowName = {...}`
- Компоненты — функциональные, `export default function Name()`
- Хуки — в `src/hooks/`, имя `use[Feature][SubFeature].ts`
- Нет `any` без крайней необходимости (исключение: `supabase.rpc` возвращает `any`)

### Компоненты

```typescript
// Правильная структура хука
export function useFeature(param?: string | null) {
  const [data, setData] = useState<Type[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!param) { setData([]); return }
    
    supabase.from('table').select('*')
      .then(({ data, error }) => {
        if (data && !error) setData(data as Type[])
        setLoading(false)
      })
  }, [param])

  return { data, loading }
}
```

### CSS / Tailwind

- Используй только core Tailwind utility классы
- Кастомные анимации определены в `src/index.css`: `.animate-fade-in`, `.animate-slide-up`
- Цветовая схема: `emerald-500` (#10b981) — основной цвет бренда
- Touch feedback: класс `.touch-feedback` (scale 0.97 при active)
- Модальные окна: класс `.modal-overlay` (backdrop blur)

### Модальные окна

Паттерн для всех модалок:
```tsx
{showModal && (
  <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay"
    onClick={() => setShowModal(false)}>
    <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
      onClick={e => e.stopPropagation()}>
      {/* content */}
    </div>
  </div>
)}
```

---

## 7. РОЛИ И ПРАВА ДОСТУПА

| Действие | Гость | User | Moderator | Admin |
|----------|-------|------|-----------|-------|
| Просмотр намазов | ✅ | ✅ | ✅ | ✅ |
| Отметка намазов | ❌ | ✅ | ✅ | ✅ |
| Просмотр Ярдым | ✅ | ✅ | ✅ | ✅ |
| Создать обращение Ярдым | ❌ | ✅ | ✅ | ✅ |
| Закрыть своё обращение | ❌ | ✅ | ✅ | ✅ |
| Закрыть любое обращение | ❌ | ❌ | ✅ | ✅ |
| Одобрить/отклонить pending | ❌ | ❌ | ✅ | ✅ |
| Откликнуться на Ярдым | ❌ | ✅ | ✅ | ✅ |
| Просмотр встреч | ✅ | ✅ | ✅ | ✅ |
| Записаться на встречу | ❌ | ✅ | ✅ | ✅ |
| Создать встречу | ❌ | ✅ | ✅ | ✅ |
| Редактировать свою встречу | ❌ | ✅ | ✅ | ✅ |
| Редактировать любую встречу | ❌ | ❌ | ❌ | ✅ |
| Удалить встречу | ❌ | ❌ | ❌ | ✅ |
| CRUD этно-событий | ❌ | ❌ | ✅ | ✅ |
| CRUD обрядов | ❌ | ❌ | ✅ | ✅ |
| Просмотр жалоб | ❌ | ❌ | ✅ | ✅ |
| Рассмотреть жалобу | ❌ | ❌ | ✅ | ✅ |
| Просмотр audit log | ❌ | ❌ | ✅ | ✅ |
| Просмотр всех пользователей | ❌ | ❌ | ❌ | ✅ |
| Смена роли пользователя | ❌ | ❌ | ❌ | ✅ |
| Feature Toggles | ❌ | ❌ | ❌ | ✅ |
| Статистика приложения | ❌ | ❌ | ❌ | ✅ |

---

## 8. ДЕПЛОЙ

### Автоматический деплой
Push в `main` → Vercel автоматически собирает и деплоит.

### Vercel настройки
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
}
```
(Обязательно для SPA маршрутизации)

### Переменные в Vercel Dashboard
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPPORT_URL`

### Суpabase Dashboard
- Auth → URL Configuration: `Site URL = https://orazaru.vercel.app`
- Auth → URL Configuration: `Redirect URLs = https://orazaru.vercel.app/auth/callback`
- Auth → Providers: Email (Magic Link enabled), Google (Client ID + Secret)

---

## 9. ТИПИЧНЫЕ ОШИБКИ И КАК ИХ ИЗБЕЖАТЬ

### 1. «Данные не загружаются»
Проверить в порядке:
1. Supabase URL и ANON_KEY в `.env.local`
2. RLS политика разрешает SELECT для `anon` или `authenticated`
3. Таблица/VIEW существует
4. Колонки в SELECT совпадают с названиями в БД

### 2. «Авторизация не работает»
1. Supabase Dashboard → Auth → URL Configuration
2. Redirect URL должен точно совпадать (без trailing slash)
3. Google OAuth: в Google Console добавлен Authorized Redirect URI

### 3. «Realtime не приходит»
1. Supabase Dashboard → Database → Replication → убедиться таблица включена в Realtime
2. RLS политика разрешает SELECT (realtime работает через SELECT)
3. Channel name должен быть уникальным на страницу

### 4. «Смена роли не работает»
1. Функция `set_user_role` должна существовать в Supabase
2. `SECURITY DEFINER` — обязателен
3. Проверить что `GRANT EXECUTE` выдан для `authenticated`

### 5. «Уведомление не пришло»
1. Trigger существует? (`SELECT * FROM pg_trigger`)
2. Trigger function не бросает исключение? (проверить через Supabase Logs)
3. RLS на `user_notifications` разрешает INSERT от trigger (SECURITY DEFINER в функции)

---

## 10. КОНТРОЛЬНЫЙ СПИСОК ПЕРЕД ДЕПЛОЕМ

- [ ] `npm run build` — без TS ошибок
- [ ] `npm run lint` — без предупреждений
- [ ] Все переменные окружения установлены в Vercel
- [ ] Supabase Auth Redirect URLs обновлены
- [ ] Все иконки PWA (`icon-72x72.png` ... `icon-512x512.png`) в `/public/`
- [ ] Данные намазов загружены в БД на актуальный период
- [ ] RLS политики проверены для всех таблиц
- [ ] Триггеры созданы и протестированы
- [ ] `set_user_role` RPC function создана
- [ ] `admin_stats` VIEW создан
- [ ] Feature toggles в правильном состоянии для продакшена

---

## 11. КОНТАКТЫ И РЕСУРСЫ

| Ресурс | URL |
|--------|-----|
| Репозиторий | https://github.com/enver-isliamov/QRM |
| Продакшн | https://orazaru.vercel.app |
| Supabase Dashboard | https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq |
| Vercel Dashboard | https://vercel.com/dashboard |
| Источник намазов | https://qmdi.ru (ДУМ Крыма) |
| CloudTips | https://pay.cloudtips.ru/p/8a27e9ab |
| Поддержка | support@oraza.ru |

---

*Сесинъизге рахмет! Спасибо за вклад в проект ORAZA 🙏*
