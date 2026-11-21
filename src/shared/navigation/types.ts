'use client';

/**
 * Экраны игры. Роутинг живёт в React-состоянии, а не в URL,
 * поэтому тип описывает UI-экран, а не маршрут.
 *
 * 'gameover' здесь нет: проигрыш — не экран, а оверлей поверх 'game'. Канвас
 * остаётся смонтированным, иначе PixiJS уничтожил бы приложение вместе с
 * застывшим кадром партии.
 */
export type GameScreen = 'menu' | 'game' | 'leaderboard';

export interface GameNavigationContextValue {
  screen: GameScreen;
  setScreen: (screen: GameScreen) => void;
  /** Возврат на предыдущий экран: у навигации в состоянии нет истории браузера. */
  goBack: () => void;
}
