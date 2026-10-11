'use client';

import { useMemo, useState, type PropsWithChildren } from 'react';

import { GameNavigationContext } from './context';
import type { GameNavigationContextValue, GameScreen } from './types';

interface GameNavigationProviderProps {
  initialScreen?: GameScreen;
}

export const GameNavigationProvider = ({
  initialScreen = 'menu',
  children,
}: PropsWithChildren<GameNavigationProviderProps>) => {
  const [screen, setScreen] = useState<GameScreen>(initialScreen);

  const value = useMemo<GameNavigationContextValue>(() => ({ screen, setScreen }), [screen]);

  return <GameNavigationContext.Provider value={value}>{children}</GameNavigationContext.Provider>;
};
