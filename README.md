# 🎨 Поймай цвет

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![PixiJS](https://img.shields.io/badge/PixiJS-8-orange?style=for-the-badge&logo=pixijs)

---

## Что это

Мини-игра: нужно успевать кликать по кругам **целевого цвета**, пока не закончились жизни.

Как устроено:

- **Next.js 16 (App Router) в режиме статического экспорта** — в `next.config.ts` задано `output: 'export'`, `trailingSlash: true` и `assetPrefix: './'` для production-сборки. Приложение собирается в набор статических файлов, серверный рантайм не используется.
- **Одна страница.** `app/page.tsx` рендерит `GameRouterView`; экраны (`menu` | `game` | `gameover` | `leaderboard`) переключаются React-состоянием, URL не меняется.
- **Игровое поле — PixiJS 8 (WebGL)**, состояние — Zustand, анимации интерфейса — Motion, стили — Tailwind CSS v4, переводы — next-intl (сейчас только русский).
- **Рекорд и лидерборд — через GamePush SDK** (облако GamePush) с локальным fallback в `localStorage`.

Проверенные версии зависимостей (по установленным пакетам):

| Пакет                 | Версия |
| --------------------- | ------ |
| `next`                | 16.2.9 |
| `react` / `react-dom` | 19.2.4 |
| `pixi.js`             | 8.19.0 |
| `zustand`             | 5.0.14 |
| `next-intl`           | 4.13.0 |
| `motion`              | 14.6.0 |
| `tailwindcss`         | 4.3.0  |
| `typescript`          | 5.9.3  |
| `eslint`              | 9.39.4 |
| `prettier`            | 3.8.4  |

---

## Возможности

### Геймплей

- **Попадание** — клик по кругу целевого цвета. **Промах** — клик по любому другому цвету.
- **Круги** живут 2.5–7.5 с (`CIRCLE_LIFETIME_MS` 5000 ±50 %), радиус 50–150 px (`CIRCLE_RADIUS` 100 ±50 %), растут и убывают по синусоиде и меняют pivot в середине жизни. Новый круг спавнится каждые 500 мс игрового времени, максимум 20 кругов на экране.
- **Умный спавн** — если на экране уже ≥5 кругов и среди них нет целевого цвета, следующий круг гарантированно будет целевым; иначе целевой цвет выпадает с шансом 30 %.
- **Смена целевого цвета** каждые 10 с. В HUD — круговой таймер; последние 3 с индикатор краснеет.
- **Комбо (Acceleration Streak)** — серия попаданий, каждое из которых быстрее предыдущего минимум на 20 мс. Клик чаще 80 мс для комбо игнорируется (анти-спам), пауза больше 2000 мс сбрасывает серию. Комбо сбрасывается и само, если с последнего попадания прошло больше, чем длился предыдущий интервал.
- **Очки** — базово 10 за попадание, умножаются на множитель комбо: ×4 при комбо ≥7, ×3 при ≥5, ×2 при ≥3, иначе ×1.
- **Вехи комбо:** комбо 3 → +1 жизнь (не выше 5), комбо 5 → щит. Щит гасит один промах целиком: без потери жизни и без сброса комбо. Вехи комбо 7 и 10 фиксируются, но бонусов за ними пока нет.
- **Промах** — пауза 750 мс (`LOSE_LIFE_FREEZE_MS`), эффект разбитого сердца, −1 жизнь. После последней жизни игра уходит на экран результатов.
- **Гистограмма интервалов** внизу HUD: завершённые столбцы синие, активный столбец золотой, пока укладывается в предыдущий интервал, и красный, когда перерос его (такой клик сбросит комбо).
- **Пауза** — при скрытии вкладки игра встаёт на паузу, игровое время и комбо замирают; при возврате игра продолжается с того же места.

### Экраны

- **Меню** — старт игры, текущий рекорд, переход в лидерборд, кнопка настроек (заглушка).
- **Игра** — PixiJS-канвас и HUD: счёт, жизни, целевой цвет с круговым таймером, индикатор щита, гистограмма комбо.
- **Результаты** — счёт с анимацией накрутки (30 шагов за 1.5 с), отметка «новый рекорд», сохранение результата, кнопки «Играть снова» / «Лидерборд» / «В меню».
- **Лидерборд** — топ-20 по полю `score`, место текущего игрока и 5 ближайших соседей, кнопка обновления, повтор при ошибке загрузки.
- Переходы между экранами — Motion (fade, zoom, свайпы), фон — анимированный градиент.

### Известные ограничения

- **Telegram-интеграция не подключена.** `TelegramProvider` написан и экспортируется, но не включён в дерево провайдеров (`AppProviders` собирает только GamePush, Intl и Navigation), поэтому тема, данные пользователя и haptics из Telegram WebApp сейчас не используются. Единственный потребитель `useTelegram` — виджет `TelegramDebugWidget`, который нигде не рендерится. В CSS для переменных `--tg-theme-*` заданы тёмные фолбэки.
- **Язык один — русский** (`locales = ['ru']`).
- **Кнопка настроек** в главном меню ничего не делает (`TODO`).
- **Вехи `slowdown` и `all`** только фиксируются в состоянии — механики слоудауна нет.
- **`public/` пуста**: статических файлов нет, иконка — `app/favicon.ico`.
- **Метаданные страницы дефолтные**: `title: 'Create Next App'`, в `app/layout.tsx` указан `lang="en"`.
- **Автотестов нет** (подробнее в разделе «Тесты»).
- **Telegram-мок не активируется**: он включается только при `NEXT_PUBLIC_ENABLE_MOCK=true` и внутри неподключённого `TelegramProvider`.

---

## Установка

Требования:

- **Node.js ≥ 20.9** — минимальная версия для Next.js 16 (по документации в `node_modules/next/dist/docs`).
- **pnpm ≥ 9** — `pnpm-lock.yaml` имеет `lockfileVersion: '9.0'`.

Проверено на Node.js 24.14.1 и pnpm 11.6.0.

```bash
git clone https://github.com/octomine/circles-game-tma.git
cd circles-game-tma
pnpm install
```

> Шаг `pnpm approve-builds` для нативных зависимостей (`@parcel/watcher`, `@swc/core`) — **[не проверено]**.

---

## Быстрый старт

```bash
pnpm dev
```

Приложение поднимется на `http://localhost:3000` (порт по умолчанию Next.js; фактический запуск в этом окружении **[не проверено]**).

Чтобы открыть игру с телефона по локальной сети, недостаточно запустить dev-сервер с `-H 0.0.0.0`: запросы с чужого origin отклоняются, пока IP не добавлен в `allowedDevOrigins` в `next.config.ts`. Сейчас там указан один адрес — `192.168.3.14`.

Production-сборка:

```bash
pnpm build
```

Сборка идёт в статический экспорт: результат — папка `out/`, которую можно раздавать любым статическим сервером. **Сборка в этом окружении [не проверено]** (в репозитории есть `out/` от предыдущей сборки).

Скрипт `pnpm start` (`next start`) предназначен для сборки с Node-сервером и для режима `output: 'export'` не используется — **[не проверено]**.

Переменные окружения: в коде используется только `NEXT_PUBLIC_ENABLE_MOCK` (см. «Известные ограничения»). Файла `.env.example` в репозитории нет.

---

## Конфигурация

### Игровые параметры

Всё в [`src/entities/game-session/config/constants.ts`](src/entities/game-session/config/constants.ts), интервалы — в миллисекундах:

```ts
export const GAME_CONFIG = {
  // Цвета игры
  COLORS: ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFF333'],
  TARGET_COLOR_SPAWN_CHANCE: 0.3,
  MIN_CIRCLES_FOR_GUARANTEE: 5,

  // Жизни и время
  DEFAULT_LIVES: 3,
  MAX_LIVES: 5, // потолок для бонуса extraLife с вехи комбо
  TIME_TO_CHANGE_COLOR_MS: 10000,

  // Круги
  CIRCLE_RADIUS: 100,
  CIRCLE_RADIUS_VARIANCE: 0.5,
  CIRCLE_LIFETIME_MS: 5000,
  CIRCLE_LIFETIME_VARIANCE: 0.5,
  SPAWN_INTERVAL_MS: 500,
  MAX_CIRCLES_ON_SCREEN: 20,

  // Частицы
  PARTICLE_SIZE: 5,
  PARTICLE_LIFE_MS: 1000,
  MAX_PARTICLES: 50,

  // Эффект потери жизни
  LOSE_LIFE_FREEZE_MS: 750,
  LOSE_LIFE_HEART_MAX_SIZE: 500,
  LOSE_LIFE_HEART_DURATION_MS: 1000,
} as const;
```

### Параметры комбо

В [`src/entities/game-session/config/comboConfig.ts`](src/entities/game-session/config/comboConfig.ts):

```ts
export const COMBO_CONFIG = {
  MIN_DIFF: 20, // мс: минимальное ускорение для роста комбо
  MAX_INTERVAL: 2000, // мс: интервал больше — полный сброс
  MIN_CLICK_INTERVAL: 80, // мс: анти-спам
  POINTS_BASE: 10, // базовые очки за попадание
  MULTIPLIERS: [
    { minCombo: 7, mult: 4 },
    { minCombo: 5, mult: 3 },
    { minCombo: 3, mult: 2 },
    { minCombo: 1, mult: 1 },
  ],
  MILESTONES: { 3: 'extraLife', 5: 'shield', 7: 'slowdown', 10: 'all' },
} as const;
```

### GamePush

`projectId` и `publicToken` захардкожены в [`src/shared/gamepush/GamePushProvider.tsx`](src/shared/gamepush/GamePushProvider.tsx) (`PROJECT_ID = 31261`). SDK грузится с зеркал CDN; если токен не заполнен, SDK не загружается вообще, и приложение работает на локальном рекорде.

- `score` — числовое поле игрока в панели GamePush: используется и для рекорда, и для лидерборда. Запись — `player.set(...)` + `player.sync({ storage: 'cloud' })`, только если новый результат больше сохранённого.
- `fallback_bestScore` — ключ `localStorage`, куда пишется рекорд, когда облако недоступно (см. [`src/entities/player-score/model/constants.ts`](src/entities/player-score/model/constants.ts)).

### Тема и переводы

- Цвета интерфейса — в [`src/app/styles/globals.css`](src/app/styles/globals.css) через `@theme` Tailwind v4 (`tailwind.config` не нужен). Переменные `--tg-theme-*` объявлены там же тёмными фолбэками; рантайм-подстановка значений из Telegram не подключена.
- Тексты — [`src/shared/i18n/locales/ru/`](src/shared/i18n/locales/ru): `common.json`, `menu.json`, `game.json`, `leaderboard.json`. Неймспейсы подключаются вручную в [`src/shared/i18n/request.ts`](src/shared/i18n/request.ts), список языков — в [`src/shared/i18n/config.ts`](src/shared/i18n/config.ts).

---

## Тесты

Автотестов и тест-раннера в проекте нет: конфигов vitest/jest/playwright нет, тестовых файлов вне `node_modules` тоже нет. Вместо тестов используются статические проверки и хуки:

```bash
pnpm type-check    # tsc --noEmit
pnpm lint          # eslint
pnpm format:check  # prettier --check
pnpm build         # production-сборка
```

Что проверено в этом окружении:

- `pnpm type-check` — **ошибок нет** (запускалось как `tsc --noEmit`; штатный скрипт в режиме read-only не смог перезаписать `tsconfig.tsbuildinfo`).
- `pnpm lint` — **0 ошибок, 1 warning**: неиспользуемый параметр `_e` в `src/widgets/game-canvas/ui/GameCanvasWidget.tsx`.
- `pnpm build` — **[не проверено]**.

Автоматизация:

- **pre-commit** (`.husky/pre-commit`) — `pnpm exec lint-staged`: `eslint --fix` и `prettier --write` по изменённым файлам.
- **pre-push** (`.husky/pre-push`) — `pnpm type-check`, затем `pnpm build`.
- **CI** (`.github/workflows/ci.yml`) — на push в `main` и на pull request в `main`: `pnpm install` → `pnpm type-check` → `pnpm lint` → `pnpm build`.

---

## Структура проекта

Код организован по Feature-Sliced Design: `app/` — точки входа Next.js, `src/` — слои по ответственности.

```
circles-game-tma/
├── app/                                       # точки входа Next.js
│   ├── layout.tsx                             # html/body, шрифт Nunito, провайдеры
│   ├── providers.tsx                          # AppProviders: GamePush + Intl + Navigation
│   ├── page.tsx                               # рендерит GameRouterView
│   └── favicon.ico
└── src/
    ├── app/                                   # инфраструктура приложения
    │   ├── providers/                         # IntlProvider, TelegramProvider*
    │   ├── styles/globals.css                 # тема Tailwind v4, фолбэки --tg-theme-*
    │   └── types/telegram.d.ts
    ├── pages/                                 # композиция экранов
    │   ├── game/ui/GameView.tsx
    │   └── game-router/ui/GameRouterView.tsx  # переключение экранов и Motion-переходы
    ├── widgets/
    │   ├── main-menu/                         # главное меню
    │   ├── game-canvas/                       # PixiJS-поле
    │   │   ├── lib/                           # GameObject, Circle, Particle, CrackedHeart
    │   │   ├── hooks/useGameEngine.ts         # игровой цикл, спавн, freeze, пауза
    │   │   └── ui/GameCanvasWidget.tsx
    │   ├── game-hud/                          # ScoreDisplay, LivesDisplay,
    │   │                                      # TargetColorIndicator, ShieldIndicator
    │   ├── game-over/                         # экран результатов
    │   ├── leaderboard-screen/                # экран лидерборда
    │   └── telegram-debug/                    # debug-виджет (нигде не рендерится)
    ├── features/
    │   ├── leaderboard/                       # useFetchLeaderboard, usePlayerRating, mappers
    │   └── save-score/                        # useSaveScore
    ├── entities/
    │   ├── game-session/                      # Zustand-стор
    │   │   ├── model/                         # gameSessionStore.ts, defaults.ts
    │   │   ├── config/                        # constants.ts, comboConfig.ts
    │   │   ├── types/                         # gameSessionStore.types.ts
    │   │   └── ui/ComboHistogram/             # гистограмма интервалов комбо
    │   └── player-score/                      # рекорд: облако GamePush + fallback
    └── shared/
        ├── gamepush/                          # загрузка SDK и обёртка над gp
        ├── i18n/                              # config.ts, request.ts, locales/ru/
        ├── lib/                               # cn.ts, number.ts, telegram/, telegram-mock.ts
        ├── navigation/                        # экраны в React-состоянии
        └── ui/                                # Button, Card, Text, Title, Animated*
```

\* `TelegramProvider` экспортируется, но в дерево провайдеров не включён — см. «Известные ограничения».

### Архитектура игровых объектов

Все игровые объекты наследуются от абстрактного `GameObject` (`extends PIXI.Graphics`) и инкапсулируют свой жизненный цикл `spawn → update → reset`:

- `Circle` — кликабельный круг: рисует себя, считает возраст, анимирует масштаб и меняет pivot в середине жизни;
- `Particle` — визуальный эффект попадания;
- `CrackedHeart` — эффект потери жизни.

Пулы объектов создаются один раз при инициализации канваса, в игровом цикле новые объекты не создаются. Во время freeze обновляются только частицы и сердце — это ветвление реализовано в `useGameEngine` вручную; объявленный в `GameObject` флаг `ignoresFreeze` движок не читает.

---

## Лицензия

MIT — см. [LICENSE](LICENSE).
