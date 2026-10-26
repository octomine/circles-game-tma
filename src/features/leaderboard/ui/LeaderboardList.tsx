'use client';

import { ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { TrophyIcon } from '@heroicons/react/24/solid';
import { type Variants } from 'motion/react';
import * as motion from 'motion/react-client';
import { useTranslations } from 'next-intl';

import { cn } from '@/shared';
import { AnimatedStack, Button, Text } from '@/shared/ui';

import type { LeaderboardPlayer } from '../model/types';

interface LeaderboardListProps {
  players: LeaderboardPlayer[];
  me: LeaderboardPlayer | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
}

interface LeaderboardRowProps {
  player: LeaderboardPlayer;
  isMe: boolean;
}

// Сколько строк-заглушек показываем во время загрузки: примерно высота первого экрана.
const SKELETON_ROWS = 5;

// Подсветка призовых мест в списке: золото, серебро, бронза.
const TOP_POSITION_CLASSES: Record<number, string> = {
  1: 'text-gold',
  2: 'text-slate-300',
  3: 'text-amber-600',
};

/**
 * Варианты строки списка. Метки hidden/visible строка не задаёт сама: их
 * рассылает AnimatedStack (initial="hidden" animate="visible") через
 * MotionContext, а staggerChildren в его варианте visible запускает строки
 * по очереди — по одному сдвигу на строку. Строке достаточно объявить те же
 * метки в variants, чтобы попасть в каскад.
 */
const rowVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
};

/**
 * Строка списка. Вынесена отдельно, чтобы тяжёлый рендер списка не разрастался
 * в один компонент и подсветку места не приходилось считать в общем теле.
 */
const LeaderboardRow = ({ player, isMe }: LeaderboardRowProps) => {
  const positionClassName = TOP_POSITION_CLASSES[player.position];
  // Аватар приходит с внешнего хостинга GamePush, а проект собирается статикой:
  // next/image потребовал бы перечислять домены в remotePatterns.
  // Читаем в локальную константу: так сужение типа работает без приведения.
  const avatar = player.avatar;
  const initial = player.name.charAt(0).toUpperCase();

  return (
    <motion.div
      variants={rowVariants}
      className={cn(
        'flex items-center gap-3 rounded-xl border border-transparent p-3 transition-colors',
        // Свою строку выделяем неоновой обводкой: так своё место видно прямо в списке.
        isMe
          ? 'bg-primary/10 border-primary/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
          : 'bg-surface'
      )}
    >
      <div className={cn('text-text-muted w-6 text-center font-bold', positionClassName)}>
        {/* У лидера трофей вместо цифры: в слот w-6 они вдвоём не помещаются,
            а место остаётся доступным скринридеру через sr-only. */}
        {player.position === 1 ? (
          <>
            <TrophyIcon className="mx-auto h-5 w-5" aria-hidden />
            <span className="sr-only">{player.position}</span>
          </>
        ) : (
          player.position
        )}
      </div>

      {avatar ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatar} alt="" loading="lazy" className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold">
          {initial}
        </div>
      )}

      <div className="flex-1 truncate font-bold">{player.name}</div>
      <div className="text-primary font-black tabular-nums">{player.score}</div>
    </motion.div>
  );
};

/**
 * Презентационный список лидерборда: только рендер, запросы делает вызывающий экран.
 */
export const LeaderboardList = ({ players, me, loading, error, onRetry }: LeaderboardListProps) => {
  const t = useTranslations('leaderboard');

  if (loading) {
    return (
      <div className="flex flex-col gap-2">
        {Array.from({ length: SKELETON_ROWS }, (_, index) => (
          <div key={index} className="h-14 animate-pulse rounded-xl bg-white/5" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <ExclamationTriangleIcon className="text-danger h-10 w-10" aria-hidden />
        <Text className="text-center">{t('error')}</Text>
        <Button variant="primary" size="sm" onClick={onRetry}>
          {t('retry')}
        </Button>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <UserGroupIcon className="text-text-muted h-10 w-10" aria-hidden />
        <Text className="text-center">{t('empty')}</Text>
      </div>
    );
  }

  return (
    // AnimatedStack задаёт только motion-обёртку с метками hidden/visible:
    // раскладка (flex, gap) приходит сюда классом и не меняется.
    <AnimatedStack className="flex flex-col gap-2">
      {players.map((player) => (
        <LeaderboardRow
          key={player.id}
          player={player}
          // Строку текущего игрока подсвечиваем: так его место видно прямо в списке.
          isMe={me !== null && player.id === me.id}
        />
      ))}
    </AnimatedStack>
  );
};
