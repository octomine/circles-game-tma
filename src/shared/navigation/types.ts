'use client';

/**
 * Экраны игры. Роутинг живёт в React-состоянии, а не в URL,
 * поэтому тип описывает UI-экран, а не маршрут.
 */
export type GameScreen = 'menu' | 'game' | 'gameover' | 'leaderboard';

export interface GameNavigationContextValue {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  /** Возврат на предыдущий экран: у навигации в состоянии нет истории браузера. */
  goBack: () => void;
}
