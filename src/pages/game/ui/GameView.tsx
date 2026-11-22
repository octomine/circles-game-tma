'use client';

import { useEffect, useRef } from 'react';

import { AUDIO_CONFIG, useGameSessionStore, type GameStatus } from '@/entities/game-session';
import { startGameplay, stopGameplay, useGamePush } from '@/shared/gamepush';
import { useToastStore } from '@/shared/lib/toast';
import { GameCanvasWidget } from '@/widgets/game-canvas';
import { GameHUDWidget } from '@/widgets/game-hud';
import { ToastManager } from '@/widgets/toast-manager';

export const GameView = () => {
  const { gp } = useGamePush();

  const status = useGameSessionStore((state) => state.status);
  const score = useGameSessionStore((state) => state.score);
  const startGame = useGameSessionStore((state) => state.startGame);

  const addToast = useToastStore((state) => state.addToast);
  const clearToasts = useToastStore((state) => state.clearToasts);

  // Предыдущий статус: по нему отличаем вход в игру от возврата из паузы.
  const prevStatusRef = useRef<GameStatus>(status);

  // Экран игры мог открыться поверх незавершённой сессии: из лидерборда (там
  // кнопка «Играть снова» уже зовёт startGame, но страховка бесплатна) и после
  // HMR-перезагрузки модуля. Статус читаем из стора, а не из замыкания: мост
  // GamePush ниже только что мог его изменить.
  useEffect(() => {
    if (useGameSessionStore.getState().status === 'gameover') {
      startGame();
    }
  }, [startGame]);

  // Проигрыш → тост с результатами.
  //
  // Проверка на уже существующий тост нужна потому, что эффект зависит от score:
  // любой ре-рендер с изменившимся счётом при том же статусе добавил бы второй
  // экземпляр окна результатов. Она же глушит двойной прогон в StrictMode.
  //
  // Звук не проигрывается здесь: тост лишь называет его полем `sfx`, а запускает
  // ToastManager — в момент фактического появления карточки и ровно один раз.
  useEffect(() => {
    if (status !== 'gameover') return;

    const hasGameOverToast = useToastStore
      .getState()
      .toasts.some((toast) => toast.type === 'gameover');

    if (hasGameOverToast) return;

    addToast({ type: 'gameover', payload: { score }, sfx: AUDIO_CONFIG.SFX.GAMEOVER.id });
  }, [status, score, addToast]);

  // Старт новой партии сметает тосты прошлой: экран результатов не должен
  // пережить «Играть снова», даже если его закрытие ещё доигрывает анимацию.
  useEffect(() => {
    if (status === 'playing') {
      clearToasts();
    }
  }, [status, clearToasts]);

  // Страховка на выходе с экрана: стор тостов живёт дольше GameView, и тост,
  // закрытый не кнопкой (новый путь навигации, HMR), иначе всплыл бы при
  // следующем возврате в игру. Кнопки закрывают тост сами — там это нужно
  // раньше, чтобы exit-анимация началась от нажатия.
  useEffect(() => clearToasts, [clearToasts]);

  // Мост «стор → GamePush»: границы геймплей-сессии раунда.
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    // Свёрнутая вкладка — игра не идёт (стор ставит 'paused' по visibilitychange):
    // пауза не должна засчитываться площадке как геймплей.
    if (status === 'paused' && prevStatus === 'playing') {
      stopGameplay(gp);
    }

    // Game over закрывает сессию сам тост (GameOverToast) — там же, где
    // сохраняется рекорд, чтобы порядок «стоп → сохранение» жил в одном месте.
    //
    // А вот возврат ИЗ game over обязан открыть сессию заново: иначе раунд
    // «Играть снова» шёл бы для площадки без геймплей-сессии. startGameplay
    // идемпотентен (модульный флаг в gameplay.ts), поэтому лишним он не будет.
    if (status === 'playing' && (prevStatus === 'paused' || prevStatus === 'gameover')) {
      startGameplay(gp);
    }
  }, [status, gp]);

  return (
    <div className="relative h-dvh w-screen overflow-hidden">
      {/* Канвас с игрой (фон) */}
      <GameCanvasWidget />

      {/* HUD во время игры */}
      {status === 'playing' && <GameHUDWidget />}

      {/* Тосты живут ВНУТРИ GameView, а не отдельным экраном роутера: канвас —
          их сиблинг, а не родитель, поэтому появление и исчезновение тоста его
          не перемонтирует. Навигация всё это время остаётся на 'game',
          GameCanvasWidget не размонтируется, и его cleanup не уничтожает
          PIXI.Application — за окном результатов остаётся застывший кадр партии
          (тикер сам выходит по status !== 'playing'). */}
      <ToastManager />
    </div>
  );
};
