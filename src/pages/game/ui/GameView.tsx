'use client';

import { useEffect } from 'react';

import { useGameSessionStore } from '@/entities/game-session';
import { useGameNavigation } from '@/shared/navigation';
import { GameCanvasWidget } from '@/widgets/game-canvas';
import { GameHUDWidget } from '@/widgets/game-hud';

export function GameView() {
  const status = useGameSessionStore((state) => state.status);

  const { setScreen } = useGameNavigation();

  // Мост: игровая сессия сообщает о проигрыше, навигация переключает экран
  useEffect(() => {
    if (status === 'gameover') {
      setScreen('gameover');
    }
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
