import { FALLBACK_BEST_SCORE_KEY } from './constants';

/**
 * Приводит значение поля SDK к числу: внешний SDK может вернуть undefined, строку
 * или битое значение, поэтому всё нечисловое считаем нулём.
 */
export const toScoreNumber = (value: unknown): number => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

/** Читает локальный рекорд; null — если значения ещё нет. */
export const readFallbackBestScore = (): number | null => {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(FALLBACK_BEST_SCORE_KEY);
    if (stored === null) return null;

    const parsed = Number.parseInt(stored, 10);
    return Number.isFinite(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/**
 * Пишет локальный рекорд, только если результат лучше сохранённого:
 * иначе неудачная синхронизация затирала бы лучший результат худшим.
 */
export const writeFallbackBestScore = (score: number): void => {
  if (typeof window === 'undefined') return;

  try {
    const currentBest = readFallbackBestScore();
    if (currentBest !== null && score <= currentBest) return;

    localStorage.setItem(FALLBACK_BEST_SCORE_KEY, String(score));
  } catch (error) {
    console.warn('[player-score] Не удалось сохранить локальный рекорд:', error);
  }
};
