'use client';

import { useGameSessionStore, ComboTower } from '@/entities/game-session';

import { ScoreDisplay } from './ScoreDisplay';
import { LivesDisplay } from './LivesDisplay';
import { TargetColorIndicator } from './TargetColorIndicator';

/**
 * HUD игрового экрана.
 *
 * Корень — pointer-events-none: HUD накрывает игровое поле, но клики должны
 * доходить до кругов в Pixi-канвасе. Все блоки спозиционированы абсолютно и не
 * влияют друг на друга, поэтому при смене длины счёта вёрстка не «прыгает».
 */
export const GameHUDWidget = () => {
  const status = useGameSessionStore((state) => state.status);

  // HUD показываем только во время игры. Пауза (свёрнутая вкладка) сюда не входит:
  // в этот момент экран не виден, и лишний рендер был бы впустую.
  if (status !== 'playing') {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {/* Счёт — левый верх; pt сдвигает контент вниз из-под «челки» (безопасная зона). */}
      <div className="absolute top-4 left-4 pt-[env(safe-area-inset-top)]">
        <ScoreDisplay />
      </div>

      {/* Жизни и щит — центр верха; pt — запас под безопасную зону сверху. */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 pt-[env(safe-area-inset-top)]">
        <LivesDisplay />
      </div>

      {/* Индикатор целевого цвета — правый верх; pt — запас под безопасную зону. */}
      <div className="absolute top-4 right-4 pt-[env(safe-area-inset-top)]">
        <TargetColorIndicator />
      </div>

      {/* Башня комбо — левый низ; pb приподнимает контент над нижней полосой iPhone. */}
      <div className="absolute bottom-4 left-4 pb-[env(safe-area-inset-bottom)]">
        <ComboTower />
      </div>
    </div>
  );
};
