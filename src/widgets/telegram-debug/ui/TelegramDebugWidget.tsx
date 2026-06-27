'use client';

import { useTelegram } from '@/app/providers/TelegramProvider';

export function TelegramDebugWidget() {
  const { isReady, user, theme, webApp } = useTelegram();

  // 1. Проверяем стадию инициализации
  if (!isReady) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[var(--tg-theme-bg-color)]">
        <p className="animate-pulse text-[var(--tg-theme-hint-color)]">
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
      webApp.MainButton.setText('Тестовая кнопка');
      webApp.MainButton.show();
      webApp.MainButton.onClick(() => {
        console.log('✅ MainButton clicked!');
        webApp.HapticFeedback.notificationOccurred('success');
        webApp.MainButton.hide();
      });
    }
  };

  return (
    <div className="min-h-screen w-full bg-[var(--tg-theme-bg-color)] p-6 font-mono text-sm text-[var(--tg-theme-text-color)]">
      <h1 className="mb-6 text-2xl font-bold text-[var(--tg-theme-button-color)]">
        🛠 Telegram Provider Check
      </h1>

      {/* Блок статуса */}
      <div className="mb-6 rounded-lg border border-[var(--tg-theme-hint-color)]/20 bg-[var(--tg-theme-secondary-bg-color)] p-4">
        <p className="mb-2 font-bold text-green-500">✅ Статус: SDK Ready</p>
        <p>Platform: {webApp?.platform || 'Unknown'}</p>
        <p>Version: {webApp?.version || 'Unknown'}</p>
      </div>

      {/* Блок данных пользователя */}
      <div className="mb-6">
        <h2 className="mb-2 border-b border-[var(--tg-theme-hint-color)]/30 pb-1 text-lg font-semibold">
          👤 User Data (initDataUnsafe)
        </h2>
        <pre className="overflow-x-auto rounded-lg bg-[var(--tg-theme-secondary-bg-color)] p-3 text-xs">
          {JSON.stringify(user, null, 2)}
        </pre>
      </div>

      {/* Блок темы */}
      <div className="mb-6">
        <h2 className="mb-2 border-b border-[var(--tg-theme-hint-color)]/30 pb-1 text-lg font-semibold">
          🎨 Theme Params
        </h2>
        <pre className="overflow-x-auto rounded-lg bg-[var(--tg-theme-secondary-bg-color)] p-3 text-xs">
          {JSON.stringify(theme, null, 2)}
        </pre>
      </div>

      {/* Кнопки для тестов */}
      <div className="flex flex-col gap-3">
        <button
          onClick={testHaptic}
          className="w-full rounded-lg bg-[var(--tg-theme-button-color)] px-4 py-3 font-bold text-[var(--tg-theme-button-text-color)] transition-opacity active:opacity-70"
        >
          📳 Тест Haptic Feedback (Medium)
        </button>

        <button
          onClick={testMainButton}
          className="w-full rounded-lg border border-[var(--tg-theme-hint-color)] bg-[var(--tg-theme-secondary-bg-color)] px-4 py-3 font-bold text-[var(--tg-theme-text-color)] transition-opacity active:opacity-70"
        >
          🔘 Показать нативную MainButton
        </button>
      </div>
    </div>
  );
}
