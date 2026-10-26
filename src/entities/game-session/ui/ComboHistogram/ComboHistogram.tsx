'use client';

import { useEffect } from 'react';
import { useMotionValue, useTransform } from 'motion/react';
import * as motion from 'motion/react-client';

import { cn } from '@/shared';

import { COMBO_CONFIG } from '../../config/comboConfig';
import { useGameSessionStore } from '../../model/gameSessionStore';

export interface ComboHistogramProps {
  className?: string;
}

/** Высота столбца в процентах от MAX_INTERVAL с потолком в 100%. */
const getBarHeightPercent = (intervalMs: number): number =>
  Math.min((intervalMs / COMBO_CONFIG.MAX_INTERVAL) * 100, 100);

export const ComboHistogram = ({ className }: ComboHistogramProps) => {
  // Подписываемся только на «событийные» поля: они меняются на клик, а не каждый кадр.
  // Подписка на gameTime дёргала бы ре-рендер ~60 раз в секунду, и вся работа
  // с MotionValue ниже потеряла бы смысл.
  const status = useGameSessionStore((state) => state.status);
  const intervalHistory = useGameSessionStore((state) => state.intervalHistory);
  const lastInterval = useGameSessionStore((state) => state.lastInterval);
  const lastClickGameTime = useGameSessionStore((state) => state.lastClickGameTime);

  // Сколько игрового времени прошло с последнего попадания. Значение живёт
  // в MotionValue: оно пишется прямо в DOM-стиль и не проходит через состояние React.
  const elapsedValue = useMotionValue(0);

  // useTransform отдаёт производный MotionValue: при каждом изменении elapsedValue
  // Motion сам пересчитывает высоту и применяет её к style.height в своём кадре,
  // без ре-рендера компонента. Поэтому столбец растёт плавно и бесплатно для React.
  const height = useTransform(elapsedValue, (elapsed) => `${getBarHeightPercent(elapsed)}%`);

  // Цвет тоже MotionValue: класс bg-gold/bg-danger на ходу не переключить без
  // ре-рендера, а через style это делает та же подписка. Столбец золотой, пока
  // укладывается в прошлый интервал (серия вырастет), и красный, когда перерос
  // его — такой клик уже не ускорение и комбо сбросится.
  const backgroundColor = useTransform(elapsedValue, (elapsed) =>
    elapsed < (lastInterval || COMBO_CONFIG.MAX_INTERVAL)
      ? 'var(--color-gold)'
      : 'var(--color-danger)'
  );

  const isActive = status === 'playing' && lastClickGameTime !== null;

  useEffect(() => {
    if (!isActive) {
      elapsedValue.set(0);
      return;
    }

    let frameId = 0;

    const updateElapsed = () => {
      // Читаем стор напрямую, а не через селектор: rAF идёт каждый кадр, и
      // подписка на gameTime дала бы те же 60 ре-рендеров, от которых мы ушли.
      const state = useGameSessionStore.getState();
      const lastClick = state.lastClickGameTime;

      elapsedValue.set(lastClick === null ? 0 : Math.max(state.gameTime - lastClick, 0));

      frameId = requestAnimationFrame(updateElapsed);
    };

    frameId = requestAnimationFrame(updateElapsed);

    return () => cancelAnimationFrame(frameId);
  }, [isActive, elapsedValue]);

  return (
    // Гистограмма — декоративный элемент поверх канваса.
    <div className={cn('flex h-24 w-full max-w-xs items-end gap-1', className)} aria-hidden="true">
      {/* Завершённые столбцы: интервалы уже случившихся попаданий. */}
      {intervalHistory.map((interval, index) => (
        <div
          key={index}
          className="bg-primary w-4 rounded-t-sm"
          style={{ height: `${getBarHeightPercent(interval)}%` }}
        />
      ))}

      {/* Активный столбец: растёт от последнего клика к следующему. */}
      {isActive && <motion.div style={{ height, backgroundColor }} className="w-4 rounded-t-sm" />}
    </div>
  );
};
