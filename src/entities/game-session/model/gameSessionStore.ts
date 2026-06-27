import { create } from 'zustand';

import type { GameSessionState } from '../types/gameSessionStore.types';
import { GAME_CONFIG } from '../config/constants';

import { getDefaultGameData } from './defaults';

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  ...getDefaultGameData(),

  setScreen: (status) => set({ status }),

  startGame: () => {
    const defaults = getDefaultGameData();
    const randomColor = GAME_CONFIG.COLORS[Math.floor(Math.random() * GAME_CONFIG.COLORS.length)];

    set({
      ...defaults,
      status: 'playing',
      targetColor: randomColor,
    });
  },

  addScore: (points) => set((state) => ({ score: state.score + points })),

  loseLife: () =>
    set((state) => {
      const newLives = state.lives - 1;
      if (newLives <= 0) {
        return { lives: 0, status: 'gameover' };
      }
      return { lives: newLives };
    }),

  changeTargetColor: () => {
    const currentColor = get().targetColor;
    const available = GAME_CONFIG.COLORS.filter((c) => c !== currentColor);
    const newColor = available[Math.floor(Math.random() * available.length)];

    set({
      targetColor: newColor,
      timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR,
    });
  },

  tickTime: (deltaSeconds) =>
    set((state) => {
      if (state.status !== 'playing') return state;

      const newTime = state.timeToNextColor - deltaSeconds;

      if (newTime <= 0) {
        const available = GAME_CONFIG.COLORS.filter((c) => c !== state.targetColor);
        const newColor = available[Math.floor(Math.random() * available.length)];

        return {
          timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR,
          targetColor: newColor,
        };
      }

      return { timeToNextColor: newTime };
    }),

  reset: () => set(getDefaultGameData()),
}));
