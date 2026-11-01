'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { animate, useMotionValue } from 'motion/react';
import * as motion from 'motion/react-client';

import { GAME_CONFIG, useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

// Размеры для SVG прогресса
const PROGRESS_SIZE = 74;
const PROGRESS_PADDING = 4;
const STROKE_WIDTH = 8;
const RADIUS = (PROGRESS_SIZE - PROGRESS_PADDING - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Порог «времени мало»: за ним прогресс краснеет. */
const URGENT_TIME_MS = 3000;

/** Цвет прогресса, когда время на исходе. */
const URGENT_COLOR = '#EF4444';

/** Длительность всплеска при смене цвета, мс. */
const COLOR_CHANGE_PULSE_MS = 300;

/**
 * Индикатор целевого цвета с кольцом обратного отсчёта.
 *
 * `timeToNextColor` убывает каждый кадр (его переписывает tickTime), поэтому
 * подписка на него в React дала бы ~60 ре-рендеров в секунду. Значения кольца
 * считает requestAnimationFrame и пишет в MotionValue: Motion применяет их к
 * атрибутам SVG сам, без участия состояния React. Подписка остаётся только на
 * `targetColor`, который меняется по событию, — по нему же играет всплеск.
 */
export const TargetColorIndicator = () => {
  const t = useTranslations('game');
  const targetColor = useGameSessionStore((state) => state.targetColor);

  const circleRef = useRef<HTMLDivElement>(null);

  // Первый прогон эффекта всплеска пропускаем: при маунте цвет ещё не менялся.
  const isFirstRunRef = useRef(true);

  // Длина штриха кольца и его цвет: обе величины зависят от времени.
  const strokeDashoffset = useMotionValue(CIRCUMFERENCE);
  const progressColor = useMotionValue(targetColor);

  useEffect(() => {
    let frameId = 0;

    const updateProgress = () => {
      const state = useGameSessionStore.getState();
      const timeLeft = state.timeToNextColor;

      const progress = Math.max(0, Math.min(1, timeLeft / GAME_CONFIG.TIME_TO_CHANGE_COLOR_MS));
      strokeDashoffset.set(CIRCUMFERENCE * (1 - progress));

      // Тревога важнее цвета цели: пока времени мало, кольцо красное.
      const isUrgent = timeLeft > 0 && timeLeft <= URGENT_TIME_MS;
      progressColor.set(isUrgent ? URGENT_COLOR : state.targetColor);

      frameId = requestAnimationFrame(updateProgress);
    };

    frameId = requestAnimationFrame(updateProgress);

    return () => cancelAnimationFrame(frameId);
  }, [strokeDashoffset, progressColor]);

  // Всплеск при смене цели. Играем прямо на элементе, а не через состояние:
  // смена цвета не должна тянуть за собой ре-рендер компонента.
  useEffect(() => {
    const circle = circleRef.current;

    if (!circle) return;

    // На первом маунте цвета ещё не менялись: всплеск был бы ложным сигналом,
    // поэтому пропускаем первый прогон эффекта.
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false;
      return;
    }

    const controls = animate(
      circle,
      { scale: [1, 1.1, 1] },
      { duration: COLOR_CHANGE_PULSE_MS / 1000 }
    );

    return () => controls.stop();
  }, [targetColor]);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center',
        'rounded-2xl px-6 py-3',
        'bg-[var(--tg-theme-secondary-bg-color)]/80',
        'backdrop-blur-sm'
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
          {/* Прогресс-круг (цветной, уменьшается): stroke и strokeDashoffset —
              MotionValue, поэтому Motion пишет их в атрибуты SVG сам, минуя React. */}
          <motion.circle
            cx={PROGRESS_SIZE / 2}
            cy={PROGRESS_SIZE / 2}
            r={RADIUS}
            fill="none"
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={CIRCUMFERENCE}
            stroke={progressColor}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>

        {/* Цветной круг в центре */}
        <div
          ref={circleRef}
          className={cn('h-12 w-12 rounded-full', 'border-4 border-white/30', 'shadow-inner')}
          style={{
            backgroundColor: targetColor,
            boxShadow: `0 0 20px ${targetColor}80`,
          }}
        />
      </div>
    </div>
  );
};
