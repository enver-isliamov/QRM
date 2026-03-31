# 📱 ORAZA - Пошаговая инструкция по деплою на Vercel (для новичков).

## Что вам понадобится

1. **GitHub аккаунт** - для хранения кода (бесплатно)
2. **Vercel аккаунт** - для деплоя (бесплатно)
3. **Браузер** - Chrome, Firefox, Safari (всё делаем через веб!)

---

## ШАГ 1: Создание GitHub репозитория (хранилище кода)

### 1.1 Зарегистрируйтесь на GitHub
1. Откройте https://github.com
2. Нажмите "Sign up" (зарегистрироваться)
3. Введите email, пароль, имя пользователя
4. Подтвердите email

### 1.2 Создайте новый репозиторий
1. Войдите в GitHub
2. Нажмите зеленую кнопку **"+"** в правом верхнем углу
3. Выберите **"New repository"** (новый репозиторий)
4. В поле **"Repository name"** введите: `oraza-pwa`
5. Выберите **"Public"** (публичный)
6. Поставьте галочку **"Add a README file"**
7. Нажмите **"Create repository"**

### 1.3 Загрузите файлы проекта

**Вариант А: Через веб-интерфейс (проще)**

1. Откройте ваш репозиторий `oraza-pwa`
2. Нажмите **"Add file"** → **"Upload files"**
3. Перетащите ВСЕ файлы проекта (или нажмите "choose your files")
4. Прокрутите вниз, напишите сообщение: `Initial commit`
5. Нажмите **"Commit changes"**

**Вариант Б: Через ZIP-архив**

1. Разархивируйте `oraza-pwa.tar.gz` на компьютере
2. В репозитории нажмите **"Add file"** → **"Upload files"**
3. Загрузите все папки: `src/`, `public/`, и файлы из корня

---

## ШАГ 2: Настройка переменных окружения (ВАЖНО!)

Перед деплоем нужно настроить секреты. Это делается в Vercel, но сначала подготовимся.

### 2.1 Получите Google Client ID (для авторизации через Google)

1. Перейдите на https://console.cloud.google.com/
2. Войдите в свой Google аккаунт
3. Нажмите **"Select a project"** → **"New Project"**
4. Название проекта: `oraza-app`
5. Нажмите **"Create"**
6. В меню слева выберите **"APIs & Services"** → **"Credentials"**
7. Нажмите **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
8. Настройте экран согласия:
   - User Type: **External**
   - Заполните обязательные поля (название, email)
9. Вернитесь в Credentials → **"CREATE CREDENTIALS"** → **"OAuth client ID"**
   - Application type: **Web application**
   - Name: `oraza-web`
   - Authorized JavaScript origins: `https://your-vercel-domain.vercel.app`
   - Authorized redirect URIs: `https://your-vercel-domain.vercel.app/login`
10. Нажмите **"Create"**
11. **Скопируйте Client ID** (будет вида: `123456789-abc123.apps.googleusercontent.com`)

### 2.2 Создайте Telegram бота (для авторизации через Telegram)

1. Откройте Telegram
2. Найдите бота **@BotFather**
3. Отправьте команду: `/newbot`
4. Введите имя бота: `ORAZA Auth Bot`
5. Введите username (должно заканчиваться на bot): `oraza_auth_bot`
6. **Скопируйте токен** (будет вида: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
7. Отправьте: `/setdomain`
8. Выберите вашего бота
9. Введите домен: `your-vercel-domain.vercel.app`

---

## ШАГ 3: Деплой на Vercel

### 3.1 Зарегистрируйтесь на Vercel

1. Откройте https://vercel.com
2. Нажмите **"Sign Up"**
3. Выберите **"Continue with GitHub"**
4. Авторизуйте Vercel доступ к GitHub

### 3.2 Импортируйте проект

1. На дашборде Vercel нажмите **"Add New..."** → **"Project"**
2. Найдите ваш репозиторий `oraza-pwa`
3. Нажмите **"Import"**

### 3.3 Настройте проект

1. **Project Name**: `oraza-pwa` (или любое другое)
2. **Framework Preset**: Выберите **"Vite"**
3. **Root Directory**: `./` (оставьте как есть)
4. **Build Command**: `npm run build` (оставьте как есть)
5. **Output Directory**: `dist` (оставьте как есть)

### 3.4 Добавьте переменные окружения (ВАЖНО!)

Нажмите **"Environment Variables"** и добавьте:

| Name | Value |
|------|-------|
| `VITE_GOOGLE_CLIENT_ID` | Ваш Google Client ID (из шага 2.1) |
| `VITE_TELEGRAM_BOT_NAME` | Username вашего бота без @ (например: `oraza_auth_bot`) |
| `VITE_SUPPORT_URL` | `https://pay.cloudtips.ru/p/8a27e9ab` |

**Как добавить:**
1. В поле "Name" введите `VITE_GOOGLE_CLIENT_ID`
2. В поле "Value" вставьте ваш Client ID
3. Нажмите **"Add"**
4. Повторите для остальных переменных

### 3.5 Задеплойте!

1. Нажмите **"Deploy"**
2. Ждите 2-3 минуты
3. Готово! Нажмите **"Visit"** чтобы открыть сайт

---

## ШАГ 4: Обновите настройки Google и Telegram

После деплоя у вас будет домен вида `https://oraza-pwa.vercel.app`

### 4.1 Обновите Google OAuth

1. Вернитесь в https://console.cloud.google.com/
2. APIs & Services → Credentials
3. Найдите ваш OAuth client ID
4. Нажмите **"Edit"** (карандаш)
5. Добавьте:
   - **Authorized JavaScript origins**: `https://oraza-pwa.vercel.app`
   - **Authorized redirect URIs**: `https://oraza-pwa.vercel.app/login`
6. Нажмите **"Save"**

### 4.2 Обновите Telegram Bot

1. В Telegram найдите @BotFather
2. Отправьте: `/setdomain`
3. Выберите вашего бота
4. Введите: `oraza-pwa.vercel.app` (без https://)

---

## ШАГ 5: Проверьте работу

Откройте ваш сайт и проверьте:

- [ ] Главная страница загружается
- [ ] Расписание намазов отображается
- [ ] Этно-календарь работает
- [ ] Обрядовый гид открывается
- [ ] Авторизация (демо-вход) работает
- [ ] Профиль открывается
- [ ] Админ-панель доступна (войдите через "Демо вход (Админ)")

---

## Частые проблемы и решения

### Проблема: "Build failed"

**Решение:**
1. Проверьте, что все файлы загружены на GitHub
2. Убедитесь, что `package.json` есть в корне репозитория
3. Перезапустите деплой: в Vercel нажмите "Redeploy"

### Проблема: Google авторизация не работает

**Решение:**
1. Проверьте, что `VITE_GOOGLE_CLIENT_ID` правильно добавлен в Vercel
2. Убедитесь, что домен добавлен в Authorized JavaScript origins
3. Подождите 5-10 минут (изменения в Google применяются не сразу)

### Проблема: Telegram авторизация не работает

**Решение:**
1. Проверьте `VITE_TELEGRAM_BOT_NAME` (должен быть без @)
2. Убедитесь, что домен настроен через `/setdomain` в BotFather
3. Проверьте, что бот не заблокирован

### Проблема: Стили не применяются

**Решение:**
1. Очистите кэш браузера (Ctrl+F5 или Cmd+Shift+R)
2. Проверьте консоль браузера (F12 → Console) на ошибки

---

## Обновление приложения

Когда вы захотите внести изменения:

1. Измените файлы локально или на GitHub
2. Закоммитьте изменения (через веб: "Commit changes")
3. Vercel автоматически пересоберет и задеплоит!

---

## Полезные ссылки

- **Ваш сайт**: `https://oraza-pwa.vercel.app`
- **GitHub репозиторий**: `https://github.com/ВАШ_НИК/oraza-pwa`
- **Vercel Dashboard**: `https://vercel.com/dashboard`
- **Google Cloud Console**: `https://console.cloud.google.com/`

---

## Поддержка

Если возникли проблемы:
1. Проверьте консоль браузера (F12 → Console)
2. Проверьте логи в Vercel (Dashboard → ваш проект → Logs)
3. Убедитесь, что все переменные окружения добавлены

**Успехов!** 🎉
