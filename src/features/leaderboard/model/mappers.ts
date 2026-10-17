import type {
  GamePushLeaderboardFetchResponse,
  GamePushLeaderboardPlayer,
  GamePushLeaderboardRatingResponse,
} from '@/shared/gamepush';
import { toSafeNumber } from '@/shared/lib/number';

import type { LeaderboardFetchResult, LeaderboardPlayer, PlayerRatingResult } from './types';

/** Поле лидерборда: в панели GamePush создано числовое поле score. */
export const LEADERBOARD_SCORE_FIELD = 'score';

/**
 * Приводит сырого игрока SDK к доменному виду.
 * Поля SDK без типов, поэтому id/position/score нормализуем числом,
 * а пустой avatar не тащим дальше как пустую строку.
 */
export const mapLeaderboardPlayer = (raw: GamePushLeaderboardPlayer): LeaderboardPlayer => {
  const avatar = typeof raw.avatar === 'string' && raw.avatar !== '' ? raw.avatar : undefined;

  return {
    id: toSafeNumber(raw.id),
    name: typeof raw.name === 'string' ? raw.name : '',
    // score — кастомное поле проекта: SDK отдаёт его как есть, поэтому нормализуем.
    score: toSafeNumber(raw[LEADERBOARD_SCORE_FIELD]),
    position: toSafeNumber(raw.position),
    avatar,
  };
};

/** Маппинг необязательного массива: undefined и пустой список дают пустой массив. */
const mapPlayerList = (raw: GamePushLeaderboardPlayer[] | undefined): LeaderboardPlayer[] =>
  Array.isArray(raw) ? raw.map(mapLeaderboardPlayer) : [];

/**
 * Приводит ответ gp.leaderboard.fetch к доменному результату.
 * Мой игрок исключается из players: SDK вставляет его в список сам (withMe),
 * а в UI он приходит отдельным полем me — иначе в списке был бы дубль.
 */
export const mapLeaderboardFetchResponse = (
  response: GamePushLeaderboardFetchResponse
): LeaderboardFetchResult => {
  const me = response.player ? mapLeaderboardPlayer(response.player) : null;
  const players = mapPlayerList(response.players);

  return {
    players: me ? players.filter((player) => player.id !== me.id) : players,
    me,
    topPlayers: response.topPlayers ? mapPlayerList(response.topPlayers) : undefined,
    above: response.abovePlayers ? mapPlayerList(response.abovePlayers) : undefined,
    below: response.belowPlayers ? mapPlayerList(response.belowPlayers) : undefined,
    countOfPlayersAbove: response.countOfPlayersAbove,
    countOfTopPlayers: response.countOfTopPlayers,
  };
};

/** Приводит ответ gp.leaderboard.fetchPlayerRating к доменному результату. */
export const mapPlayerRatingResponse = (
  response: GamePushLeaderboardRatingResponse
): PlayerRatingResult => ({
  player: response.player ? mapLeaderboardPlayer(response.player) : null,
  above: mapPlayerList(response.abovePlayers),
  below: mapPlayerList(response.belowPlayers),
});
