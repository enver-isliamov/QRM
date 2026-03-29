# ORAZA - Крымскотатарское PWA-приложение

Приложение для крымских татар, живущих в Крыму. Включает расписание намазов, этно-календарь, обрядовый гид, систему взаимопомощи и многое другое.

## Функции

- 📿 **Расписание намазов** - Время намазов для Симферополя по данным ДУМ Крыма
- 📅 **Этно-календарь** - Крымскотатарские праздники и памятные даты
- 📖 **Обрядовый гид** - Традиции: Никях, Дженазе, Суннат
- 🤝 **Микро-Ярдым** - Система взаимопомощи сообщества
- 🏘️ **Встречи сел** - События и мероприятия в селах
- 👤 **Личный кабинет** - Профиль пользователя
- 🔐 **Авторизация** - Через Google и Telegram
- ⚙️ **Админ-панель** - Управление пользователями и контентом
- 💚 **Поддержка** - Монетизация через CloudTips

## Технологии

- **React 18** + **TypeScript** - Современный фронтенд
- **Vite** - Быстрая сборка
- **Tailwind CSS** - Стилизация
- **Zustand** - Управление состоянием
- **PWA** - Прогрессивное веб-приложение

## Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Запуск разработки

```bash
npm run dev
```

Приложение будет доступно по адресу `http://localhost:5173`

### 3. Сборка для продакшена

```bash
npm run build
```

Сборка будет создана в папке `dist/`

## Настройка авторизации

### Google Sign-In

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите Google+ API
4. Создайте OAuth 2.0 credentials
5. Добавьте authorized redirect URI: `https://your-domain.com`
6. Скопируйте Client ID
7. В файле `src/pages/Login.tsx` замените `YOUR_GOOGLE_CLIENT_ID` на ваш Client ID

### Telegram Login

1. Напишите боту [@BotFather](https://t.me/BotFather)
2. Создайте нового бота командой `/newbot`
3. Получите токен бота
4. Настройте домен через `/setdomain`
5. Используйте виджет Telegram Login Widget

## Деплой на GitHub Pages (Бесплатно)

### 1. Создайте репозиторий на GitHub

```bash
# Инициализируйте git репозиторий
git init

# Добавьте все файлы
git add .

# Сделайте первый коммит
git commit -m "Initial commit"

# Добавьте удаленный репозиторий
git remote add origin https://github.com/YOUR_USERNAME/oraza-pwa.git

# Отправьте код на GitHub
git push -u origin main
```

### 2. Настройте GitHub Actions для автодеплоя

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build
        run: npm run build
      
      - name: Setup Pages
        uses: actions/configure-pages@v4
      
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'
      
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

### 3. Включите GitHub Pages

1. Перейдите в настройки репозитория на GitHub
2. Откройте раздел "Pages"
3. В "Source" выберите "GitHub Actions"

### 4. Обновите vite.config.ts

Добавьте базовый путь для GitHub Pages:

```typescript
export default defineConfig({
  base: '/oraza-pwa/', // Название вашего репозитория
  // ... остальная конфигурация
})
```



## Деплой на Vercel (Бесплатно)

1. Зарегистрируйтесь на [Vercel](https://vercel.com/)
2. Нажмите "Add New..." → "Project"
3. Импортируйте репозиторий с GitHub
4. Настройки:
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Нажмите "Deploy"

## Установка как PWA на телефон

### Android (Chrome)

1. Откройте сайт в Chrome
2. Нажмите на меню (три точки)
3. Выберите "Установить приложение" или "Добавить на главный экран"
4. Подтвердите установку

### iOS (Safari)

1. Откройте сайт в Safari
2. Нажмите кнопку "Поделиться" (квадрат со стрелкой)
3. Прокрутите вниз и выберите "На экран 'Домой'"
4. Нажмите "Добавить"



## Монетизация

Ссылка для поддержки проекта настроена в `src/pages/Support.tsx`:

```typescript
const supportLink = 'https://pay.cloudtips.ru/p/8a27e9ab';
```

Для изменения ссылки отредактируйте эту переменную.

## Роли пользователей

- **user** - Обычный пользователь
- **moderator** - Модератор (может управлять контентом)
- **admin** - Администратор (полный доступ)

## Лицензия

MIT License - свободное использование и модификация.

## Контакты
Telegram @EnrikeTomas
По вопросам и предложениям: support@oraza.ru

---

**Сесинъизге рахмет!** 🙏
