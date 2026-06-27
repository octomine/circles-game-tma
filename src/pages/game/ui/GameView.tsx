'use client';

import { useGameSessionStore } from '@/entities/game-session';
import { GameCanvasWidget } from '@/widgets/game-canvas';
import { GameHUDWidget } from '@/widgets/game-hud';
import { GameOverWidget } from '@/widgets/game-over';

export function GameView() {
  const status = useGameSessionStore((state) => state.status);

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Канвас с игрой (фон) */}
      <GameCanvasWidget />

      {/* HUD во время игры */}
      {status === 'playing' && <GameHUDWidget />}

      {/* Экран Game Over */}
      {status === 'gameover' && <GameOverWidget />}
    </div>
  );
}
