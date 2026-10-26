'use client';

import { ArrowPathIcon } from '@heroicons/react/24/outline';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { LeaderboardList, useFetchLeaderboard, usePlayerRating } from '@/features/leaderboard';
import { useGamePush } from '@/shared/gamepush';
import { useGameNavigation } from '@/shared/navigation';
import { Button, Card, Text, Title } from '@/shared/ui';

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
  // поэтому его строку добавляем сами — иначе подсветить себя в списке было бы нечем.
  const rows = useMemo(() => {
    const hasMe = me !== null && players.some((player) => player.id === me.id);
    const merged = hasMe || me === null ? players : [...players, me];

    return [...merged].sort((first, second) => first.position - second.position);
  }, [players, me]);

  const place = rating?.player?.position || '-';
  // Пока SDK грузится, список ещё пуст: без этого на кадр мелькал бы экран «Пока никого нет».
  const isListLoading = loading || !isReady;

  // Фон (AnimatedBackground) живёт в GameRouterView: сам экран прозрачный,
  // иначе он перекрыл бы PixiJS-слой.
  return (
    <div className="relative flex min-h-screen flex-col p-6">
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="mb-6 flex items-center justify-between">
          <Title as="h1">{t('title')}</Title>

          <Button variant="icon" aria-label={t('refresh')} onClick={handleRefresh}>
            {/* Пока идёт загрузка (включая ожидание готовности SDK) вращение
                бесконечно; когда данные пришли, motion доигрывает возврат
                к rotate: 0 за 0.3s — иконка тормозит плавно, а не рывком. */}
            <motion.div
              animate={isListLoading ? { rotate: 360 } : { rotate: 0 }}
              transition={
                isListLoading
                  ? { repeat: Infinity, duration: 1, ease: 'linear' }
                  : { duration: 0.3 }
              }
            >
              <ArrowPathIcon className="h-6 w-6" />
            </motion.div>
          </Button>
        </div>

        {/* Компактный блок с местом текущего игрока */}
        <Card className="mb-6 p-4 text-center">
          <Text className="text-lg">
            {t.rich('yourPlace', {
              place,
              b: (chunks) => <span className="text-primary font-black">{chunks}</span>,
            })}
          </Text>
        </Card>

        {/* Список игроков */}
        <LeaderboardList
          players={rows}
          me={me}
          loading={isListLoading}
          error={error}
          onRetry={fetchLeaderboard}
        />

        <Button variant="secondary" className="mt-auto w-full" onClick={goBack}>
          {tCommon('buttons.back')}
        </Button>
      </div>
    </div>
  );
};
