'use client';

import { type ComponentType, useEffect } from 'react';
import { AnimatePresence, type Variants } from 'motion/react';
import * as motion from 'motion/react-client';

import { AUDIO_CONFIG } from '@/entities/game-session';
import { useGameAudio } from '@/features/sound-control';
import { GameView } from '@/pages/game';
import { useGamePush } from '@/shared/gamepush';
import { audioService } from '@/shared/lib/audio';
import { useGameNavigation, type GameScreen } from '@/shared/navigation';
import { AnimatedBackground } from '@/shared/ui';
import { LeaderboardWidget } from '@/widgets/leaderboard-screen';
import { MainMenuWidget } from '@/widgets/main-menu';

/**
 * GameStart отправляем один раз за жизнь страницы: сигнал означает «игра
 * загрузилась и готова к работе», а не «начался раунд». Возврат в меню после
 * партии не должен повторять его, поэтому флаг модульный, а не useRef.
 */
let isGameStartSent = false;

/**
 * Карта экранов.
 *
 * Экрана 'gameover' здесь нет намеренно: проигрыш — не отдельный экран, а оверлей
 * внутри GameView. Канвас при этом остаётся смонтированным, иначе PixiJS
 * уничтожил бы приложение вместе с застывшим кадром партии.
 */
const SCREEN_COMPONENTS: Record<GameScreen, ComponentType> = {
  menu: MainMenuWidget,
  game: GameView,
  leaderboard: LeaderboardWidget,
};

/**
 * Матрица переходов между экранами.
 *
 * `exit` — функция, потому что уход экрана зависит от того, КУДА мы уходим:
 * в меню это «зум» при старте игры и свайп влево при открытии таблицы лидеров.
 * Целевой экран (nextScreen) motion подставляет в exit-вариант из custom
 * у AnimatePresence: для exit берётся именно presenceContext.custom, а не
 * собственный custom элемента.
 */
const screenVariants: Record<GameScreen, Variants> = {
  menu: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: (next: GameScreen) => {
      if (next === 'game') return { opacity: 0, scale: 0.8 }; // Zoom out
      if (next === 'leaderboard') return { opacity: 0, x: -30 }; // Swipe left
      return { opacity: 0 };
    },
  },
  game: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.3 } },
    // Только fade: внутри Pixi-канвас, а любой transform на обёртке (например,
    // scale) растягивал бы уже отрисованную картинку и давал бы размытие.
    exit: { opacity: 0, transition: { duration: 0.2 } },
  },
  leaderboard: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: 30 }, // Swipe right
  },
};

export const AppRouter = () => {
  const { gp } = useGamePush();

  const { screen } = useGameNavigation();

  // Подписка на звук живёт здесь, на верхнем уровне экранов: попап настроек
  // открывают редко, а модульный аудио-сервис должен знать актуальные флаги всё
  // время, пока игра смонтирована — иначе игровой цикл проиграет заглушённый звук.
  useGameAudio();

  const Screen = SCREEN_COMPONENTS[screen];

  useEffect(() => {
    // Аудио-сервис создаём один раз на жизнь страницы: Howl-объекты дорогие, а
    // экраны сменяются внутри этого компонента. Сервис сам защищён от повторного
    // init (StrictMode, HMR), поэтому destroy в очистке не нужен — он убил бы
    // звук при повторном маунте роутера, хотя страница осталась той же.
    //
    // Музыка здесь НЕ запускается: автовоспроизведение заблокировано, пока игрок
    // не сделал жест. playMusic() зовёт кнопка «Играть».
    audioService.init(AUDIO_CONFIG);
  }, []);

  useEffect(() => {
    // GameStart — обязательный пункт чек-листа GamePush. Это сигнал «игра
    // загрузилась и готова к работе», поэтому ждём первый ОТРИСОВАННЫЙ кадр:
    // приложение уже ждёт язык из SDK и до этого держит заглушку, а тут меню
    // на экране и кнопка «Играть» действительно нажимается.
    if (!gp || isGameStartSent) return;

    let innerFrameId: number | null = null;

    // Двойной rAF: колбэк первого кадра выполняется ДО отрисовки, второго — после,
    // то есть разметка уже на экране. Одного rAF мало — сигнал ушёл бы в кадр,
    // который ещё не показан игроку.
    const outerFrameId = requestAnimationFrame(() => {
      innerFrameId = requestAnimationFrame(() => {
        innerFrameId = null;

        // Флаг ставим здесь, а не синхронно: иначе cleanup StrictMode отменил бы
        // кадр, а повторный прогон вышел бы по флагу — сигнал не ушёл бы вовсе.
        if (isGameStartSent) return;

        isGameStartSent = true;

        try {
          gp.gameStart();
        } catch (error) {
          // Сбой сигнала не должен ронять экран: это инфраструктура площадки.
          console.warn('[GamePush] gameStart не выполнился:', error);
        }
      });
    });

    return () => {
      cancelAnimationFrame(outerFrameId);

      if (innerFrameId !== null) cancelAnimationFrame(innerFrameId);
    };
  }, [gp]);

  return (
    // isolate обязателен: он делает корень stacking context, иначе фолбэк-фон
    // корня (bg-background) рисовался бы ПОВЕРХ AnimatedBackground, у которого
    // отрицательный z-index, и PixiJS-слой был бы не виден.
    <div className="bg-background relative isolate h-dvh w-full overflow-hidden">
      {/* Фон живёт на уровне роутера, а не внутри каждого экрана: Pixi-приложение
          инициализируется один раз и не пересоздаётся на каждом переходе, а
          экраны сменяются поверх него. bg-background — цвет на время, пока
          динамически импортируется pixi.js. */}
      {/* В игре фон размонтируем, а не прячем: под игровым канвасом он бесполезен,
          но продолжал бы тикать свой Pixi-тикер и жечь кадры. Экран игры рисует
          сплошной bg-background. */}
      {screen !== 'game' && <AnimatedBackground />}

      {/* mode="wait": уходящий экран сначала доигрывает свой exit, и только потом
          монтируется новый. Без этого оба экрана (absolute inset-0) жили бы
          одновременно и накладывались друг на друга.
          custom={screen} — это и есть nextScreen для exit-функции уходящего
          экрана: AnimatePresence прокидывает его в presence-контекст. */}
      <AnimatePresence mode="wait" custom={screen}>
        <motion.div
          key={screen}
          custom={screen}
          variants={screenVariants[screen]}
          initial="initial"
          animate="animate"
          exit="exit"
          // absolute inset-0 — экраны накладываются друг на друга поверх фона;
          // overflow-y-auto — длинные экраны (таблица лидеров) скроллятся сами.
          className="absolute inset-0 h-full w-full overflow-y-auto"
        >
          <Screen />
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
