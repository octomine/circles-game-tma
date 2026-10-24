'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';

import { useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

/**
 * Индикатор щита: щит гасит один промах, но сам по себе не виден —
 * промах просто не снимает жизнь, и без плашки игрок не поймёт, почему.
 */
export const ShieldIndicator = () => {
  const t = useTranslations('game');
  const hasShield = useGameSessionStore((state) => state.hasShield);

  if (!hasShield) {
    return null;
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-full px-4 py-1.5',
        'bg-gold/20 text-gold',
        'backdrop-blur-sm'
      )}
    >
      <ShieldCheckIcon className="h-4 w-4" />
      <span className="text-xs font-bold tracking-wider uppercase">{t('hud.shield')}</span>
    </div>
  );
};
