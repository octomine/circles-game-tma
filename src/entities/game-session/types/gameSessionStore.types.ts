// 'paused' — игра идёт, но игровое время стоит: вкладка скрыта или окно потеряло фокус.
export type GameStatus = 'menu' | 'playing' | 'paused' | 'gameover';

// Строгий тип для HEX-цветов (например, '#FF5733')
export type ColorHex = `#${string}`;

/**
 * Событие игрового слоя.
 *
 * Стор их только копит, а применяет движок в тикере: так визуальные эффекты
 * (сообщения, разбитое сердце, заморозка) не зависят от рендеров React и не
 * тянут подписки на поля, которые меняются каждый кадр.
 *
 * `delay` — сколько миллисекунд сообщению ждать перед появлением. Пачка
 * событий из одного апдейта получает 0, MESSAGE_DELAY_MS, 2 * MESSAGE_DELAY_MS…
 * поэтому сообщения проявляются по очереди, а не наплывают одним кадром.
 *
 * `sfx` / `rate` — звуковое сопровождение события. Стор не воспроизводит звук сам
 * (он ничего не знает про Howler), а лишь называет звук и его тон: очередь
 * событий остаётся единственным каналом «что произошло» для движка.
 */
export type GameEvent =
  | {
      id: string;
      type: 'SPAWN_MESSAGE';
      x: number;
      y: number;
      /** Текст сообщения; у события «только звук» его нет. */
      text?: string;
      delay: number;
      /** id звука из AUDIO_CONFIG.SFX. */
      sfx?: string;
      /** Питч конкретного проигрывания: комбо ускоряет звук. */
      rate?: number;
    }
  | {
      id: string;
      type: 'WRONG_CLICK';
      x: number;
      y: number;
      shielded: boolean;
      delay: number;
      sfx?: string;
    };

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
  /**
   * Очередь событий «стор → движок». Чистится при старте и сбросе игры (дефолты),
   * вычитывается тикером через consumeEvent.
   */
  pendingEvents: GameEvent[];
}

// Действия, которые могут изменять состояние
export interface GameSessionActions {
  setScreen: (status: GameStatus) => void;
  startGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  changeTargetColor: () => void; // Выбирает новый случайный цвет
  tickTime: (deltaMs: number) => void; // Обновление таймеров из game loop (мс)
  /**
   * Попадание по нужному цвету: пересчитывает комбо, начисляет очки и копит
   * события для визуального слоя. x/y — точка клика (центр круга).
   */
  processCorrectClick: (x: number, y: number) => void;
  /**
   * Промах: щит гасит его целиком, иначе сброс комбо и минус жизнь.
   * x/y нужны, чтобы событие нарисовало эффект в точке клика.
   */
  processWrongClick: (x: number, y: number) => void;
  /** Убрать обработанное событие из очереди по id. */
  consumeEvent: (id: string) => void;
  /** Пауза: игровое время и комбо замирают, серия сохраняется. */
  pauseGame: () => void;
  /** Вернуть игру из паузы. */
  resumeGame: () => void;
  reset: () => void;
}

// Итоговый тип стора = данные + действия
export type GameSessionState = GameSessionData & GameSessionActions;
