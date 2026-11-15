# Поймай цвет — Telegram Mini App

Аркада «кликни круг целевого цвета»: Next.js 16 собирается в статический экспорт (SPA без сервера), игровое поле — PixiJS 8, состояние раунда — Zustand, рекорд и лидерборд — облако GamePush.

## Стек

- Next.js 16.2.9 (App Router, `output: 'export'`), React 19.2.4, TypeScript 5.9.3 (strict)
- PixiJS 8.19.0 — игровое поле (WebGL); игровые объекты наследуют `GameObject` (`extends PIXI.Graphics`), фон экранов — отдельный Pixi-инстанс в `AnimatedBackground`
- Zustand 5.0.14 — единственный стор `useGameSessionStore`
- Motion 14.6.0 (`motion/react`, `motion/react-client`) — переходы экранов, анимации UI; `MotionValue` — для высоты башни комбо без ре-рендеров
- Tailwind CSS 4.3.0 через `@theme` в `src/app/styles/globals.css` (файла `tailwind.config` нет); `clsx` + `tailwind-merge` внутри `cn()`
- next-intl 4.13.0 — локали `ru` и `en`; язык берётся из GamePush (`gp.language`), `en` — фолбэк для неподдерживаемых кодов
- GamePush SDK — внешний скрипт с зеркал CDN (HEAD-пробы + failover), обёртка в `src/shared/gamepush`: `player`, `leaderboard`, `sounds`, `language`, `gameStart`/`gameplayStart`/`gameplayStop`
- `@heroicons/react` 2.2.0 — иконки UI и SVG-строка щита для Pixi-сцены (`EffectsLayer`)
- Звука как ассетов нет: `audioService` — заглушка с `console.log`, а состояние мьюта живёт в `gp.sounds`
- ESLint 9.39.4 (flat config) + Prettier 3.8.4 + Husky 9/lint-staged 17; `@vercel/analytics` и `@vercel/speed-insights` в зависимостях, но в коде не используются
- БД, API-роутов и серверного рантайма нет

## Структура

- `app/` — точки входа Next.js: `layout.tsx` (локальный Nunito из `app/fonts/`, viewport, провайдеры), `providers.tsx` (`AppProviders`: GamePush → Intl → Navigation), `page.tsx`, `favicon.ico`
- `pages/` (в корне) — папка-заглушка с одним `README.md`: снимает конфликт App Router с FSD-слоем `src/pages`; маршрутов и кода в ней нет
- `src/app/` — инфраструктура: `providers/` (`IntlProvider`, `TelegramProvider` — не смонтирован), `styles/globals.css` (тема Tailwind + фолбэки `--tg-theme-*`), `types/telegram.d.ts`
- `src/pages/` — композиция экранов: `game/` (`GameView`: канвас + HUD, мосты «стор → навигация» и «стор → GamePush»), `game-router/` (`GameRouterView`: карта экранов, Motion-переходы, `AnimatedBackground`, `useGameAudio`)
- `src/widgets/` — `main-menu` (`MainMenuWidget`, `SettingsPopup`), `game-canvas` (`ui/GameCanvasWidget`, `hooks/useGameEngine.ts`, `lib/`: `GameObject`, `Circle`, `Particle`, `CrackedHeart`, `EffectsLayer`, `FloatingMessage`), `game-hud` (`ScoreDisplay`, `LivesDisplay`, `TargetColorIndicator`), `game-over`, `leaderboard-screen`, `telegram-debug` (нигде не рендерится)
- `src/features/` — `leaderboard` (топ и рейтинг игрока), `save-score`, `sound-control` (`audioService`, `useGameAudio`, `useGameSounds`)
- `src/entities/` — `game-session` (`model/` — стор, `config/` — `constants`/`comboConfig`/`uiConfig`, `types/`, `ui/ComboHistogram` и `ui/ComboTower`), `player-score` (рекорд: GamePush + `localStorage`)
- `src/shared/` — `gamepush` (SDK, `useGamePush`, `startGameplay`/`stopGameplay`), `i18n` (`config.ts`, `request.ts`, `messages.ts`, `locales/ru` и `locales/en`), `lib` (`cn`, `number`, `telegram/`, `telegram-mock.ts`), `navigation` (`GameNavigationProvider`, `useGameNavigation`, тип `GameScreen`), `ui` (`Button`, `Card`, `Toggle`, `Typography` → `Text`/`Title`, `AnimatedBackground`, `AnimatedStack`, `AnimatedText`)
- Каждый слайс закрыт `index.ts` (public API); импорт из чужого слайса — только через него; общий баррель `shared` — `src/shared/index.ts`
- `public/` пуста (иконка — `app/favicon.ico`); `README.md` — описание для людей, сверено с кодом 2026-11-15; `promt.md` — ТЗ уже сделанной фичи комбо (в git не входит)

## Команды

- `pnpm install` — зависимости; канонический lockfile `pnpm-lock.yaml` (Node ≥ 20.9, pnpm ≥ 9) [не проверено]
- `pnpm dev` — dev-сервер, порт по умолчанию 3000 [не проверено]
- `pnpm build` — статический экспорт в `out/` [не проверено]
- `pnpm start` — `next start`; для сборки с `output: 'export'` не предназначен [не проверено]
- `pnpm type-check` — `tsc --noEmit`; проверено: ошибок нет
- `pnpm lint` / `pnpm lint --fix` — ESLint; проверено: 0 ошибок, 1 warning
- `pnpm format` / `pnpm format:check` — Prettier; проверено на `README.md`
- Тестов нет: ни раннера, ни файлов `*.test.*`/`*.spec.*`
- Хуки: pre-commit → `lint-staged`, pre-push → `type-check` + `build`; CI (GitHub Actions) — push и PR в `main`

## Конвенции

- Импорты: `react` → внешние → `@/*` → относительные, между группами пустая строка (`import/order: error`)
- Компоненты: `export const Name = () => {}`, пропсы `interface NameProps`; `export default` только в `app/*.tsx` (требование Next)
- Баррель слайса экспортирует компонент и его типы рядом: `export type { ButtonProps }`
- Zustand: селектор по одному полю (`useGameSessionStore((s) => s.score)`); в колбэках и игровом цикле — `getState()`; внутри стора — `get()`
- Обработчики — `handleX` и `useCallback`; так же оборачиваются колбэки игрового цикла и хуков фич
- Ошибки наружу не бросаются: результат-объект (`SaveScoreResult`) или строка для UI; лог — `console.warn/error('[модуль] …')` (`[GamePush]`, `[leaderboard]`, `[TG]`, `[save-score]`)
- Стили — только утилиты Tailwind и `cn()` из `@/shared`; цвета и радиусы — токены темы (`bg-primary`, `text-text-muted`)
- Комментарии по-русски и объясняют «почему» (инварианты, компенсации, порядок), а не «что»
- Игровое событие обновляет стор одним `set`: счёт, жизни и комбо меняются вместе (`processCorrectClick`)
- `any` запрещён (`@typescript-eslint/no-explicit-any: error`), `import/no-cycle: error`; `react-hooks/exhaustive-deps` и `set-state-in-effect` намеренно выключены

## Подводные камни

- **Next.js 16 — не тот, что в обучающих данных**: API, конвенции и структура файлов отличаются. Перед кодом читать `node_modules/next/dist/docs/` и соблюдать deprecation-нотисы
- Интервалы комбо считаются по `gameTime` из стора (`tickTime`), а не по `Date.now()`: пауза и freeze не должны их растягивать
- `tickTime` работает только при `status === 'playing'`; freeze, пауза и скрытая вкладка останавливают игровое время, `visibilitychange` ставит и снимает паузу
- `next.config.ts`: `assetPrefix: './'` только для прода (`next/font` падает в dev — причина в комментарии), `trailingSlash: true`, `images.unoptimized`, `allowedDevOrigins: ['192.168.3.14']` (для LAN-доступа добавить свой IP)
- Игровой цикл не создаёт объектов: пулы `Circle`/`Particle`/`CrackedHeart` собираются один раз при инициализации канваса; `ignoresFreeze` объявлен, но движок его не читает — freeze разветвлён вручную в `useGameEngine`
- `ComboTower` (он в HUD) подписан только на событийные поля стора, а `gameTime` читает через rAF: подписка на `gameTime` даст ~60 ре-рендеров в секунду. `ComboHistogram` экспортируется, но нигде не рендерится — его заменила башня
- `TelegramProvider` есть, но не смонтирован в `AppProviders`: `useTelegram()` вне провайдера бросает исключение, тема и haptics из Telegram не применяются, `NEXT_PUBLIC_ENABLE_MOCK` из-за этого не активируется
- next-intl: новый неймспейс вручную добавляется в `src/shared/i18n/messages.ts` (по обоим локалям), язык — в `config.ts`; `timeZone` обязателен, иначе `ENVIRONMENT_FALLBACK`; сервер всегда рендерит `ru`, локаль игрока подгружается на клиенте чанком
- Ключи GamePush захардкожены (`PROJECT_ID`, `PUBLIC_TOKEN` в `src/shared/gamepush/GamePushProvider.tsx`); поля: `score` (панель GamePush) и `fallback_bestScore` (localStorage)
- Два lockfile: `pnpm-lock.yaml` актуален, `package-lock.json` не обновлялся с первого коммита — пакетный менеджер только pnpm

## Не трогать

- `app/layout.tsx`, `app/page.tsx` — входные точки Next: `export default` тут обязателен, конвенции компонентов на них не распространяются
- `src/shared/lib/telegram-mock.ts`, `src/widgets/telegram-debug/` — легаси Telegram-интеграции: не подключать и не удалять без отдельной задачи
- `promt.md` — ТЗ уже сделанной фичи комбо (в `.gitignore`), не документация проекта
- `out/`, `.next/`, `tsconfig.tsbuildinfo` — артефакты сборки
- `LICENSE` — MIT; менять только по решению владельца

## Состояние работ (2026-11-15)

- Ветка `dev`; в origin ветка по умолчанию — `main`. Последний коммит — «implement setttings and sound controls» (2026-11-14)
- До этого: интеграция SDK площадки (GamePush: язык, звук, gameplay-сигналы), `FloatingMessage`, мобильная вёрстка и безопасные зоны, статический шрифт, обновлённый HUD, отладка комбо, комбо-механика с вехами
- Сделано вне кода игры: README и AGENTS.md сверены с кодом, добавлен `LICENSE` (MIT)
- Не реализовано: подключение Telegram-интеграции, вехи `slowdown`/`all`, звуковые ассеты (`audioService` — заглушка), автотесты; метаданные страницы дефолтные (`title: 'Create Next App'`)
- Рабочее дерево: изменены `AGENTS.md` и `README.md`; `LICENSE` не отслеживается git
