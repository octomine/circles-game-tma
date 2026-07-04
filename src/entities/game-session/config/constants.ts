export const GAME_CONFIG = {
  // Цвета игры
  COLORS: ['#FF5733', '#33FF57', '#3357FF', '#F333FF', '#FFF333'],

  // Жизни и время
  DEFAULT_LIVES: 3,
  TIME_TO_CHANGE_COLOR_MS: 10000,

  // Круги
  CIRCLE_RADIUS: 40,
  SPAWN_INTERVAL_MS: 1000,
  CIRCLE_LIFETIME_MS: 8000,
  MAX_CIRCLES_ON_SCREEN: 20,

  // Частицы
  PARTICLE_SIZE: 5,
  PARTICLE_LIFE_MS: 1000,
  MAX_PARTICLES: 50,

  // Эффект потери жизни
  LOSE_LIFE_FREEZE_MS: 300, // Заморозка игры на 300мс
  LOSE_LIFE_HEART_MAX_SIZE: 150, // Максимальный размер сердца в пикселях
  LOSE_LIFE_HEART_DURATION_MS: 600, // Длительность эффекта (рост + fade)
} as const;
