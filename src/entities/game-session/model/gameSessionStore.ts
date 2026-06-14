import { create } from 'zustand';
import type { GameSessionState } from '../types/gameSessionStore.types';
import { getDefaultGameData, AVAILABLE_COLORS } from './defaults';

export const useGameSessionStore = create<GameSessionState>((set, get) => ({
  // 1. Инициализация дефолтными данными
  ...getDefaultGameData(),

  // 2. Действия
  setScreen: (status) => set({ status }),

  startGame: () => {
    const defaults = getDefaultGameData();
    // Выбираем случайный цвет при старте
    const randomColor = AVAILABLE_COLORS[Math.floor(Math.random() * AVAILABLE_COLORS.length)];

    set({
      ...defaults,
      status: 'playing',
      targetColor: randomColor,
    });
  },

  addScore: (points) => set((state) => ({ score: state.score + points })),

  loseLife: () => set((state) => {
    const newLives = state.lives - 1;
    if (newLives <= 0) {
      return { lives: 0, status: 'gameover' };
    }
    return { lives: newLives };
  }),

  changeTargetColor: () => {
    const currentColor = get().targetColor;
    // Фильтруем, чтобы новый цвет не совпадал с текущим
    const available = AVAILABLE_COLORS.filter((c) => c !== currentColor);
    const newColor = available[Math.floor(Math.random() * available.length)];

    set({
      targetColor: newColor,
      timeToNextColor: 10, // Сброс таймера
    });
  },

  tickTime: (deltaSeconds) => set((state) => {
    // Тикаем только во время игры
    if (state.status !== 'playing') return state;

    const newTime = state.timeToNextColor - deltaSeconds;

    if (newTime <= 0) {
      // Время вышло, меняем цвет автоматически
      const available = AVAILABLE_COLORS.filter((c) => c !== state.targetColor);
      const newColor = available[Math.floor(Math.random() * available.length)];

      return {
        timeToNextColor: 10,
        targetColor: newColor,
      };
    }

    return { timeToNextColor: newTime };
  }),

  reset: () => set(getDefaultGameData()),
}));
