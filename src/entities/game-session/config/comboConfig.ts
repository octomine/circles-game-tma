/**
 * Конфиг механики комбо (Acceleration Streak).
 *
 * Все интервалы измеряются в миллисекундах ИГРОВОГО времени (`gameTime` из стора),
 * а не через `Date.now()`. Игровое время накапливает `tickTime`, который движок не
 * вызывает ни во время заморозки за промах, ни на паузе, ни в свёрнутой вкладке.
 * Поэтому пауза не растягивает интервал между кликами: при расчёте по `Date.now()`
 * такие «дыры» сбрасывали бы серию на ровном месте.
 */
export const COMBO_CONFIG = {
  MIN_DIFF: 20, // мс: минимальное ускорение для роста комбо
  MAX_INTERVAL: 2000, // мс: интервал больше — полный сброс
  MIN_CLICK_INTERVAL: 80, // мс: анти-спам
  POINTS_BASE: 10, // базовые очки за попадание; множитель комбо умножает их
  MULTIPLIERS: [
    { minCombo: 7, mult: 4 },
    { minCombo: 5, mult: 3 },
    { minCombo: 3, mult: 2 },
    { minCombo: 1, mult: 1 },
  ],
  MILESTONES: { 3: 'extraLife', 5: 'shield', 7: 'slowdown', 10: 'all' },
} as const;

/** Бонусы, которые выдаются за достижение вехи комбо. */
export type ComboMilestone = (typeof COMBO_CONFIG.MILESTONES)[keyof typeof COMBO_CONFIG.MILESTONES];

/** Значения комбо, на которых срабатывают вехи. */
export type ComboMilestoneCombo = keyof typeof COMBO_CONFIG.MILESTONES;

/**
 * Множитель очков для текущего комбо. Список отсортирован по убыванию `minCombo`,
 * поэтому первое подходящее условие — самое выгодное.
 */
export const getComboMultiplier = (combo: number): number =>
  COMBO_CONFIG.MULTIPLIERS.find((step) => combo >= step.minCombo)?.mult ?? 1;

/**
 * Веха для комбо или `null`, если комбо её не достигает.
 *
 * Перебор через `Object.entries`, потому что ключи `MILESTONES` после `as const`
 * — это литералы `3 | 5 | 7 | 10`, и индексация по `number` в strict TypeScript
 * не проходит.
 */
export const getComboMilestone = (combo: number): ComboMilestone | null => {
  const entry = Object.entries(COMBO_CONFIG.MILESTONES).find(([key]) => Number(key) === combo);

  return entry ? entry[1] : null;
};
