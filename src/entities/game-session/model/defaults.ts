import type { GameSessionData } from '../types/gameSessionStore.types';
import { GAME_CONFIG } from '../config/constants';

export const getDefaultGameData = (): GameSessionData => ({
  status: 'menu',
  score: 0,
  lives: GAME_CONFIG.DEFAULT_LIVES,
  targetColor: GAME_CONFIG.COLORS[0],
  timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR_MS,

  // Игровое время и комбо: дефолты отсюда получают и startGame (спредит их),
  // и reset — поэтому gameTime и серия обнуляются без отдельных правок.
  gameTime: 0,
  combo: 0,
  lastClickGameTime: null,
  lastInterval: null,
  hasShield: false,
  milestonesHit: [],
  intervalHistory: [],
});
