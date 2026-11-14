'use client';

import { useEffect, useRef } from 'react';

import { useGameSessionStore, type GameStatus } from '@/entities/game-session';
import { startGameplay, stopGameplay, useGamePush } from '@/shared/gamepush';
import { useGameNavigation } from '@/shared/navigation';
import { GameCanvasWidget } from '@/widgets/game-canvas';
import { GameHUDWidget } from '@/widgets/game-hud';

export const GameView = () => {
  const { gp } = useGamePush();

  const status = useGameSessionStore((state) => state.status);
  const startGame = useGameSessionStore((state) => state.startGame);

  const { setScreen } = useGameNavigation();

  // Предыдущий статус: по нему отличаем вход в игру от возврата из паузы.
  const prevStatusRef = useRef<GameStatus>(status);

  // Кнопка «Играть снова» только переключает навигацию, а сессия осталась в 'gameover':
  // поэтому новый раунд запускаем здесь, при монтировании экрана игры.
  useEffect(() => {
    if (useGameSessionStore.getState().status === 'gameover') {
      startGame();
    }
  }, [startGame]);

  // Мост: игровая сессия сообщает о проигрыше, навигация переключает экран
  useEffect(() => {
    // Статус читаем из стора: эффект выше мог только что перезапустить игру,
    // и устаревшее значение из замыкания вернуло бы игрока на экран результатов.
    if (useGameSessionStore.getState().status !== 'gameover') return;

    setScreen('gameover');
  }, [status, setScreen]);

  // Мост «стор → GamePush»: границы геймплей-сессии раунда.
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Game over закрывает сессию сразу, не дожидаясь exit-анимации экрана:
    // раунд для игрока уже кончился.
    if (status === 'gameover') {
      stopGameplay(gp);
    }

    // Свёрнутая вкладка — игра не идёт (стор ставит 'paused' по visibilitychange):
    // пауза не должна засчитываться площадке как геймплей.
    if (status === 'paused' && prevStatus === 'playing') {
      stopGameplay(gp);
    }

    // Возврат из паузы открывает сессию заново. На монтировании этого не делаем:
    // статус там уже 'playing', а PixiJS ещё грузится — старт живёт в канвасе
    // за флагом isAppReady, чтобы сессия не началась до первого кадра.
    if (status === 'playing' && prevStatus === 'paused') {
      startGameplay(gp);
    }
  }, [status, gp]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {/* Канвас с игрой (фон) */}
      <GameCanvasWidget />

      {/* HUD во время игры */}
      {status === 'playing' && <GameHUDWidget />}
    </div>
  );
};
