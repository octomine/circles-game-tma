"use client";

import { useRouter } from "next/navigation";
import { useGameSessionStore } from "@/entities/game-session";
import { useTelegram } from "@/shared";


export function MainMenuWidget() {
  const rouyter = useRouter();

  const { isReady, user, webApp } = useTelegram();
  const score = useGameSessionStore((state) => state.score);

  const handleStartGame = () => {
    webApp?.HapticFeedback.impactOccurred('medium');
    rouyter.push('/game');
  }

  // Показываем лоадер, пока Telegram SDK не инициализирован
  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--tg-theme-bg-color)]">
        <span className="text-[var(--tg-theme-hint-color)]">Загрузка...</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] p-6">
      {/* Логотип / Название */}
      <h1 className="text-4xl font-extrabold mb-2 text-[var(--tg-theme-button-color)]">
        Color Clash
      </h1>

      {/* Приветствие */}
      <p className="text-lg mb-1">
        Привет, <span className="font-semibold">{user?.first_name || 'Игрок'}</span>! 👋
      </p>
      <p className="text-sm text-[var(--tg-theme-hint-color)] mb-8">
        Твой ID: {user?.id}
      </p>

      {/* Статистика */}
      <div className="bg-[var(--tg-theme-secondary-bg-color)] rounded-xl p-4 w-full max-w-xs mb-8 text-center">
        <p className="text-sm text-[var(--tg-theme-hint-color)] uppercase tracking-wider">Текущий счёт</p>
        <p className="text-3xl font-bold">{score}</p>
      </div>

      {/* Кнопка действия */}
      <button
        onClick={handleStartGame}
        className="w-full max-w-xs py-4 px-6 rounded-xl font-bold text-lg text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] active:opacity-80 transition-all shadow-lg"
      >
        Играть 🎮
      </button>
    </div>
  );
}
