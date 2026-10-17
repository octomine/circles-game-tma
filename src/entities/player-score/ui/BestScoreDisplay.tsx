'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { useGamePush } from '@/shared/gamepush';

import { SCORE_FIELD_KEY } from '../model/constants';
import { readFallbackBestScore, toScoreNumber } from '../model/score-storage';

export const BestScoreDisplay = () => {
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
    return <>...</>;
  }

  return <>{t('gameOver.bestScoreRecord', { score: bestScore })}</>;
};
