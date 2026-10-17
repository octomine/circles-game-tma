'use client';

import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { LeaderboardList, useFetchLeaderboard, usePlayerRating } from '@/features/leaderboard';
import { cn } from '@/shared';
import { useGamePush } from '@/shared/gamepush';
import { useGameNavigation } from '@/shared/navigation';

export const LeaderboardWidget = () => {
  const t = useTranslations('leaderboard');
  const tCommon = useTranslations('common');

  const { goBack } = useGameNavigation();

  const { isReady } = useGamePush();

  const { players, me, loading, error, fetchLeaderboard } = useFetchLeaderboard({ limit: 20 });
  const { rating, fetchPlayerRating } = usePlayerRating();

  // Авто-загрузка выполняется один раз: StrictMode прогоняет эффект дважды.
  const didAutoFetchRef = useRef(false);

  useEffect(() => {
    // Ждём готовности SDK: иначе хуки вернули бы «SDK not ready» вместо данных.
    if (!isReady) return;
    // Повторный прогон эффекта (StrictMode) не должен дублировать запросы.
    if (didAutoFetchRef.current) return;
    didAutoFetchRef.current = true;

    // На этом экране авто-загрузка уместна: он самостоятельный, а не переиспользуемый компонент.
    void fetchLeaderboard();
    void fetchPlayerRating();
  }, [isReady, fetchLeaderboard, fetchPlayerRating]);

  const handleRefresh = useCallback(() => {
    void fetchLeaderboard();
    void fetchPlayerRating();
  }, [fetchLeaderboard, fetchPlayerRating]);

  // Мой игрок приходит отдельным полем и уже исключён из списка,
  // поэтому его строку добавляем сами — иначе подсветить себя в таблице было бы нечем.
  const rows = useMemo(() => {
    const hasMe = me !== null && players.some((player) => player.id === me.id);
    const merged = hasMe || me === null ? players : [...players, me];

    return [...merged].sort((first, second) => first.position - second.position);
  }, [players, me]);

  const place = rating?.player?.position ?? null;
  const placeLabel = place === null ? t('placeUnknown') : t('yourPlace', { place });

  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col items-center',
        'bg-[var(--tg-theme-bg-color)]',
        'p-6',
        'text-[var(--tg-theme-text-color)]'
      )}
    >
      <h1 className={cn('mb-4 text-3xl font-extrabold', 'text-[var(--tg-theme-button-color)]')}>
        {t('title')}
      </h1>

      {/* Компактный блок с местом текущего игрока */}
      <div
        className={cn(
          'mb-4 w-full max-w-md rounded-xl p-4 text-center',
          'bg-[var(--tg-theme-secondary-bg-color)]'
        )}
      >
        <p className="text-xl font-bold">{placeLabel}</p>
      </div>

      {/* Список игроков */}
      <div
        className={cn(
          'mb-4 w-full max-w-md flex-1 overflow-y-auto rounded-xl p-4',
          'bg-[var(--tg-theme-secondary-bg-color)]'
        )}
      >
        <LeaderboardList
          players={rows}
          me={me}
          loading={loading}
          error={error}
          onRetry={fetchLeaderboard}
        />
      </div>

      {/* Кнопки */}
      <div className="flex w-full max-w-md flex-col gap-3">
        <button
          onClick={handleRefresh}
          className={cn(
            'w-full rounded-xl px-6 py-4 text-lg font-bold',
            'bg-[var(--tg-theme-button-color)]',
            'text-[var(--tg-theme-button-text-color)]',
            'transition-all active:scale-95'
          )}
        >
          {t('refresh')} 🔄
        </button>

        <button
          onClick={goBack}
          className={cn(
            'w-full rounded-xl px-6 py-4 text-lg font-bold',
            'bg-[var(--tg-theme-secondary-bg-color)]',
            'text-[var(--tg-theme-text-color)]',
            'transition-all active:scale-95'
          )}
        >
          {tCommon('buttons.back')} ←
        </button>
      </div>
    </div>
  );
};
