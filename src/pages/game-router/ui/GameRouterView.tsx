'use client';

import { type ComponentType } from 'react';
import { AnimatePresence, type Variants } from 'motion/react';
import * as motion from 'motion/react-client';

import { GameView } from '@/pages/game';
import { useGameNavigation, type GameScreen } from '@/shared/navigation';
import { AnimatedBackground } from '@/shared/ui';
import { GameOverWidget } from '@/widgets/game-over';
import { LeaderboardWidget } from '@/widgets/leaderboard-screen';
import { MainMenuWidget } from '@/widgets/main-menu';

const SCREEN_COMPONENTS: Record<GameScreen, ComponentType> = {
  menu: MainMenuWidget,
  game: GameView,
  gameover: GameOverWidget,
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
  gameover: {
    initial: { opacity: 0, y: 50 },
    animate: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 20 } },
    exit: (next: GameScreen) => {
      if (next === 'game') return { opacity: 0, scale: 0.8 }; // Zoom out
      return { opacity: 0 };
    },
  },
  leaderboard: {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { opacity: 0, x: 30 }, // Swipe right
  },
};

export const GameRouterView = () => {
  const { screen } = useGameNavigation();

  const Screen = SCREEN_COMPONENTS[screen];

  return (
    // isolate обязателен: он делает корень stacking context, иначе фолбэк-фон
    // корня (bg-background) рисовался бы ПОВЕРХ AnimatedBackground, у которого
    // отрицательный z-index, и PixiJS-слой был бы не виден.
    <div className="bg-background relative isolate h-screen w-full overflow-hidden">
      {/* Фон живёт на уровне роутера, а не внутри каждого экрана: Pixi-приложение
          инициализируется один раз и не пересоздаётся на каждом переходе, а
          экраны сменяются поверх него. bg-background — цвет на время, пока
          динамически импортируется pixi.js. */}
      <AnimatedBackground />

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
