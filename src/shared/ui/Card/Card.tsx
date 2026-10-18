import { type ComponentPropsWithoutRef, type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export interface CardProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  className?: string;
  children: ReactNode;
}

/**
 * Стеклянная карточка: полупрозрачная surface-подложка + blur и мягкая тень.
 */
export const Card = ({ className, children, ...rest }: CardProps) => (
  // cn нужен, чтобы внешний className мог переопределить паддинги или радиус,
  // а конфликтующие утилиты не остались в итоговой строке классов.
  <div
    className={cn(
      'bg-surface shadow-glass rounded-2xl border border-white/10 backdrop-blur-md',
      className
    )}
    {...rest}
  >
    {children}
  </div>
);
