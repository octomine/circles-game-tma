// 'paused' — игра идёт, но игровое время стоит: вкладка скрыта или окно потеряло фокус.
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';

// Строгий тип для HEX-цветов (например, '#FF5733')
export type ColorHex = `#${string}`;

// Чистые данные состояния
export interface GameSessionData {
  status: GameStatus;
  score: number;
  lives: number;
  targetColor: ColorHex;
  timeToNextColor: number; // в миллисекундах

  /**
   * Накопленное игровое время в мс. Тикает только при статусе 'playing'
   * (см. tickTime), поэтому пауза и заморозка его останавливают, а интервалы
   * между кликами не зависят от реального времени и свёрнутой вкладки.
   */
  gameTime: number;
  /** Текущая длина серии ускорения. 0 — серии нет. */
  combo: number;
  /** `gameTime` последнего попадания; null — опорной точки ещё нет. */
  lastClickGameTime: number | null;
  /** Интервал между двумя последними попаданиями, мс: эталон для роста комбо. */
  lastInterval: number | null;
  /** Щит гасит один промах: без потери жизни и без сброса комбо. */
  hasShield: boolean;
  /** Уже выданные вехи комбо — чтобы не начислять один бонус повторно. */
  milestonesHit: number[];
  /** Интервалы последних попаданий, мс: исходные данные для гистограммы. */
  intervalHistory: number[];
}

// Действия, которые могут изменять состояние
export interface GameSessionActions {
  setScreen: (status: GameStatus) => void;
  startGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  changeTargetColor: () => void; // Выбирает новый случайный цвет
  tickTime: (deltaMs: number) => void; // Обновление таймеров из game loop (мс)
  /** Попадание по нужному цвету: пересчитывает комбо и начисляет очки. */
  processCorrectClick: () => void;
  /** Промах: щит гасит его целиком, иначе сброс комбо и минус жизнь. */
  processWrongClick: () => void;
  /** Пауза: игровое время и комбо замирают, серия сохраняется. */
  pauseGame: () => void;
  /** Вернуть игру из паузы. */
  resumeGame: () => void;
  reset: () => void;
}

// Итоговый тип стора = данные + действия
export type GameSessionState = GameSessionData & GameSessionActions;
