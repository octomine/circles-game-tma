'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useGameSessionStore } from '@/entities/game-session';
import { cn, useTelegram } from '@/shared';

export function MainMenuWidget() {
  const router = useRouter();
  const tMenu = useTranslations('menu');
  const tCommon = useTranslations('common');

  const { isReady, user, webApp } = useTelegram();
  const score = useGameSessionStore((state) => state.score);

  const handleStartGame = () => {
    webApp?.HapticFeedback.impactOccurred('medium');
    router.push('/game');
  };

  // Показываем лоадер, пока Telegram SDK не инициализирован
  if (!isReady) {
    return (
      <div
        className={cn(
          'flex h-screen w-full items-center justify-center',
          'bg-[var(--tg-theme-bg-color)]'
        )}
      >
        <span className="text-[var(--tg-theme-hint-color)]">{tCommon('loading')}</span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex h-screen w-full flex-col items-center justify-center',
        'bg-[var(--tg-theme-bg-color)]',
        'p-6',
        'text-[var(--tg-theme-text-color)]'
      )}
    >
      {/* Логотип / Название */}
      <h1 className={cn('mb-2 text-4xl font-extrabold', 'text-[var(--tg-theme-button-color)]')}>
        {tMenu('title')}
      </h1>

      {/* Приветствие */}
      <p className="mb-1 text-lg">
        {tMenu('greeting', { name: user?.first_name || tCommon('player') })} 👋
      </p>
      <p className="mb-8 text-sm text-[var(--tg-theme-hint-color)]">
        {tMenu('yourId')}: {user?.id}
      </p>

      {/* Статистика */}
      <div
        className={cn(
          'mb-8 w-full max-w-xs rounded-xl',
          'bg-[var(--tg-theme-secondary-bg-color)]',
          'p-4 text-center'
        )}
      >
        <p className={cn('text-sm tracking-wider uppercase', 'text-[var(--tg-theme-hint-color)]')}>
          {tMenu('currentScore')}
        </p>
        <p className="text-3xl font-bold">{score}</p>
      </div>

      {/* Кнопка действия */}
      <button
        onClick={handleStartGame}
        className={cn(
          'w-full max-w-xs rounded-xl',
          'bg-[var(--tg-theme-button-color)]',
          'px-6 py-4 text-lg font-bold',
          'text-[var(--tg-theme-button-text-color)]',
          'shadow-lg transition-all active:opacity-80'
        )}
      >
        {tCommon('buttons.play')} 🎮
      </button>
    </div>
  );
}
