'use client';

import { useCallback, useRef, useState } from 'react';

import { useGamePush } from '@/shared/gamepush';

import { LEADERBOARD_SCORE_FIELD, mapLeaderboardFetchResponse } from './mappers';
import type { LeaderboardPlayer } from './types';

// Сколько игроков запрашиваем по умолчанию.
const DEFAULT_LIMIT = 10;

export interface UseFetchLeaderboardOptions {
  limit?: number;
}

export interface UseFetchLeaderboardResult {
  players: LeaderboardPlayer[];
  me: LeaderboardPlayer | null;
  /** Доп. поля реального ответа SDK — пригодятся списку и компактному виджету. */
  topPlayers: LeaderboardPlayer[];
  above: LeaderboardPlayer[];
  below: LeaderboardPlayer[];
  countOfPlayersAbove?: number;
  countOfTopPlayers?: number;
  loading: boolean;
  error: string | null;
  fetchLeaderboard: () => Promise<void>;
}

export const useFetchLeaderboard = (
  options?: UseFetchLeaderboardOptions
): UseFetchLeaderboardResult => {
  const { gp, isReady } = useGamePush();

  const [players, setPlayers] = useState<LeaderboardPlayer[]>([]);
  const [me, setMe] = useState<LeaderboardPlayer | null>(null);
  const [topPlayers, setTopPlayers] = useState<LeaderboardPlayer[]>([]);
  const [above, setAbove] = useState<LeaderboardPlayer[]>([]);
  const [below, setBelow] = useState<LeaderboardPlayer[]>([]);
  const [countOfPlayersAbove, setCountOfPlayersAbove] = useState<number | undefined>(undefined);
  const [countOfTopPlayers, setCountOfTopPlayers] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const limit = options?.limit ?? DEFAULT_LIMIT;

  // Номер последнего запроса: ответ устаревшего запроса не должен перезаписать свежие данные.
  const requestIdRef = useRef(0);

  const fetchLeaderboard = useCallback(async (): Promise<void> => {
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
      const response = await gp.leaderboard.fetch({
        orderBy: [LEADERBOARD_SCORE_FIELD],
        order: 'DESC',
        limit,
        // withMe: 'first' — мой игрок придёт в ответе даже если не попал в топ,
        // иначе me был бы пустым и игрок не увидел бы своё место.
        withMe: 'first',
      });

      // Пока запрос летел, мог стартовать более свежий — тогда этот ответ уже неактуален.
      if (requestId !== requestIdRef.current) return;

      const result = mapLeaderboardFetchResponse(response);
      setPlayers(result.players);
      setMe(result.me ?? null);
      setTopPlayers(result.topPlayers ?? []);
      setAbove(result.above ?? []);
      setBelow(result.below ?? []);
      setCountOfPlayersAbove(result.countOfPlayersAbove);
      setCountOfTopPlayers(result.countOfTopPlayers);
    } catch (caughtError) {
      // Ошибку не пробрасываем: UI не обработчик исключений, ему достаточно строки для показа.
      console.error('[leaderboard] Не удалось загрузить таблицу лидеров:', caughtError);

      if (requestId !== requestIdRef.current) return;

      setError('Не удалось загрузить таблицу лидеров');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [gp, isReady, limit]);

  return {
    players,
    me,
    topPlayers,
    above,
    below,
    countOfPlayersAbove,
    countOfTopPlayers,
    loading,
    error,
    fetchLeaderboard,
  };
};
