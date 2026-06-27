export type GameStatus = 'menu' | 'playing' | 'gameover';

// Строгий тип для HEX-цветов (например, '#FF5733')
export type ColorHex = `#${string}`;

// Чистые данные состояния
export interface GameSessionData {
  status: GameStatus;
  score: number;
  lives: number;
  targetColor: ColorHex;
  timeToNextColor: number; // в секундах
}

// Действия, которые могут изменять состояние
export interface GameSessionActions {
  setScreen: (status: GameStatus) => void;
  startGame: () => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  changeTargetColor: () => void; // Выбирает новый случайный цвет
  tickTime: (deltaSeconds: number) => void; // Обновление таймера из game loop
  reset: () => void;
}

// Итоговый тип стора = данные + действия
export type GameSessionState = GameSessionData & GameSessionActions;
