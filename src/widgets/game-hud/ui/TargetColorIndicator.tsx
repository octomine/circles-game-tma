'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { GAME_CONFIG, useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

// Размеры для SVG прогресса
const PROGRESS_SIZE = 74;
const PROGRESS_PADDING = 4;
const STROKE_WIDTH = 8;
const RADIUS = (PROGRESS_SIZE - PROGRESS_PADDING - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
    return;
  }, [targetColor, prevColor]);

  // Прогресс от 0 до 1
  const progress = Math.max(0, Math.min(1, timeToNextColor / GAME_CONFIG.TIME_TO_CHANGE_COLOR_MS));
  const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

  // Urgency: меняем цвет прогресса на красный
  const isUrgent = timeToNextColor > 0 && timeToNextColor <= 3000;
  const progressColor = isUrgent ? '#EF4444' : targetColor;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-2xl px-6 py-3',
        'bg-[var(--tg-theme-secondary-bg-color)]/80',
        'backdrop-blur-sm',
        'transition-all duration-300'
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

      {/* Контейнер с прогрессом и цветным кругом */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: PROGRESS_SIZE, height: PROGRESS_SIZE }}
      >
        {/* SVG с прогрессом */}
        <svg width={PROGRESS_SIZE} height={PROGRESS_SIZE} className="absolute inset-0 -rotate-90">
          {/* Фоновый круг (серый, полный) */}
          <circle
            cx={PROGRESS_SIZE / 2}
            cy={PROGRESS_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="rgba(255, 255, 255, 0.1)"
            strokeWidth={STROKE_WIDTH}
          />
          {/* Прогресс-круг (цветной, уменьшается) */}
          <circle
            cx={PROGRESS_SIZE / 2}
            cy={PROGRESS_SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke={progressColor}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Цветной круг в центре */}
        <div
          className={cn(
            'h-12 w-12 rounded-full',
            'border-4 border-white/30',
            'shadow-inner',
            'transition-all duration-300',
            isChanging && 'scale-110'
          )}
          style={{
            backgroundColor: targetColor,
            boxShadow: `0 0 20px ${targetColor}80`,
          }}
        />
      </div>
    </div>
  );
}
