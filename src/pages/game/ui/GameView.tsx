'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence } from 'motion/react';

import { useGameSessionStore, type GameStatus } from '@/entities/game-session';
import { startGameplay, stopGameplay, useGamePush } from '@/shared/gamepush';
import { GameCanvasWidget } from '@/widgets/game-canvas';
import { GameHUDWidget } from '@/widgets/game-hud';
import { GameOverWidget } from '@/widgets/game-over';

export const GameView = () => {
  const { gp } = useGamePush();

  const status = useGameSessionStore((state) => state.status);
  const startGame = useGameSessionStore((state) => state.startGame);

  // Предыдущий статус: по нему отличаем вход в игру от возврата из паузы.
  const prevStatusRef = useRef<GameStatus>(status);

  const isGameOver = status === 'gameover';

  // Экран игры мог открыться поверх незавершённой сессии: из лидерборда (там
  // кнопка «Играть снова» уже зовёт startGame, но страховка бесплатна) и после
  // HMR-перезагрузки модуля. Статус читаем из стора, а не из замыкания: мост
  // GamePush ниже только что мог его изменить.
  useEffect(() => {
    if (useGameSessionStore.getState().status === 'gameover') {
      startGame();
    }
  }, [startGame]);

  // Мост «стор → GamePush»: границы геймплей-сессии раунда.
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Свёрнутая вкладка — игра не идёт (стор ставит 'paused' по visibilitychange):
    // пауза не должна засчитываться площадке как геймплей.
    if (status === 'paused' && prevStatus === 'playing') {
      stopGameplay(gp);
    }

    // Game over закрывает сессию сам оверлей (GameOverWidget) — там же, где
    // сохраняется рекорд, чтобы порядок «стоп → сохранение» жил в одном месте.
    //
    // А вот возврат ИЗ game over обязан открыть сессию заново: иначе раунд
    // «Играть снова» шёл бы для площадки без геймплей-сессии. startGameplay
    // идемпотентен (модульный флаг в gameplay.ts), поэтому лишним он не будет.
    if (status === 'playing' && (prevStatus === 'paused' || prevStatus === 'gameover')) {
      startGameplay(gp);
    }
  }, [status, gp]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {/* Канвас с игрой (фон) */}
      <GameCanvasWidget />

      {/* HUD во время игры */}
      {status === 'playing' && <GameHUDWidget />}

      {/* Оверлей результатов живёт ВНУТРИ GameView, а не отдельным экраном роутера.
          Причина в PixiJS: канвас — сиблинг оверлея, а не его родитель, поэтому
          появление и исчезновение модалки его не перемонтирует. Навигация всё это
          время остаётся на 'game', GameCanvasWidget не размонтируется, и его
          cleanup не уничтожает PIXI.Application — за оверлеем остаётся застывший
          кадр партии (тикер сам выходит по status !== 'playing').
          AnimatePresence держим здесь, а не в виджете: exit-анимация должна
          отыграть тогда, когда условие уже стало false — то есть когда GameView
          перестал рендерить оверлей, но AnimatePresence ещё дожидается анимации. */}
      <AnimatePresence>{isGameOver && <GameOverWidget />}</AnimatePresence>
    </div>
  );
};
