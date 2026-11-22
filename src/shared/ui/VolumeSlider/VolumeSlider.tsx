'use client';

import { useCallback, useRef, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

import { Button } from '../Button';

export interface VolumeSliderProps {
  /** Текущая громкость, 0–100. */
  value: number;
  /** Новое значение из жеста или клавиатуры, 0–100. */
  onChange: (value: number) => void;
  /** Звук заглушён: заполнение приглушается, а жест сначала включает звук. */
  isMuted: boolean;
  /** Иконка кнопки мьюта — компонент не знает, музыка это или эффекты. */
  icon: ReactNode;
  /** Переключить мьют по клику на иконку. */
  onToggleMute: () => void;
  /** Подпись для скринридеров: у слайдера нет видимого текста. */
  label?: string;
  className?: string;
}

/** Шаг изменения с клавиатуры: 20 нажатий на весь диапазон — привычная точность. */
const KEYBOARD_STEP = 5;
const MIN_VALUE = 0;
const MAX_VALUE = 100;

const clampValue = (value: number): number => Math.min(Math.max(value, MIN_VALUE), MAX_VALUE);

/**
 * Треугольный слайдер громкости без бегунка.
 *
 * Форма задана `clip-path` на контейнере: прямой угол в правом нижнем углу,
 * гипотенуза от левого нижнего к правому верхнему. Заполнение — обычный
 * прямоугольник, который обрезается формой родителя, поэтому при малых значениях
 * виден узкий клин у левого основания, а по мере роста он поднимается вправо, пока
 * при 100% не заполнит весь треугольник.
 *
 * Компонент чистый: ни GamePush, ни аудио-сервиса он не знает — только пропсы.
 */
export const VolumeSlider = ({
  value,
  onChange,
  isMuted,
  icon,
  onToggleMute,
  label,
  className,
}: VolumeSliderProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  // Флаг жеста, а не состояние: перерисовка на pointerdown не нужна, а замыкание
  // обработчиков с useState отставало бы на кадр от реального drag.
  const isDraggingRef = useRef(false);

  const valueFromClientX = useCallback((clientX: number): number | null => {
    const track = trackRef.current;
    if (!track) return null;

    const rect = track.getBoundingClientRect();
    // Нулевая ширина — элемент ещё не в лейауте; делить на неё нельзя.
    if (rect.width === 0) return null;

    const ratio = (clientX - rect.left) / rect.width;
    return Math.round(clampValue(ratio * MAX_VALUE));
  }, []);

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      // Правая кнопка мыши и средняя кнопка значение не меняют.
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      isDraggingRef.current = true;

      // Захват указателя: палец может уйти за пределы треугольника (он сужается
      // вверх), но движение всё равно продолжит менять громкость.
      event.currentTarget.setPointerCapture(event.pointerId);

      // Жест по заглушённому слайдеру — это намерение включить звук. Делаем это
      // до onChange, чтобы громкость применилась уже к включённому звуку.
      if (isMuted) onToggleMute();

      const nextValue = valueFromClientX(event.clientX);
      if (nextValue !== null) onChange(nextValue);
    },
    [isMuted, onToggleMute, onChange, valueFromClientX]
  );

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      // Без захвата двигать значение нельзя: обычное наведение мыши громкость не меняет.
      if (!isDraggingRef.current) return;

      const nextValue = valueFromClientX(event.clientX);
      if (nextValue !== null) onChange(nextValue);
    },
    [onChange, valueFromClientX]
  );

  const handlePointerEnd = useCallback((event: PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      let nextValue: number | null = null;

      if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
        nextValue = value + KEYBOARD_STEP;
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
        nextValue = value - KEYBOARD_STEP;
      } else if (event.key === 'Home') {
        nextValue = MIN_VALUE;
      } else if (event.key === 'End') {
        nextValue = MAX_VALUE;
      }

      // Клавиша не наша — отдаём её браузеру (Tab, Esc и прочая навигация).
      if (nextValue === null) return;

      // Стрелка по заглушённому слайдеру: иначе громкость менялась бы «в тишине»
      // и игрок не понял бы, что звук всё ещё выключен.
      if (isMuted) onToggleMute();

      event.preventDefault();
      onChange(clampValue(nextValue));
    },
    [value, isMuted, onToggleMute, onChange]
  );

  const clampedValue = clampValue(value);
  // При мьюте ползунок остаётся на месте — игрок видит, какая громкость включится
  // обратно, — но заполнение приглушается, чтобы состояние читалось без иконки.
  const fillClassName = cn(
    'bg-primary pointer-events-none absolute inset-y-0 left-0 transition-opacity duration-150',
    isMuted && 'opacity-40'
  );

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <Button
        variant="icon"
        aria-pressed={!isMuted}
        aria-label={label}
        onClick={onToggleMute}
        className={cn('shrink-0', isMuted ? 'text-text-muted' : 'text-primary')}
      >
        {icon}
      </Button>

      <div
        ref={trackRef}
        role="slider"
        aria-label={label}
        aria-valuemin={MIN_VALUE}
        aria-valuemax={MAX_VALUE}
        aria-valuenow={clampedValue}
        aria-valuetext={`${clampedValue}%`}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onKeyDown={handleKeyDown}
        // touch-none обязателен: без него вертикальный жест в Telegram-вебвью
        // прокручивает экран вместо перетаскивания ползунка.
        className={cn(
          'relative h-12 flex-1 cursor-pointer touch-none bg-white/15 select-none',
          '[clip-path:polygon(0_100%,100%_100%,100%_0)]',
          'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none'
        )}
      >
        {/* Ширина — единственный инлайн-стиль: значение приходит из пропсов и в
            статические классы Tailwind не превращается. Обрезает заполнение
            clip-path родителя. */}
        <div aria-hidden="true" className={fillClassName} style={{ width: `${clampedValue}%` }} />
      </div>
    </div>
  );
};
