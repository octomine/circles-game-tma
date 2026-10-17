'use client';

import { useTranslations } from 'next-intl';

import { cn } from '@/shared';

import type { LeaderboardPlayer } from '../model/types';

interface LeaderboardListProps {
  players: LeaderboardPlayer[];
  me: LeaderboardPlayer | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

/**
 * Презентационный список лидерборда: только рендер, запросы делает вызывающий экран.
 */
export const LeaderboardList = ({ players, me, loading, error, onRetry }: LeaderboardListProps) => {
  const t = useTranslations('leaderboard');

  if (loading) {
    return (
      <p className={cn('py-8 text-center', 'text-[var(--tg-theme-hint-color)]')}>{t('loading')}</p>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <p className={cn('text-center', 'text-[var(--tg-theme-hint-color)]')}>{t('error')}</p>
        <button
          onClick={onRetry}
          className={cn(
            'rounded-xl px-6 py-3 font-bold',
            'bg-[var(--tg-theme-button-color)]',
            'text-[var(--tg-theme-button-text-color)]',
            'transition-all active:scale-95'
          )}
        >
          {t('retry')}
        </button>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <p className={cn('py-8 text-center', 'text-[var(--tg-theme-hint-color)]')}>{t('empty')}</p>
    );
  }

  return (
    <table className="w-full border-collapse text-left">
      <thead>
        <tr className={cn('text-xs tracking-wider uppercase', 'text-[var(--tg-theme-hint-color)]')}>
          <th className="py-2 pr-2 font-medium">{t('columns.position')}</th>
          <th className="py-2 pr-2 font-medium">{t('columns.name')}</th>
          <th className="py-2 text-right font-medium">{t('columns.score')}</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player) => {
          // Строку текущего игрока подсвечиваем: так его место видно прямо в списке.
          const isMe = me !== null && player.id === me.id;

          return (
            <tr
              key={player.id}
              className={cn(
                'border-t border-white/10',
                isMe && 'bg-[var(--tg-theme-button-color)]/20 font-bold'
              )}
            >
              <td className="py-2 pr-2 tabular-nums">{player.position}</td>
              <td className="py-2 pr-2 break-all">{player.name}</td>
              <td className="py-2 text-right tabular-nums">{player.score}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};
