'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useGamePush } from '@/shared/gamepush';

import { SCORE_FIELD_KEY } from '../model/constants';
import { readFallbackBestScore, toScoreNumber } from '../model/score-storage';

export interface BestScoreDisplayProps {
  className?: string;
  /** Показать только число, без подписи «Рекорд: {score}». */
  valueOnly?: boolean;
  /** Что показать, пока рекорд не прочитан. */
  placeholder?: string;
}

export const BestScoreDisplay = ({
  className,
  valueOnly = false,
  placeholder = '...',
}: BestScoreDisplayProps) => {
  const t = useTranslations('game');

  const { gp, isReady } = useGamePush();

  const [bestScore, setBestScore] = useState<number | null>(null);

  useEffect(() => {
    // Облако доступно — берём рекорд из полей игрока.
    if (isReady && gp) {
      setBestScore(toScoreNumber(gp.player.get(SCORE_FIELD_KEY)));
      return;
    }

    // Иначе показываем локальный рекорд: он же записан как fallback при сбое синхронизации.
    const fallback = readFallbackBestScore();
    if (fallback !== null) {
      setBestScore(fallback);
    }
  }, [isReady, gp]);

  // Значение ещё не получено — показываем плейсхолдер вместо нуля.
  if (bestScore === null) {
    return <span className={className}>{placeholder}</span>;
  }

  // className навешиваем на span в обоих режимах: снаружи задают размеры и цвет числа.
  return (
    <span className={className}>
      {valueOnly ? bestScore : t('gameOver.bestScoreRecord', { score: bestScore })}
    </span>
  );
};
