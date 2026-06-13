"use client";

import { useTelegram } from "@/app/providers/TelegramProvider";

export function TelegramDebugWidget() {
  const { isReady, user, theme, webApp } = useTelegram();

  // 1. Проверяем стадию инициализации
  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--tg-theme-bg-color)]">
        <p className="text-[var(--tg-theme-hint-color)] animate-pulse">
          Инициализация Telegram SDK...
        </p>
      </div>
    );
  }

  // 2. Функция для теста Haptic Feedback
  const testHaptic = () => {
    if (webApp) {
      webApp.HapticFeedback.impactOccurred('medium');
      console.log('✅ Haptic triggered');
    }
  };

  // 3. Функция для теста MainButton (нативная кнопка Telegram)
  const testMainButton = () => {
    if (webApp?.MainButton) {
      webApp.MainButton.setText("Тестовая кнопка");
      webApp.MainButton.show();
      webApp.MainButton.onClick(() => {
        console.log('✅ MainButton clicked!');
        webApp.HapticFeedback.notificationOccurred('success');
        webApp.MainButton.hide();
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--tg-theme-bg-color)] text-[var(--tg-theme-text-color)] p-6 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-6 text-[var(--tg-theme-button-color)]">
        🛠 Telegram Provider Check
      </h1>

      {/* Блок статуса */}
      <div className="mb-6 p-4 rounded-lg bg-[var(--tg-theme-secondary-bg-color)] border border-[var(--tg-theme-hint-color)]/20">
        <p className="font-bold text-green-500 mb-2">✅ Статус: SDK Ready</p>
        <p>Platform: {webApp?.platform || 'Unknown'}</p>
        <p>Version: {webApp?.version || 'Unknown'}</p>
      </div>

      {/* Блок данных пользователя */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 border-b border-[var(--tg-theme-hint-color)]/30 pb-1">
          👤 User Data (initDataUnsafe)
        </h2>
        <pre className="bg-[var(--tg-theme-secondary-bg-color)] p-3 rounded-lg overflow-x-auto text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      {/* Блок темы */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2 border-b border-[var(--tg-theme-hint-color)]/30 pb-1">
          🎨 Theme Params
        </h2>
        <pre className="bg-[var(--tg-theme-secondary-bg-color)] p-3 rounded-lg overflow-x-auto text-xs">
          {JSON.stringify(theme, null, 2)}
        </pre>
      </div>

      {/* Кнопки для тестов */}
      <div className="flex flex-col gap-3">
        <button
          onClick={testHaptic}
          className="w-full py-3 px-4 rounded-lg font-bold bg-[var(--tg-theme-button-color)] text-[var(--tg-theme-button-text-color)] active:opacity-70 transition-opacity"
        >
          📳 Тест Haptic Feedback (Medium)
        </button>

        <button
          onClick={testMainButton}
          className="w-full py-3 px-4 rounded-lg font-bold bg-[var(--tg-theme-secondary-bg-color)] text-[var(--tg-theme-text-color)] border border-[var(--tg-theme-hint-color)] active:opacity-70 transition-opacity"
        >
          🔘 Показать нативную MainButton
        </button>
      </div>
    </div>
  );
}
