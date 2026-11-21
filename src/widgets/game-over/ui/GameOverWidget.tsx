'use client';

import { TrophyIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useRef, useState } from 'react';
import * as motion from 'motion/react-client';

import { useGameSessionStore } from '@/entities/game-session';
import { BestScoreDisplay } from '@/entities/player-score';
import { useSaveScore } from '@/features/save-score';
import { stopGameplay, useGamePush } from '@/shared/gamepush';
import { useGameNavigation } from '@/shared/navigation';
import { Button, Card, Text } from '@/shared/ui';

// Параметры анимации «накрутки» счёта: сколько шагов и за какое время.
const COUNT_UP_STEPS = 30;
const COUNT_UP_DURATION_MS = 1500;

/**
 * Модальное окно результатов.
 *
 * Виджет рендерится только когда статус сессии — 'gameover', поэтому его
 * монтирование и есть событие «раунд проигран»: на него и повешены сохранение
 * рекорда и закрытие геймплей-сессии площадки.
 */
export const GameOverWidget = () => {
  const tGame = useTranslations('game');
  const tCommon = useTranslations('common');

  const { gp } = useGamePush();

  const { setScreen } = useGameNavigation();

  const finalScore = useGameSessionStore((state) => state.score);
  const startGame = useGameSessionStore((state) => state.startGame);

  const { saveScore } = useSaveScore();

  const [isNewRecord, setIsNewRecord] = useState(false);
  const [isScoreSaved, setIsScoreSaved] = useState(false);
  const [displayedScore, setDisplayedScore] = useState(0);

  // Защита от двойного сохранения: StrictMode прогоняет эффект дважды.
  const didSaveRef = useRef(false);
  // То же для сигнала площадки: stopGameplay идемпотентен по модульному флагу,
  // но повторный вызов в StrictMode всё равно лишний раз дёргал бы SDK.
  const didStopGameplayRef = useRef(false);

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

  // Закрываем геймплей-сессию площадки здесь, а не в cleanup экрана игры: раунд
  // для игрока кончился именно сейчас, хотя канвас ещё смонтирован под оверлеем.
  // Обратный сигнал (startGameplay после «Играть снова») шлёт мост в GameView.
  useEffect(() => {
    if (didStopGameplayRef.current) return;

    didStopGameplayRef.current = true;

    stopGameplay(gp);
  }, [gp]);

  useEffect(() => {
    if (didSaveRef.current) return;

    didSaveRef.current = true;

    // Сохраняем сразу при появлении оверлея: кнопка «Играть снова» перезапускает
    // сессию, поэтому сохранять при клике было бы поздно.
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

  // «Играть снова»: только старт новой сессии. Оверлей исчезнет сам — статус
  // станет 'playing', а движок по смене статуса почистит круги прошлой партии.
  const handlePlayAgain = useCallback(() => {
    startGame();
  }, [startGame]);

  // «В меню»: смена экрана размонтирует GameView, и PixiJS уничтожит приложение
  // в своём cleanup. Перезагрузка страницы не нужна.
  const handleGoToMenu = useCallback(() => {
    setScreen('menu');
  }, [setScreen]);

  const handleOpenLeaderboard = useCallback(() => {
    setScreen('leaderboard');
  }, [setScreen]);

  // Пока результат сохранения неизвестен, плашку не показываем: иначе экран
  // успел бы мигнуть «не рекорд» у игрока, который как раз побил рекорд.
  const showNewRecord = isScoreSaved && isNewRecord;
  const showBestScore = isScoreSaved && !isNewRecord;
  const showRecordPending = !isScoreSaved;

  return (
    // Подложка — отдельный motion.div без transform-анимации: если бы её
    // «везла» та же пружина, что и карточку, затемнение уезжало бы вместе с ней
    // и на время выезда открывало низ экрана.
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm"
    >
      {/* Карточка выезжает снизу вверх с пружиной. max-w-sm и w-full — на обёртке:
          в flex-контейнере ширину задаёт flex-элемент, и Card без обёртки сжался
          бы по содержимому. */}
      <motion.div
        className="w-full max-w-sm"
        initial={{ opacity: 0, y: 120 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 80 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
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
      </motion.div>
    </motion.div>
  );
};
