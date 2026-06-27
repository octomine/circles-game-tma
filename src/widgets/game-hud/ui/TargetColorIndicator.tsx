'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

export function TargetColorIndicator() {
  const t = useTranslations('game');
  const targetColor = useGameSessionStore((state) => state.targetColor);
  const timeToNextColor = useGameSessionStore((state) => state.timeToNextColor);

  const [isChanging, setIsChanging] = useState(false);
  const [prevColor, setPrevColor] = useState(targetColor);

  // Анимация при смене цвета
  useEffect(() => {
    if (targetColor !== prevColor) {
      setIsChanging(true);
      const timer = setTimeout(() => setIsChanging(false), 300);
      setPrevColor(targetColor);
      return () => clearTimeout(timer);
    }
  }, [targetColor, prevColor]);

  // Пульсация за 3 секунды до смены цвета
  const isUrgent = timeToNextColor <= 3;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-2xl px-6 py-3',
        'bg-[var(--tg-theme-secondary-bg-color)]/80',
        'backdrop-blur-sm',
        'shadow-lg',
        'transition-all duration-300',
        isUrgent && 'animate-pulse'
      )}
    >
      <span
        className={cn(
          'mb-2 text-xs font-medium tracking-wider uppercase',
          'text-[var(--tg-theme-hint-color)]'
        )}
      >
        {t('hud.targetColor')}
      </span>

      {/* Цветной круг */}
      <div
        className={cn(
          'h-16 w-16 rounded-full',
          'border-4 border-white/30',
          'shadow-inner',
          'transition-all duration-300',
          isChanging && 'scale-110'
        )}
        style={{
          backgroundColor: targetColor,
          boxShadow: `0 0 20px ${targetColor}80`, // Цветное свечение
        }}
      />

      {/* Таймер (опционально) */}
      {isUrgent && (
        <span className={cn('mt-2 text-xs font-bold', 'text-[var(--tg-theme-button-color)]')}>
          {t('hud.timeLeft', { seconds: Math.ceil(timeToNextColor) })}
        </span>
      )}
    </div>
  );
}
