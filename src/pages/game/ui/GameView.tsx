'use client';

import { useEffect } from 'react';

import { useGameSessionStore } from '@/entities/game-session';
import { useGameNavigation } from '@/shared/navigation';
import { GameCanvasWidget } from '@/widgets/game-canvas';
import { GameHUDWidget } from '@/widgets/game-hud';

export function GameView() {
  const status = useGameSessionStore((state) => state.status);
  const startGame = useGameSessionStore((state) => state.startGame);

  const { setScreen } = useGameNavigation();

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

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Канвас с игрой (фон) */}
      <GameCanvasWidget />

      {/* HUD во время игры */}
      {status === 'playing' && <GameHUDWidget />}
    </div>
  );
}
