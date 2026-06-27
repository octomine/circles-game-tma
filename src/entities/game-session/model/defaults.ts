import type { GameSessionData } from '../types/gameSessionStore.types';
import { GAME_CONFIG } from '../config/constants';

export const getDefaultGameData = (): GameSessionData => ({
  status: 'menu',
  score: 0,
  lives: GAME_CONFIG.DEFAULT_LIVES,
  targetColor: GAME_CONFIG.COLORS[0],
  timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR,
});
