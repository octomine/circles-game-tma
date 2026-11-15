'use client';

import { type ComponentPropsWithoutRef } from 'react';

import { cn } from '@/shared/lib/cn';

export interface ToggleProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'onClick' | 'aria-checked'
> {
  /** Текущее положение переключателя. */
  checked: boolean;
  /**
   * Команда «переключи», а не «поставь в значение»: фактическое состояние диктует
   * источник истины (SDK), и переключатель лишь сообщает о намерении игрока.
   */
  onToggle: () => void;
  /** Подпись для скринридеров: у переключателя нет видимого текста. */
  label: string;
  className?: string;
}

/**
 * Переключатель вкл/выкл. Сделан кнопкой с role="switch": у него есть клавиатурный
 * фокус и озвучка состояния, в отличие от div с обработчиком клика.
 */
export const Toggle = ({ checked, onToggle, label, className, ...rest }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    onClick={onToggle}
    className={cn(
      // Без рамки: при border-box она съедала бы по пикселю с каждой стороны,
      // и кружок стоял бы несимметрично в положениях вкл/выкл.
      'relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors duration-150',
      'focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none',
      checked ? 'bg-primary' : 'bg-white/20',
      className
    )}
    {...rest}
  >
    {/* Кружок смещается классом translate, а не отдельной геометрией: так положение
        и анимация остаются в одной системе координат Tailwind и не расходятся. */}
    <span
      aria-hidden="true"
      className={cn(
        'pointer-events-none inline-block h-5 w-5 rounded-full bg-white transition-transform duration-150',
        checked ? 'translate-x-6' : 'translate-x-1'
      )}
    />
  </button>
);
