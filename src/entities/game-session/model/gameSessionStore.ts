import { create } from 'zustand';

import type { GameSessionState } from '../types/gameSessionStore.types';
import { GAME_CONFIG } from '../config/constants';
import { COMBO_CONFIG, getComboMilestone, getComboMultiplier } from '../config/comboConfig';

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
      return { lives: newLives };
    }),

  changeTargetColor: () => {
    const currentColor = get().targetColor;
    const available = GAME_CONFIG.COLORS.filter((c) => c !== currentColor);
    const newColor = available[Math.floor(Math.random() * available.length)];

    set({
      targetColor: newColor,
      timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR_MS,
    });
  },

  tickTime: (dt) =>
    set((state) => {
      if (state.status !== 'playing') return state;

      // Игровое время копится только при активной игре. Движок не зовёт tickTime
      // во время заморозки за промах и на паузе, поэтому там gameTime замирает —
      // именно из-за этого интервалы комбо считаются по нему, а не по Date.now().
      const gameTime = state.gameTime + dt;

      // Серия живёт ровно столько, сколько длился предыдущий интервал: как только
      // с последнего попадания прошло больше, следующий клик уже не может быть
      // ускорением (interval > lastInterval > lastInterval - MIN_DIFF), то есть
      // комбо обречено. Поэтому сбрасываем его сразу по таймеру, не дожидаясь
      // клика: иначе множитель висел бы до следующего тапа, хотя гистограмма
      // уже красная. lastInterval === 0 бывает только после первого клика —
      // предыдущего интервала ещё нет, и превышать нечего.
      const isComboExpired =
        state.combo > 0 &&
        state.lastClickGameTime !== null &&
        state.lastInterval !== null &&
        state.lastInterval > 0 &&
        gameTime - state.lastClickGameTime > state.lastInterval;

      const comboPatch: { combo?: number } = isComboExpired ? { combo: 0 } : {};

      const newTime = state.timeToNextColor - dt;

      if (newTime <= 0) {
        const available = GAME_CONFIG.COLORS.filter((c) => c !== state.targetColor);
        const newColor = available[Math.floor(Math.random() * available.length)];

        return {
          gameTime,
          ...comboPatch,
          timeToNextColor: GAME_CONFIG.TIME_TO_CHANGE_COLOR_MS,
          targetColor: newColor,
        };
      }

      return { gameTime, ...comboPatch, timeToNextColor: newTime };
    }),

  processCorrectClick: () =>
    set((state) => {
      const { gameTime, combo, lastClickGameTime, lastInterval, intervalHistory } = state;

      let nextCombo: number;
      let nextLastInterval: number;
      let nextIntervalHistory: number[];

      if (lastClickGameTime === null) {
        // Первый клик: опорной точки ещё нет, интервал считать не из чего.
        // lastInterval = 0, а не null: иначе на втором клике ветка «lastInterval === null»
        // перехватила бы анти-спам. История пустая — пустого столбца в гистограмме не будет.
        nextCombo = 1;
        nextLastInterval = 0;
        nextIntervalHistory = [];
      } else {
        const interval = Math.max(gameTime - lastClickGameTime, 0);

        if (interval > COMBO_CONFIG.MAX_INTERVAL || lastInterval === null) {
          // Слишком долгая пауза между кликами — серия начинается заново,
          // но интервал становится новым эталоном для сравнения.
          nextCombo = 1;
          nextLastInterval = interval;
          nextIntervalHistory = [interval];
        } else if (interval < COMBO_CONFIG.MIN_CLICK_INTERVAL) {
          // Анти-спам: клик слишком частый, для комбо его игнорируем, а эталон
          // и историю не трогаем — иначе спам «подтягивал» бы эталон к нулю.
          nextCombo = combo;
          nextLastInterval = lastInterval;
          nextIntervalHistory = intervalHistory;
        } else if (interval < lastInterval - COMBO_CONFIG.MIN_DIFF) {
          // Клик заметно быстрее предыдущего — серия растёт.
          nextCombo = combo + 1;
          nextLastInterval = interval;
          nextIntervalHistory = [...intervalHistory, interval];
        } else {
          // Замедление: ускорения нет, серия сбрасывается.
          nextCombo = 1;
          nextLastInterval = interval;
          nextIntervalHistory = [interval];
        }
      }

      const points = COMBO_CONFIG.POINTS_BASE * getComboMultiplier(nextCombo);

      // Веха: начисляем один раз за партию. 'slowdown' и 'all' пока только
      // фиксируются — механики слоудауна в игре ещё нет.
      const milestone = getComboMilestone(nextCombo);
      const isNewMilestone = milestone !== null && !state.milestonesHit.includes(nextCombo);

      let nextLives = state.lives;
      let nextHasShield = state.hasShield;

      if (isNewMilestone) {
        if (milestone === 'extraLife') {
          nextLives = Math.min(state.lives + 1, GAME_CONFIG.MAX_LIVES);
        }

        if (milestone === 'shield') {
          nextHasShield = true;
        }
      }

      // Всё пишем одним обновлением: счёт, жизни и комбо должны меняться вместе,
      // иначе подписчики успели бы увидеть промежуточное состояние.
      return {
        combo: nextCombo,
        lastClickGameTime: gameTime,
        lastInterval: nextLastInterval,
        intervalHistory: nextIntervalHistory,
        score: state.score + points,
        lives: nextLives,
        hasShield: nextHasShield,
        milestonesHit: isNewMilestone ? [...state.milestonesHit, nextCombo] : state.milestonesHit,
      };
    }),

  processWrongClick: () => {
    const { hasShield } = get();

    // Щит гасит промах целиком: ни жизни, ни комбо не теряем.
    if (hasShield) {
      set({ hasShield: false });
      return;
    }

    set({
      combo: 0,
      lastInterval: null,
      lastClickGameTime: null,
      intervalHistory: [],
    });

    get().loseLife();
  },

  // Пауза не трогает комбо и таймеры: gameTime и так стоит (tickTime не зовётся),
  // а серия сохраняется — переключение вкладки в Telegram не должно её обнулять.
  pauseGame: () => set((state) => (state.status === 'playing' ? { status: 'paused' } : state)),

  resumeGame: () => set((state) => (state.status === 'paused' ? { status: 'playing' } : state)),

  reset: () => set(getDefaultGameData()),
}));
