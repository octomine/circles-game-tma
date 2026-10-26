'use client';

import { useGameSessionStore, ComboHistogram } from '@/entities/game-session';
import { cn } from '@/shared';

import { ScoreDisplay } from './ScoreDisplay';
import { LivesDisplay } from './LivesDisplay';
import { TargetColorIndicator } from './TargetColorIndicator';
import { ShieldIndicator } from './ShieldIndicator';

export function GameHUDWidget() {
  const status = useGameSessionStore((state) => state.status);

  // HUD показываем только во время игры
  if (status !== 'playing') {
    return null;
  }

  return (
    // absolute, а не fixed: экран обёрнут в motion.div, который на время
    // переходов задаёт transform, и fixed-потомок спозиционировался бы от него.
    <div
      className={cn(
        'absolute inset-0 z-10',
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

      {/* Низ: статус щита и «лесенка» интервалов комбо */}
      <div
        className={cn(
          'absolute inset-x-0 bottom-0',
          'flex flex-col items-center gap-3',
          'px-4 pb-[max(1rem,env(safe-area-inset-bottom))]'
        )}
      >
        <ShieldIndicator />
        <ComboHistogram />
      </div>
    </div>
  );
}
