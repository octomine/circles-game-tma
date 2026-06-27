'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

export function ScoreDisplay() {
  const t = useTranslations('game');
  const score = useGameSessionStore((state) => state.score);

  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (score > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [score]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-2xl px-6 py-3',
        'bg-[var(--tg-theme-secondary-bg-color)]/80',
        'backdrop-blur-sm',
        'shadow-lg',
        'transition-transform duration-300',
        isAnimating ? 'scale-110' : 'scale-100'
      )}
    >
      <span
        className={cn(
          'text-xs font-medium tracking-wider uppercase',
          'text-[var(--tg-theme-hint-color)]'
        )}
      >
        {t('hud.score')}
      </span>
      <span className={cn('text-4xl font-bold tabular-nums', 'text-[var(--tg-theme-text-color)]')}>
        {score}
      </span>
    </div>
  );
}
