import { type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export type TitleLevel = 'h1' | 'h2' | 'h3';

export interface TitleProps {
  as?: TitleLevel;
  className?: string;
  children: ReactNode;
}

/**
 * Заголовок экрана. Уровень тега задаётся пропом as, стиль от него не зависит:
 * семантику (h1/h2/h3) и размер можно менять независимо.
 */
export const Title = ({ as: Tag = 'h1', className, children }: TitleProps) => (
  <Tag className={cn('text-text text-3xl font-black', className)}>{children}</Tag>
);
