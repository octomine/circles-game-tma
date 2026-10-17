'use client';

import { useCallback } from 'react';

import { SCORE_FIELD_KEY, toScoreNumber, writeFallbackBestScore } from '@/entities/player-score';
import { useGamePush } from '@/shared/gamepush';

export type SaveScoreResult =
  | { success: true; isNewRecord: boolean }
  | { success: false; reason: 'sdk-not-ready' | 'sync-error' };

export interface UseSaveScoreResult {
  saveScore: (finalScore: number) => Promise<SaveScoreResult>;
}

export const useSaveScore = (): UseSaveScoreResult => {
  const { gp, isReady } = useGamePush();

  const saveScore = useCallback(
    async (finalScore: number): Promise<SaveScoreResult> => {
      // SDK не готов — сохраняем локально, чтобы рекорд не потерялся до следующего запуска.
      if (!isReady || !gp) {
        writeFallbackBestScore(finalScore);
        return { success: false, reason: 'sdk-not-ready' };
      }

      const currentBest = toScoreNumber(gp.player.get(SCORE_FIELD_KEY));

      // Не перезаписываем лучший результат худшим: облако хранит только максимум.
      if (finalScore <= currentBest) {
        return { success: true, isNewRecord: false };
      }

      try {
        gp.player.set(SCORE_FIELD_KEY, finalScore);

        // На «Пикабу Игры» облака платформы нет, поэтому указываем облако GamePush явно:
        // хранилище по умолчанию (preferred) могло бы уйти в неподдерживаемое.
        await gp.player.sync({ storage: 'cloud' });

        return { success: true, isNewRecord: true };
      } catch (error) {
        console.error('[save-score] Не удалось синхронизировать рекорд с облаком:', error);
        writeFallbackBestScore(finalScore);

        return { success: false, reason: 'sync-error' };
      }
    },
    [gp, isReady]
  );

  return { saveScore };
};
