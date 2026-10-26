'use client';

import { type ComponentPropsWithoutRef, type ReactNode } from 'react';
import { type Variants } from 'motion/react';
import * as motion from 'motion/react-client';

import { cn } from '@/shared/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'icon';
export type ButtonSize = 'sm' | 'md' | 'lg';

// Motion объявляет onDrag/onDragStart/onDragEnd/onAnimationStart со своей сигнатурой
// (event, info), а не как DOM-обработчики, поэтому их приходится исключать:
// иначе строгий TS не даст пробросить rest в motion.button.
export interface ButtonProps extends Omit<
  ComponentPropsWithoutRef<'button'>,
  'children' | 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'
> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}

const BASE_CLASSES =
  'inline-flex items-center justify-center gap-2 rounded-xl font-bold transition-all duration-100 select-none';

// Варианты задают только «шкурку»: цвет и способ реакции на нажатие.
const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  // shadow-btn — это подложка снизу (0 4px 0 primary-dark). В active кнопка
  // съезжает вниз на эту же высоту (translate-y-1) и тень убирается: получается
  // эффект физического нажатия, без CSS-модулей и инлайн-стилей.
  primary:
    'bg-primary text-text shadow-btn hover:bg-blue-500 active:translate-y-1 active:shadow-none',
  secondary: 'border border-white/10 bg-surface text-text hover:bg-white/10',
  icon: 'rounded-full bg-surface p-3 text-text hover:bg-white/10',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

// Кнопка не управляет своим появлением: initial/animate задаёт родитель (AnimatedStack).
// Свои variants нужны только чтобы Motion подхватил каскад по меткам hidden/visible.
const BUTTON_VARIANTS: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Базовая кнопка UI-Kit. У варианта icon размеры игнорируются: квадрат задаётся p-3.
 */
export const Button = ({
  variant = 'primary',
  size = 'md',
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) => {
  // cn склеивает классы и через tailwind-merge убирает конфликты: className снаружи
  // может переопределить цвет или отступ, не дублируя утилиты в разметке.
  const classes = cn(
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    variant !== 'icon' && SIZE_CLASSES[size],
    className
  );

  return (
    // Motion анимирует transform (scale), а Tailwind в active — отдельное свойство
    // translate, поэтому «физическое нажатие» и пружина не перезаписывают друг друга.
    <motion.button
      type={type}
      className={classes}
      variants={BUTTON_VARIANTS}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
      {...rest}
    >
      {children}
    </motion.button>
  );
};
