'use client';

import { TrophyIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

import { useGameSessionStore } from '@/entities/game-session';
import { BestScoreDisplay } from '@/entities/player-score';
import { useSaveScore } from '@/features/save-score';
import { useGameNavigation } from '@/shared/navigation';
import { Button, Card, Text } from '@/shared/ui';

// Параметры анимации «накрутки» счёта: сколько шагов и за какое время.
const COUNT_UP_STEPS = 30;
const COUNT_UP_DURATION_MS = 1500;

export const GameOverWidget = () => {
  const tGame = useTranslations('game');
  const tCommon = useTranslations('common');

  const { setScreen } = useGameNavigation();

  const finalScore = useGameSessionStore((state) => state.score);
  const reset = useGameSessionStore((state) => state.reset);

  const { saveScore } = useSaveScore();

  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);

  // Защита от двойного сохранения: StrictMode прогоняет эффект дважды.
  const didSaveRef = useRef(false);

  // Анимация «накрутки» счёта: цифра растёт от нуля до итогового результата.
  useEffect(() => {
    if (finalScore === 0) {
      setDisplayedScore(0);
      return;
    }

    const increment = finalScore / COUNT_UP_STEPS;
    const stepDuration = COUNT_UP_DURATION_MS / COUNT_UP_STEPS;
    let step = 0;

    const timer = setInterval(() => {
      step += 1;

      if (step >= COUNT_UP_STEPS) {
        clearInterval(timer);
        setDisplayedScore(finalScore);
        return;
      }

      setDisplayedScore(Math.min(Math.round(increment * step), finalScore));
    }, stepDuration);

    return () => clearInterval(timer);
  }, [finalScore]);

  useEffect(() => {
    if (didSaveRef.current) return;

    didSaveRef.current = true;

    // Сохраняем сразу при появлении экрана: кнопка «Играть снова» перезапускает сессию,
    // поэтому сохранять при клике было бы поздно.
    // Флага отмены здесь нет намеренно: в StrictMode второй прогон эффекта выходит
    // по didSaveRef, и отмена первого прогона оставила бы экран без результата.
    void saveScore(finalScore).then((result) => {
      // SDK ещё не готов или синхронизация упала: снимаем флаг, чтобы попытка
      // повторилась, когда облако станет доступно (saveScore сменит ссылку).
      if (!result.success) {
        didSaveRef.current = false;
      }

      setIsNewRecord(result.success && result.isNewRecord);
      setIsScoreSaved(true);
    });
  }, [finalScore, saveScore]);

  const handlePlayAgain = () => {
    // Сброс сессии выполняет сам игровой экран при монтировании: здесь только навигация.
    setScreen('game');
  };

  const handleOpenLeaderboard = () => {
    setScreen('leaderboard');
  };

  const handleGoToMenu = () => {
    reset();
    setScreen('menu');
  };

  // Пока результат сохранения неизвестен, плашку не показываем: иначе экран
  // успел бы мигнуть «не рекорд» у игрока, который как раз побил рекорд.
  const showNewRecord = isScoreSaved && isNewRecord;
  const showBestScore = isScoreSaved && !isNewRecord;
  const showRecordPending = !isScoreSaved;

  return (
    <div className="relative flex min-h-screen items-center justify-center p-6">
      <div className="relative z-10 w-full max-w-sm">
        <Card className="flex w-full flex-col items-center p-8">
          <Text className="text-text-muted mb-2 text-sm tracking-widest uppercase">
            {tGame('gameOver.title')}
          </Text>

          <Text className="text-text-muted mb-1 text-sm">{tGame('gameOver.finalScoreLabel')}</Text>
          <div className="mb-6 text-7xl font-black text-white tabular-nums">{displayedScore}</div>

          {showNewRecord && (
            <div className="bg-gold/20 text-gold mb-8 flex items-center gap-2 rounded-full px-4 py-2 font-bold">
              <TrophyIcon className="h-5 w-5" />
              {tGame('gameOver.newRecord')}
            </div>
          )}

          {/* Побитый рекорд показываем вместо старого: значение уже перезаписано новым. */}
          {showBestScore && (
            <Text className="text-text-muted mb-8">
              <BestScoreDisplay />
            </Text>
          )}

          {/* Строка занимает то же место, что и результат: без «прыжка» вёрстки при загрузке. */}
          {showRecordPending && (
            <Text className="text-text-muted mb-8">
              {tGame('gameOver.bestScoreRecord', { score: '...' })}
            </Text>
          )}

          <div className="flex w-full flex-col gap-4">
            <Button variant="primary" size="lg" className="w-full" onClick={handlePlayAgain}>
              {tCommon('buttons.playAgain')}
            </Button>

            <Button
              variant="secondary"
              size="md"
              className="w-full"
              onClick={handleOpenLeaderboard}
            >
              {tCommon('buttons.leaderboard')}
            </Button>

            <Button variant="secondary" size="md" className="w-full" onClick={handleGoToMenu}>
              {tCommon('buttons.menu')}
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
