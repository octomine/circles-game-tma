'use client';

import { createContext } from 'react';

import type { GameNavigationContextValue } from './types';

export const GameNavigationContext = createContext<GameNavigationContextValue | null>(null);
