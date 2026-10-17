'use client';

import { useContext } from 'react';

import { GameNavigationContext } from './context';
import type { GameNavigationContextValue } from './types';

export const useGameNavigation = (): GameNavigationContextValue => {
  const context = useContext(GameNavigationContext);

  if (!context) {
    throw new Error('useGameNavigation must be used within a GameNavigationProvider');
  }

  return context;
};
