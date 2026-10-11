'use client';

/**
 * Экраны игры. Роутинг живёт в React-состоянии, а не в URL,
 * поэтому тип описывает UI-экран, а не маршрут.
 */
export type GameScreen = 'menu' | 'game' | 'gameover';

export interface GameNavigationContextValue {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
}
