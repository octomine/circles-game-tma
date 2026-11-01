'use client';

import { HeartIcon as HeartIconOutline } from '@heroicons/react/24/outline';
import { HeartIcon, ShieldCheckIcon } from '@heroicons/react/24/solid';
import { useTranslations } from 'next-intl';

import { GAME_CONFIG, useGameSessionStore } from '@/entities/game-session';
import { cn } from '@/shared';

/** Размер сердечка: 6 (1.5rem) в системе Tailwind. */
const HEART_SIZE = 'h-6 w-6';

/**
 * Жизни и щит.
 *
 * Потраченные жизни остаются на экране пустыми сердечками, а не исчезают:
 * так игрок видит и остаток, и потолок бонуса extraLife с вехи комбо.
 */
export const LivesDisplay = () => {
  const t = useTranslations('game');
  const lives = useGameSessionStore((state) => state.lives);
  const hasShield = useGameSessionStore((state) => state.hasShield);

  return (
    <div className="flex items-center gap-2" aria-label={t('hud.lives', { count: lives })}>
      <div className="flex gap-1">
        {Array.from({ length: GAME_CONFIG.MAX_LIVES }).map((_, index) => {
          const isFilled = index < lives;

          // Ключ по индексу: сердечки не переставляются, меняется только их вид.
          return isFilled ? (
            <HeartIcon key={index} className={cn(HEART_SIZE, 'text-danger')} />
          ) : (
            <HeartIconOutline key={index} className={cn(HEART_SIZE, 'text-text-muted')} />
          );
        })}
      </div>

      {/* Щит — бонус, а не жизнь: показываем отдельной иконкой рядом. */}
      {hasShield && <ShieldCheckIcon className={cn('h-5 w-5', 'text-primary')} />}
    </div>
  );
};
