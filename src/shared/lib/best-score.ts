const BEST_SCORE_KEY = 'color-clash-best-score';

export const getBestScore = (): number => {
  if (typeof window === 'undefined') return 0;

  try {
    const stored = localStorage.getItem(BEST_SCORE_KEY);
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
};

export const updateBestScore = (score: number): { isNewRecord: boolean; bestScore: number } => {
  if (typeof window === 'undefined') {
    return { isNewRecord: false, bestScore: 0 };
  }

  try {
    const currentBest = getBestScore();
    const isNewRecord = score > currentBest;

    if (isNewRecord) {
      localStorage.setItem(BEST_SCORE_KEY, String(score));
    }

    return {
      isNewRecord,
      bestScore: Math.max(currentBest, score),
    };
  } catch {
    return { isNewRecord: false, bestScore: score };
  }
};
