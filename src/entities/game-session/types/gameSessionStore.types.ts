export type GameScreen = 'menu' | 'game' | 'gameOver';

export interface GameSessionState {
  screen: GameScreen;
  score: number;
  setScreen: (screen: GameScreen) => void;
  addScore: (score: number) => void;
  reset: () => void;
};

export type GameSessionStateDefault = Omit<GameSessionState, 'setScreen' | 'addScore' | 'reset'>;
