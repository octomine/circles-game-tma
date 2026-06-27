'use client';

import { useRouter } from 'next/navigation';
import { useGameSessionStore } from '@/entities/game-session';
import { useTelegram } from '@/shared';

export function MainMenuWidget() {
  const rouyter = useRouter();

  const { isReady, user, webApp } = useTelegram();
  const score = useGameSessionStore((state) => state.score);

  const handleStartGame = () => {
    webApp?.HapticFeedback.impactOccurred('medium');
    rouyter.push('/game');
  };

  // Показываем лоадер, пока Telegram SDK не инициализирован
  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--tg-theme-bg-color)]">
        <span className="text-[var(--tg-theme-hint-color)]">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-[var(--tg-theme-bg-color)] p-6 text-[var(--tg-theme-text-color)]">
      {/* Логотип / Название */}
      <h1 className="mb-2 text-4xl font-extrabold text-[var(--tg-theme-button-color)]">
        Color Clash
      </h1>

      {/* Приветствие */}
      <p className="mb-1 text-lg">
        Привет, <span className="font-semibold">{user?.first_name || 'Игрок'}</span>! 👋
      </p>
      <p className="mb-8 text-sm text-[var(--tg-theme-hint-color)]">Твой ID: {user?.id}</p>

      {/* Статистика */}
      <div className="mb-8 w-full max-w-xs rounded-xl bg-[var(--tg-theme-secondary-bg-color)] p-4 text-center">
        <p className="text-sm tracking-wider text-[var(--tg-theme-hint-color)] uppercase">
          Текущий счёт
        </p>
        <p className="text-3xl font-bold">{score}</p>
      </div>

      {/* Кнопка действия */}
      <button
        onClick={handleStartGame}
        className="w-full max-w-xs rounded-xl bg-[var(--tg-theme-button-color)] px-6 py-4 text-lg font-bold text-[var(--tg-theme-button-text-color)] shadow-lg transition-all active:opacity-80"
      >
        Играть 🎮
      </button>
    </div>
  );
}
