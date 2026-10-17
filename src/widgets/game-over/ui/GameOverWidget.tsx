'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useGameSessionStore } from '@/entities/game-session';
import { BestScoreDisplay } from '@/entities/player-score';
import { useSaveScore } from '@/features/save-score';
import { cn } from '@/shared';
import { useGameNavigation } from '@/shared/navigation';

export const GameOverWidget = () => {
  const tGame = useTranslations('game');
  const tCommon = useTranslations('common');

  const { setScreen } = useGameNavigation();

  const score = useGameSessionStore((state) => state.score);
  const startGame = useGameSessionStore((state) => state.startGame);
  const reset = useGameSessionStore((state) => state.reset);

  const { saveScore } = useSaveScore();

  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);

  // Защита от двойного сохранения: StrictMode прогоняет эффект дважды.
  const didSaveRef = useRef(false);

  useEffect(() => {
    if (didSaveRef.current) return;

    didSaveRef.current = true;

    // Сохраняем сразу при появлении экрана: кнопка «Играть снова» сбрасывает счёт,
    // поэтому сохранять при клике было бы поздно.
    // Флага отмены здесь нет намеренно: в StrictMode второй прогон эффекта выходит
    // по didSaveRef, и отмена первого прогона оставила бы экран без результата.
    void saveScore(score).then((result) => {
      // SDK ещё не готов или синхронизация упала: снимаем флаг, чтобы попытка
      // повторилась, когда облако станет доступно (saveScore сменит ссылку).
      if (!result.success) {
        didSaveRef.current = false;
      }

      setIsNewRecord(result.success && result.isNewRecord);
      setIsScoreSaved(true);
    });
  }, [score, saveScore]);

  // Анимация "накрутки" счёта
  useEffect(() => {
    if (score === 0) {
      setDisplayedScore(0);
      return;
    }

    const duration = 1500;
    const steps = 30;
    const increment = score / steps;
    const stepDuration = duration / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      current = Math.min(Math.round(increment * step), score);
      setDisplayedScore(current);

      if (step >= steps) {
        clearInterval(timer);
        setDisplayedScore(score);
      }
    }, stepDuration);

    return () => clearInterval(timer);
  }, [score]);

  const handleRetry = () => {
    startGame();
    setScreen('game');
  };

  const handleOpenLeaderboard = () => {
    setScreen('leaderboard');
  };

  const handleGoToMenu = () => {
    reset();
    setScreen('menu');
  };

  return (
    <div
      className={cn(
        'fixed inset-0 z-50',
        'flex flex-col items-center justify-center',
        'bg-black/70 backdrop-blur-md',
        'p-6',
        'animate-fade-in'
      )}
    >
      <div
        className={cn(
          'flex w-full max-w-sm flex-col items-center',
          'rounded-3xl p-8',
          'bg-[var(--tg-theme-bg-color)]',
          'shadow-2xl',
          'animate-scale-in'
        )}
      >
        {/* Заголовок */}
        <h1 className={cn('mb-6 text-3xl font-extrabold', 'text-[var(--tg-theme-text-color)]')}>
          {tGame('gameOver.title')}
        </h1>

        {/* Финальный счёт текущей сессии */}
        <div className="mb-6 w-full text-center">
          <p
            className={cn('text-sm tracking-wider uppercase', 'text-[var(--tg-theme-hint-color)]')}
          >
            {tGame('gameOver.finalScoreLabel')}
          </p>
          <p
            className={cn('text-6xl font-bold tabular-nums', 'text-[var(--tg-theme-button-color)]')}
          >
            {displayedScore}
          </p>
        </div>

        {/* Плашка нового рекорда: только когда результат побил прежний */}
        {isNewRecord && (
          <div
            className={cn(
              'mb-6 w-full rounded-xl p-3 text-center',
              'bg-[var(--tg-theme-button-color)]/20',
              'animate-pulse'
            )}
          >
            <p className="text-lg font-bold">{tGame('gameOver.newRecord')}</p>
          </div>
        )}

        {/* Лучший счёт */}
        <div
          className={cn(
            'mb-8 w-full rounded-xl p-4 text-center',
            'bg-[var(--tg-theme-secondary-bg-color)]'
          )}
        >
          <p
            className={cn('text-sm tracking-wider uppercase', 'text-[var(--tg-theme-hint-color)]')}
          >
            {tGame('gameOver.bestScoreTitle')}
          </p>
          <p className={cn('text-3xl font-bold tabular-nums', 'text-[var(--tg-theme-text-color)]')}>
            {/* Монтируем после сохранения, иначе компонент прочитал бы старый рекорд до записи */}
            {isScoreSaved ? <BestScoreDisplay /> : '...'}
          </p>
        </div>

        {/* Кнопки */}
        <div className="flex w-full flex-col gap-3">
          <button
            onClick={handleRetry}
            className={cn(
              'w-full rounded-xl',
              'bg-[var(--tg-theme-button-color)]',
              'px-6 py-4 text-lg font-bold',
              'text-[var(--tg-theme-button-text-color)]',
              'shadow-lg transition-all active:scale-95'
            )}
          >
            {tCommon('buttons.retry')} 🔄
          </button>

          <button
            onClick={handleOpenLeaderboard}
            className={cn(
              'w-full rounded-xl',
              'bg-[var(--tg-theme-secondary-bg-color)]',
              'px-6 py-4 text-lg font-bold',
              'text-[var(--tg-theme-text-color)]',
              'transition-all active:scale-95'
            )}
          >
            {tCommon('buttons.leaderboard')} 🏆
          </button>

          <button
            onClick={handleGoToMenu}
            className={cn(
              'w-full rounded-xl',
              'bg-[var(--tg-theme-secondary-bg-color)]',
              'px-6 py-4 text-lg font-bold',
              'text-[var(--tg-theme-text-color)]',
              'transition-all active:scale-95'
            )}
          >
            {tCommon('buttons.menu')} 🏠
          </button>
        </div>
      </div>
    </div>
  );
};
