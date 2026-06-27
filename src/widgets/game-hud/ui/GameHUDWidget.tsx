'use client';

import { useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

import { ScoreDisplay } from './ScoreDisplay';
import { LivesDisplay } from './LivesDisplay';
import { TargetColorIndicator } from './TargetColorIndicator';

export function GameHUDWidget() {
  const status = useGameSessionStore((state) => state.status);

  // HUD показываем только во время игры
  if (status !== 'playing') {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed inset-0 z-10',
        'pointer-events-none',
        'p-4 pt-[max(1rem,env(safe-area-inset-top))]'
      )}
    >
      {/* Верхняя строка: Счёт | Индикатор цвета | Жизни */}
      <div className={cn('flex items-start justify-between', 'gap-2')}>
        {/* Счёт слева */}
        <div className="pointer-events-auto flex-shrink-0">
          <ScoreDisplay />
        </div>

        {/* Индикатор целевого цвета по центру */}
        <div className="pointer-events-auto flex-shrink-0">
          <TargetColorIndicator />
        </div>

        {/* Жизни справа */}
        <div className="pointer-events-auto flex-shrink-0">
          <LivesDisplay />
        </div>
      </div>
    </div>
  );
}
