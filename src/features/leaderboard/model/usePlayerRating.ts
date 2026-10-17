'use client';

import { useCallback, useRef, useState } from 'react';

import { useGamePush } from '@/shared/gamepush';

import { LEADERBOARD_SCORE_FIELD, mapPlayerRatingResponse } from './mappers';
import type { PlayerRatingResult } from './types';

// Сколько ближайших соседей показываем по умолчанию.
const DEFAULT_SHOW_NEAREST = 5;

// Документация GamePush: максимум 10 ближайших игроков сверху и снизу.
const MAX_SHOW_NEAREST = 10;

export interface UsePlayerRatingOptions {
  showNearest?: number;
}

export interface UsePlayerRatingResult {
  rating: PlayerRatingResult | null;
  loading: boolean;
  error: string | null;
  fetchPlayerRating: () => Promise<void>;
}

export const usePlayerRating = (options?: UsePlayerRatingOptions): UsePlayerRatingResult => {
  const { gp, isReady } = useGamePush();

  const [rating, setRating] = useState<PlayerRatingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ограничиваем значение: SDK принимает не больше 10 соседей.
  const requestedNearest = options?.showNearest ?? DEFAULT_SHOW_NEAREST;
  const showNearest = Math.min(Math.max(requestedNearest, 1), MAX_SHOW_NEAREST);

  // Номер последнего запроса: ответ устаревшего запроса не должен перезаписать свежие данные.
  const requestIdRef = useRef(0);

  const fetchPlayerRating = useCallback(async (): Promise<void> => {
    // Без SDK данные взять негде: сообщаем об этом через error, а не бросаем исключение.
    if (!isReady || !gp) {
      setError('SDK not ready');
      return;
    }

    requestIdRef.current += 1;
    const requestId = requestIdRef.current;

    setLoading(true);
    setError(null);

    try {
      const response = await gp.leaderboard.fetchPlayerRating({
        orderBy: [LEADERBOARD_SCORE_FIELD],
        order: 'DESC',
        // showNearest отдаёт соседей по таблице, чтобы игрок видел своё место в окружении,
        // а не только абсолютный топ, куда он может не попадать.
        showNearest,
      });

      // Пока запрос летел, мог стартовать более свежий — тогда этот ответ уже неактуален.
      if (requestId !== requestIdRef.current) return;

      setRating(mapPlayerRatingResponse(response));
    } catch (caughtError) {
      // Ошибку не пробрасываем: UI не обработчик исключений, ему достаточно строки для показа.
      console.error('[leaderboard] Не удалось загрузить рейтинг игрока:', caughtError);

      if (requestId !== requestIdRef.current) return;

      setError('Не удалось загрузить рейтинг игрока');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [gp, isReady, showNearest]);

  return { rating, loading, error, fetchPlayerRating };
};
