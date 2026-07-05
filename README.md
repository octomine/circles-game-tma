# 🎨 Color Clash

> **Мини-игра внутри Telegram**, где нужно успевать кликать по кругам правильного цвета. Простая механика, но залипательный геймплей — попробуй побить свой рекорд!

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PixiJS](https://img.shields.io/badge/PixiJS-8-orange?style=for-the-badge)
![Telegram](https://img.shields.io/badge/Telegram-Mini_App-blue?style=for-the-badge&logo=telegram)

---

## 🎮 Попробовать

🔗 **Онлайн:** [circles-game-tma.vercel.app](https://circles-game-tma.vercel.app)

Откройте ссылку в Telegram через [@color_clash_game_bot](https://t.me/color_clash_game_bot) или просто в мобильном браузере.

---

## ✨ Что внутри

- 🎯 **Залипательный геймплей** — кликай по кругам нужного цвета и собирай очки
- 🌊 **Живые круги** — синусоидальная анимация роста/уменьшения + эффект "движения" через pivot
- 💔 **Эффект потери жизни** — freeze-кадр и разбитое сердце при промахе
- 🎨 **Разнообразие** — круги разного размера и с разным временем жизни (дисперсия)
- 🎯 **Умный спавн** — гарантия появления нужного цвета при заполненном экране
- 📱 **Нативный Telegram** — haptic feedback, темы, интеграция с WebApp API
- 🖼️ **Плавная графика** — PixiJS на WebGL, эффекты частиц при попаданиях
- ⭕ **Circular progress bar** — наглядный таймер до смены цвета вокруг индикатора
- 🌍 **Мультиязычность** — русский, английский, латышский через `next-intl`
- 🏆 **Сохранение рекордов** — лучший результат хранится в `localStorage`
- 🎭 **Адаптация под Telegram** — автоматически подхватывает светлую/тёмную тему
- 📊 **Чистая архитектура** — код организован по Feature-Sliced Design, игровые объекты — через ООП

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
| **Аналитика**     | Vercel Analytics + Speed Insights                     |
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
    │   │   ├── lib/                  #    Игровые объекты (ООП)
    │   │   │   ├── GameObject.ts     #    Абстрактный базовый класс
    │   │   │   ├── Circle.ts         #    Кликабельный круг
    │   │   │   ├── Particle.ts       #    Визуальный эффект частицы
    │   │   │   ├── CrackedHeart.ts   #    Эффект разбитого сердца 💔
    │   │   │   └── index.ts
    │   │   ├── hooks/
    │   │   │   ├── useGameEngine.ts  #    Тонкий оркестратор игры
    │   │   │   └── types.ts
    │   │   └── ui/GameCanvasWidget.tsx
    │   ├── game-hud/                 #    HUD во время игры
    │   │   └── ui/
    │   │       ├── GameHUDWidget.tsx
    │   │       ├── ScoreDisplay.tsx
    │   │       ├── LivesDisplay.tsx
    │   │       └── TargetColorIndicator.tsx  # С circular progress bar
    │   ├── game-over/                #    Экран окончания игры
    │   └── telegram-debug/           #    Debug-виджет
    │
    ├── entities/                     # 🧬 Бизнес-сущности
    │   └── game-session/             #    Игровая сессия
    │       ├── model/
    │       │   ├── gameSessionStore.ts  # Zustand стор
    │       │   └── defaults.ts
    │       ├── config/constants.ts   #    Вся конфигурация игры
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

### 🎮 Архитектура игровых объектов

Все игровые объекты наследуются от абстрактного `GameObject` и инкапсулируют свой жизненный цикл:

```
GameObject (абстрактный, extends PIXI.Graphics)
│
├── Circle           — кликабельный, учитывает freeze
├── Particle         — визуальный эффект, обновляется при freeze
└── CrackedHeart     — эффект потери жизни, обновляется при freeze
```

**Ключевые принципы:**

- Каждый объект сам управляет своим жизненным циклом (`spawn` → `update` → `reset`)
- Пулы объектов переиспользуются — никаких `new` в игровом цикле
- Флаг `ignoresFreeze` разделяет интерактивные и визуальные объекты
- `useGameEngine` — тонкий оркестратор, не содержит логики жизненного цикла

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

> 💡 **Совет:** чтобы открыть игру с телефона в локальной сети, добавь флаг `-H 0.0.0.0` в скрипт `dev` в `package.json` и заходи по IP компьютера (`http://192.168.x.x:3000`).

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
5. **Смена цвета** — каждые 10 секунд целевой цвет меняется (круговой прогресс-бар показывает оставшееся время)
6. **Круги** — плавно появляются и исчезают (синусоидальная анимация), каждый со своим размером и временем жизни
7. **Промах** — игра замирает на 0.3 секунды, появляется эффект разбитого сердца 💔
8. **Game Over** — когда жизни закончатся, после freeze-эффекта увидите финальный счёт и рекорд

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
- Встроенные Vercel Analytics и Speed Insights

---

## 🎨 Кастомизация

### Игровые параметры

Всё настраивается в `src/entities/game-session/config/constants.ts`. Все временные интервалы — в **миллисекундах**:

```typescript
export const GAME_CONFIG = {
  // Цвета игры
  COLORS: ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFF333'],
  TARGET_COLOR_SPAWN_CHANCE: 0.3, // Шанс спавна нужного цвета (30%)
  MIN_CIRCLES_FOR_GUARANTEE: 5, // Мин. кругов для гарантии нужного цвета

  // Жизни и время
  DEFAULT_LIVES: 3,
  TIME_TO_CHANGE_COLOR_MS: 10000, // 10 секунд

  // Круги
  CIRCLE_RADIUS: 100,
  CIRCLE_RADIUS_VARIANCE: 0.5, // ±50% от базового размера
  CIRCLE_LIFETIME_MS: 5000, // 5 секунд
  CIRCLE_LIFETIME_VARIANCE: 0.5, // ±50% от базового времени жизни
  SPAWN_INTERVAL_MS: 1000,
  MAX_CIRCLES_ON_SCREEN: 20,

  // Частицы
  PARTICLE_SIZE: 5,
  PARTICLE_LIFE_MS: 1000,
  MAX_PARTICLES: 50,

  // Эффект потери жизни
  LOSE_LIFE_FREEZE_MS: 750, // Длительность freeze-кадра
  LOSE_LIFE_HEART_MAX_SIZE: 500, // Макс. размер разбитого сердца
  LOSE_LIFE_HEART_DURATION_MS: 1000, // Длительность эффекта сердца
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

- 📱 Силовое поле с акселерометром для частиц (только мобильная версия)
- 🎁 Бонусы и штрафы (новые типы игровых объектов)
- 📊 Детальная статистика игр (аналитика через Telemetr.io / Vercel)
- ☁️ Telegram Cloud Storage для синхронизации рекордов между устройствами
- 🏆 Глобальный лидерборд
- 🔊 Звуковые эффекты

---

## 📄 Лицензия

MIT

---

**Сделано с ❤️ для Telegram Mini Apps** 🚀
