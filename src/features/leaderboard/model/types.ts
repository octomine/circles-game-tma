/**
 * Игрок в таблице лидеров в доменном виде: значения уже нормализованы,
 * поэтому UI не думает о сырых типах SDK.
 */
export interface LeaderboardPlayer {
  id: number;
  name: string;
  score: number;
  position: number;
  avatar?: string;
}

/** Результат загрузки таблицы лидеров. */
export interface LeaderboardFetchResult {
  /** Список игроков без текущего игрока: он приходит отдельно в me. */
  players: LeaderboardPlayer[];
  /** Данные текущего игрока, если он попал в ответ. */
  me?: LeaderboardPlayer | null;
  /** Топ игроков (поле ответа SDK, удобно для компактного виджета). */
  topPlayers?: LeaderboardPlayer[];
  /** Игроки выше меня. */
  above?: LeaderboardPlayer[];
  /** Игроки ниже меня. */
  below?: LeaderboardPlayer[];
  /** Сколько всего игроков выше меня — для подписи места. */
  countOfPlayersAbove?: number;
  countOfTopPlayers?: number;
}

/** Результат загрузки рейтинга игрока с ближайшими соседями. */
export interface PlayerRatingResult {
  /** Текущий игрок с позицией; null — если рейтинг недоступен. */
  player: LeaderboardPlayer | null;
  /** Игроки выше меня. */
  above: LeaderboardPlayer[];
  /** Игроки ниже меня. */
  below: LeaderboardPlayer[];
}
