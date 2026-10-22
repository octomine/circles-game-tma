import { type ReactNode } from 'react';

import { cn } from '@/shared/lib/cn';

export interface TextProps {
  className?: string;
  children: ReactNode;
}

/**
 * Обычный абзац: приглушённый цвет, чтобы визуально не спорить с заголовками.
 */
export const Text = ({ className, children }: TextProps) => (
  <p className={cn('text-text-muted text-base', className)}>{children}</p>
);
