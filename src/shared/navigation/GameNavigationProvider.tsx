'use client';

import { useCallback, useMemo, useState, type PropsWithChildren } from 'react';

import { GameNavigationContext } from './context';
import type { GameNavigationContextValue, GameScreen } from './types';

interface GameNavigationProviderProps {
  initialScreen?: GameScreen;
}

export const GameNavigationProvider = ({
  initialScreen = 'menu',
  children,
}: PropsWithChildren<GameNavigationProviderProps>) => {
  // История в один шаг: текущий экран и предыдущий — этого достаточно для goBack.
  const [history, setHistory] = useState<GameScreen[]>([initialScreen]);

  const screen = history[history.length - 1];

  const setScreen = useCallback((nextScreen: GameScreen) => {
    setHistory((prevHistory) => {
      // Повторный переход на тот же экран не должен засорять историю.
      if (prevHistory[prevHistory.length - 1] === nextScreen) return prevHistory;

      return [...prevHistory, nextScreen].slice(-2);
    });
  }, []);

  const goBack = useCallback(() => {
    // Возвращаться некуда (мы на первом экране) — оставляем историю как есть.
    setHistory((prevHistory) => (prevHistory.length > 1 ? prevHistory.slice(0, -1) : prevHistory));
  }, []);

  const value = useMemo<GameNavigationContextValue>(
    () => ({ screen, setScreen, goBack }),
    [screen, setScreen, goBack]
  );

  return <GameNavigationContext.Provider value={value}>{children}</GameNavigationContext.Provider>;
};
