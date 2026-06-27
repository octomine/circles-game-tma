# 🎨 Color Clash

> **Мини-игра внутри Telegram**, где нужно успевать кликать по кругам правильного цвета. Простая механика, но залипательный геймплей — попробуй побить свой рекорд!

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PixiJS](https://img.shields.io/badge/PixiJS-8-orange?style=for-the-badge)
![Telegram](https://img.shields.io/badge/Telegram-Mini_App-blue?style=for-the-badge&logo=telegram)

---

## 🎮 Попробовать

🔗 **Онлайн:** [circles-game-tma.vercel.app](https://circles-game-tma.vercel.app)

Откройте ссылку в Telegram через [@YourBot](https://t.me/YourBot) или просто в мобильном браузере.

---

## ✨ Что внутри

- 🎯 **Простой, но залипательный геймплей** — кликай по кругам нужного цвета и собирай очки
- 📱 **Нативный Telegram** — haptic feedback, темы, интеграция с WebApp API
- 🎨 **Плавная графика** — PixiJS на WebGL, эффекты частиц при попаданиях
- 🌍 **Мультиязычность** — русский, английский, латышский через `next-intl`
- 💫 **Живые анимации** — bounce при попадании, shake при потере жизни, пульсация таймера
- 🏆 **Сохранение рекордов** — лучший результат хранится в `localStorage`
- 🎭 **Адаптация под Telegram** — автоматически подхватывает светлую/тёмную тему
- 📊 **Чистая архитектура** — код организован по Feature-Sliced Design

---

## 🛠️ Технологический стек

| Что               | Чем                                                   |
| ----------------- | ----------------------------------------------------- |
| **Фреймворк**     | Next.js 16 (App Router)                               |
| **Язык**          | TypeScript 5                                          |
| **Графика**       | PixiJS 8 (WebGL)                                      |
| **Состояние**     | Zustand                                               |
| **Переводы**      | next-intl                                             |
| **Стили**         | Tailwind CSS + shadcn/ui                              |
| **Пакеты**        | pnpm                                                  |
| **CI/CD**         | GitHub Actions + Vercel                               |
| **Качество кода** | ESLint (flat config) + Prettier + Husky + lint-staged |

---

## 📁 Как устроен проект

Проект построен по принципам **Feature-Sliced Design** — код разделён на слои по ответственности:

```
circles-game-tma/
│
├── app/                              # 🚪 Точки входа Next.js
│   ├── layout.tsx                    #    Root layout с провайдерами
│   ├── page.tsx                      #    Главная страница
│   └── game/page.tsx                 #    Страница игры
│
└── src/
    ├── pages/                        # 📄 Страницы (композиция виджетов)
    │   └── game/ui/GameView.tsx
    │
    ├── widgets/                      # 🧩 Самостоятельные UI-блоки
    │   ├── main-menu/                #    Главное меню
    │   ├── game-canvas/              #    Игровое поле на PixiJS
    │   │   ├── hooks/
    │   │   │   ├── useGameEngine.ts  #    Логика игры
    │   │   │   ├── helpers.ts        #    Спавн кругов, частицы
    │   │   │   └── types.ts
    │   │   └── ui/GameCanvasWidget.tsx
    │   ├── game-hud/                 #    HUD во время игры
    │   │   └── ui/
    │   │       ├── GameHUDWidget.tsx
    │   │       ├── ScoreDisplay.tsx
    │   │       ├── LivesDisplay.tsx
    │   │       └── TargetColorIndicator.tsx
    │   ├── game-over/                #    Экран окончания игры
    │   └── telegram-debug/           #    Debug-виджет
    │
    ├── entities/                     # 🧬 Бизнес-сущности
    │   └── game-session/             #    Игровая сессия
    │       ├── model/gameSessionStore.ts  # Zustand стор
    │       ├── config/constants.ts
    │       └── types/
    │
    └── shared/                       # 🔧 Переиспользуемый код
        ├── lib/
        │   ├── cn.ts                 #    clsx + tailwind-merge
        │   ├── best-score.ts         #    Работа с рекордами
        │   ├── telegram/             #    Telegram SDK
        │   │   ├── context.ts
        │   │   ├── hooks/useTelegram.ts
        │   │   └── TelegramProvider.tsx
        │   └── telegram-mock.ts      #    Мок для разработки
        └── i18n/                     #    Интернационализация
            ├── config.ts
            ├── request.ts
            └── locales/ru/
                ├── common.json
                ├── menu.json
                └── game.json
```

---

## 🚀 Как запустить

### Что нужно заранее

- **Node.js** ≥ 20.9.0
- **pnpm** ≥ 8.x
- **Git**

### Установка

```bash
# Клонируем репозиторий
git clone https://github.com/octomine/circles-game-tma.git
cd circles-game-tma

# Ставим зависимости
pnpm install

# На Windows — одобряем build-скрипты
pnpm approve-builds
# В меню выбираем: @parcel/watcher и @swc/core
```

### Разработка

```bash
pnpm dev
```

Откроется на `http://localhost:3000`. Приложение запустится с Telegram-моком, так что можно спокойно кодить без реального Telegram.

### Проверки перед коммитом

```bash
pnpm type-check    # Проверка типов
pnpm lint          # Линтер
pnpm lint --fix    # Автофикс
pnpm build         # Production-сборка
```

> 💡 **Совет:** при `git commit` автоматически запустится `lint-staged`, а при `git push` — полная проверка типов и сборка. Если что-то сломано — пуш не пройдёт.

---

## 🎮 Как играть

1. **Старт** — нажмите «Играть 🎮» в главном меню
2. **Цель** — кликайте по кругам **целевого цвета** (он показан в центре HUD)
3. **Очки** — +10 за каждое правильное попадание
4. **Жизни** — 3 ❤️, теряются при клике по неправильному цвету
5. **Смена цвета** — каждые 10 секунд целевой цвет меняется
6. **Исчезновение** — круги живут 8 секунд и плавно исчезают за 2 секунды до конца
7. **Game Over** — когда жизни закончатся, увидите финальный счёт и рекорд

---

## 🌍 Как добавить новый язык

Проект использует `next-intl` с неймспейсами:

- `common` — общие тексты (кнопки, лоадер)
- `menu` — главное меню
- `game` — игровые тексты (HUD, game over)

**Чтобы добавить язык:**

1. Создайте папку `src/shared/i18n/locales/{code}/`
2. Скопируйте JSON-файлы из `ru/`
3. Переведите значения
4. Добавьте код языка в `src/shared/i18n/config.ts`:

```typescript
export const locales = ['ru', 'en', 'lv'] as const;
```

---

## 📱 Telegram-интеграция

### Создаём бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте `/newbot` и следуйте инструкциям
3. Сохраните полученный токен

### Привязываем Web App

1. В @BotFather: `/mybots` → выберите своего бота
2. **Bot Settings** → **Menu Button** → **Configure Menu Button**
3. Введите URL: `https://your-app.vercel.app`
4. Введите название кнопки: `Играть 🎮`

---

## 🔄 CI/CD

### GitHub Actions

При каждом push в `main` или `dev` автоматически:

- ✅ Устанавливаются зависимости (`pnpm install`)
- ✅ Проверяются типы (`pnpm type-check`)
- ✅ Прогоняется линтер (`pnpm lint`)
- ✅ Собирается production-версия (`pnpm build`)

### Git Hooks (Husky)

- **pre-commit** — `lint-staged` прогоняет ESLint + Prettier по изменённым файлам
- **pre-push** — полная проверка типов и сборка

### Vercel

- Автоматический деплой при push в GitHub
- Preview deployments для каждого PR
- HTTPS из коробки
- Edge Network для быстрой загрузки по всему миру

---

## 🎨 Кастомизация

### Игровые параметры

Всё настраивается в `src/entities/game-session/config/constants.ts`:

```typescript
export const GAME_CONFIG = {
  COLORS: ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFF333'],
  DEFAULT_LIVES: 3,
  TIME_TO_CHANGE_COLOR: 10, // секунд
  CIRCLE_RADIUS: 40,
  SPAWN_INTERVAL_MS: 1000,
  MAX_CIRCLES_ON_SCREEN: 20,
  CIRCLE_LIFETIME_SEC: 8.0,
} as const;
```

### Темы Telegram

Цвета автоматически подхватываются из CSS-переменных Telegram:

```css
--tg-theme-bg-color
--tg-theme-text-color
--tg-theme-hint-color
--tg-theme-button-color
--tg-theme-button-text-color
--tg-theme-secondary-bg-color
```

---

## 🗺️ Что планируется

- 📱 Силовое поле с акселерометром для частиц
- 📊 Статистика игр
- ☁️ Telegram Cloud Storage для синхронизации рекордов между устройствами
- 🏆 Глобальный лидерборд

---

## 📄 Лицензия

MIT

---

**Сделано с ❤️ для Telegram Mini Apps** 🚀
