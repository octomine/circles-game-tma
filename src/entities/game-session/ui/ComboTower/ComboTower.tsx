'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue } from 'motion/react';
import * as motion from 'motion/react-client';

import { cn } from '@/shared';

import { COMBO_CONFIG } from '../../config/comboConfig';
import { useGameSessionStore } from '../../model/gameSessionStore';

export interface ComboTowerProps {
  className?: string;
}

/** Цвета столбика: золотой, пока серия может вырасти, и красный, когда перерос. */
const ACTIVE_COLOR_IN_TIME = 'var(--color-gold)';
const ACTIVE_COLOR_OVERSHOOT = 'var(--color-danger)';

/**
 * Башня комбо: история интервалов «кирпичиками» и растущий активный столбик.
 *
 * Кирпичики — это уже случившиеся интервалы (эталоны прошлых кликов), активный
 * столбик — сколько игрового времени прошло с последнего попадания. Пока он
 * укладывается в прошлый интервал, серия вырастет (столбик золотой); перерос —
 * следующий клик уже не ускорение, комбо сбросится (столбик красный).
 *
 * Высота зависит от `gameTime`, который тикает каждый кадр, поэтому она живёт в
 * MotionValue и пишется прямо в DOM-стиль из requestAnimationFrame: через
 * состояние React это дало бы ~60 ре-рендеров в секунду.
 */
export const ComboTower = ({ className }: ComboTowerProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Только событийные поля: они меняются на клик, а не каждый кадр.
  const status = useGameSessionStore((state) => state.status);
  const intervalHistory = useGameSessionStore((state) => state.intervalHistory);
  const lastInterval = useGameSessionStore((state) => state.lastInterval);
  const lastClickGameTime = useGameSessionStore((state) => state.lastClickGameTime);

  // Высота и цвет активного столбика: их пишет rAF, а Motion применяет значения
  // к стилю в своём кадре — без ре-рендера компонента.
  const activeHeight = useMotionValue(0);
  const activeColor = useMotionValue(ACTIVE_COLOR_IN_TIME);

  // Последний интервал истории — это эталон активного столбика, а не отдельный
  // кирпичик: его «кирпич» ещё не завершён, поэтому в башню он не попадает.
  const bricks = intervalHistory.slice(0, -1);

  // В контейнер кладём кирпичи в хронологическом порядке: при flex-col-reverse
  // первый элемент оказывается у основания, то есть старые кирпичи внизу, а
  // свежие — наверху, вплотную к активному столбику. Лишние отбрасываем сами:
  // они должны исчезать со стороны основания, а overflow-hidden срезал бы
  // верхние, то есть самые свежие.
  const visibleBricks = bricks.slice(-COMBO_CONFIG.TOWER.MAX_VISIBLE_BRICKS);
  const bricksHeight =
    visibleBricks.length * (COMBO_CONFIG.TOWER.BRICK_HEIGHT + COMBO_CONFIG.TOWER.GAP);

  const isActive = status === 'playing' && lastClickGameTime !== null;

  useEffect(() => {
    if (!isActive) {
      activeHeight.set(0);
      return;
    }

    let frameId = 0;

    const updateActiveColumn = () => {
      const container = containerRef.current;

      if (container) {
        // Стор читаем напрямую: подписка на gameTime дала бы те же 60 рендеров.
        const state = useGameSessionStore.getState();
        const lastClick = state.lastClickGameTime;

        // Эталон: 0 означает «эталона ещё нет» — так его ставит первый клик,
        // поэтому 0 превращаем в MAX_INTERVAL (та же формула, что в сторе).
        const limit = lastInterval || COMBO_CONFIG.MAX_INTERVAL;

        // Место под активный столбик — половина свободной высоты: вторая половина
        // остаётся запасом на перерастание, пока стор не сбросит комбо.
        const freeHeight = container.clientHeight - bricksHeight;
        const maxActiveHeight = Math.max(freeHeight / 2, 0);

        const elapsed = lastClick === null ? 0 : Math.max(state.gameTime - lastClick, 0);

        // Перерос — столбик продолжает расти и уходит за верхний край под
        // overflow-hidden: момент, когда клик перестал быть ускорением, виден
        // игроку, но комбо сбрасывает стор, а не башня.
        const nextColor = elapsed > limit ? ACTIVE_COLOR_OVERSHOOT : ACTIVE_COLOR_IN_TIME;

        // Цвет пишем только на изменение: set одного и того же значения — лишняя
        // работа для Motion в каждом кадре.
        if (activeColor.get() !== nextColor) {
          activeColor.set(nextColor);
        }

        activeHeight.set((elapsed / limit) * maxActiveHeight);
      }

      frameId = requestAnimationFrame(updateActiveColumn);
    };

    frameId = requestAnimationFrame(updateActiveColumn);

    return () => cancelAnimationFrame(frameId);
  }, [isActive, lastInterval, bricksHeight, activeHeight, activeColor]);

  return (
    <div
      ref={containerRef}
      // flex-col-reverse: элементы растут снизу вверх (основание — низ башни).
      // overflow-hidden прячет активный столбик, переросший доступную высоту.
      className={cn('flex flex-col-reverse overflow-hidden', className)}
      style={{
        height: `${COMBO_CONFIG.TOWER.HEIGHT_VH}vh`,
        width: COMBO_CONFIG.TOWER.WIDTH,
      }}
      aria-hidden="true"
    >
      {/* Кирпичики: уже случившиеся интервалы, от старых к свежим. Высота у всех
          одинаковая (BRICK_HEIGHT), поэтому само значение интервала не читается:
          в башне важна их последовательность, а не длина. */}
      {visibleBricks.map((_interval, index) => (
        <div
          // Ключ по индексу: список — окно последних интервалов, и при сдвиге
          // окна важнее сохранить позицию кирпича в башне, чем его значение.
          key={index}
          className="bg-primary w-full rounded-sm"
          style={{
            height: COMBO_CONFIG.TOWER.BRICK_HEIGHT,
            marginBottom: COMBO_CONFIG.TOWER.GAP,
          }}
        />
      ))}

      {/* Активный столбик: растёт от последнего клика к следующему. */}
      {isActive && (
        <motion.div
          className="w-full rounded-sm"
          style={{ height: activeHeight, backgroundColor: activeColor }}
        />
      )}
    </div>
  );
};
