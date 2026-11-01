'use client';

import { useTranslations } from 'next-intl';

import { useGameSessionStore } from '@/entities/game-session';

/**
 * Счёт — самый крупный элемент HUD, поэтому он без плашки: цифру видно на любом
 * фоне, а «стекло» только перекрывало бы игровое поле и ловило клики.
 */
export const ScoreDisplay = () => {
  const t = useTranslations('game');
  const score = useGameSessionStore((state) => state.score);

  return (
    <div className="flex flex-col items-start">
      <span className="text-text-muted text-xs font-medium tracking-wider uppercase">
        {t('hud.score')}
      </span>
      <span className="text-text text-4xl font-bold tabular-nums">{score}</span>
    </div>
  );
};
