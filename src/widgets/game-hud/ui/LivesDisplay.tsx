'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

export function LivesDisplay() {
  const t = useTranslations('game');
  const lives = useGameSessionStore((state) => state.lives);

  const [isShaking, setIsShaking] = useState(false);
  const [prevLives, setPrevLives] = useState(lives);

  // Анимация тряски при потере жизни
  useEffect(() => {
    if (lives < prevLives) {
      setIsShaking(true);
      const timer = setTimeout(() => setIsShaking(false), 500);
      return () => clearTimeout(timer);
    }
    setPrevLives(lives);
    return;
  }, [lives, prevLives]);

  // Максимальное количество жизней (из конфига)
  const maxLives = 3;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-2xl px-6 py-3',
        'bg-[var(--tg-theme-secondary-bg-color)]/80',
        'backdrop-blur-sm',
        'shadow-lg',
        'transition-all duration-300',
        isShaking && 'animate-shake'
      )}
    >
      <span
        className={cn(
          'text-xs font-medium tracking-wider uppercase',
          'text-[var(--tg-theme-hint-color)]'
        )}
      >
        {t('hud.lives', { count: lives })}
      </span>

      <div className="mt-1 flex gap-1">
        {Array.from({ length: maxLives }).map((_, index) => (
          <span
            key={index}
            className={cn(
              'text-2xl transition-all duration-300',
              index < lives ? 'scale-100 opacity-100' : 'scale-75 opacity-30 grayscale'
            )}
          >
            ❤️
          </span>
        ))}
      </div>
    </div>
  );
}
