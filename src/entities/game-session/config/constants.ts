import type { ColorHex } from '../types/gameSessionStore.types';

export const GAME_CONFIG = {
  COLORS: [
    '#FF5733', // Красно-оранжевый
    '#33FF57', // Ярко-зеленый
    '#3357FF', // Синий
    '#F333FF', // Фиолетовый
    '#FFF333', // Желтый
  ] as ColorHex[],

  DEFAULT_LIVES: 3,
  TIME_TO_CHANGE_COLOR: 10, // секунд

  // Настройки геймплея
  CIRCLE_RADIUS: 40,
  SPAWN_INTERVAL_MS: 1000,
  MAX_CIRCLES_ON_SCREEN: 20,
  MAX_PARTICLES: 50,
  PARTICLE_SIZE: 5,
  PARTICLE_LIFE_SEC: 1.0,
} as const;
