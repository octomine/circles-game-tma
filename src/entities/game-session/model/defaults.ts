import type { GameSessionData, ColorHex } from '../types/gameSessionStore.types';

export const AVAILABLE_COLORS: ColorHex[] = [
  '#FF5733', // Красно-оранжевый
  '#33FF57', // Ярко-зеленый
  '#3357FF', // Синий
  '#F333FF', // Фиолетовый
  '#FFF333', // Желтый
];

export const DEFAULT_LIVES = 3;
export const DEFAULT_TIME_TO_CHANGE = 10; // секунд

export const getDefaultGameData = (): GameSessionData => ({
  status: 'menu',
  score: 0,
  lives: DEFAULT_LIVES,
  targetColor: AVAILABLE_COLORS[0],
  timeToNextColor: DEFAULT_TIME_TO_CHANGE,
});
