'use client';

import { useEffect, useState, ReactNode } from 'react';

import { initTelegramMock, ITelegramContext, TelegramContext } from '@/shared';

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ITelegramContext>({
    webApp: null,
    isReady: false,
    user: null,
    theme: null,
  });

  // Стейт для визуального мока MainButton
  const [mockMainButton, setMockMainButton] = useState<{
    visible: boolean;
    text: string;
    onClick: (() => void) | null;
  }>({
    visible: false,
    text: 'Continue',
    onClick: null,
  });

  useEffect(() => {
    const initTelegram = () => {
      // Если SDK уже загружен (например, через next/script или кэш)
      if (window.Telegram?.WebApp) {
        const tg = window.Telegram.WebApp;
        console.log('🟢 [TG] SDK found, initializing...');
        tg.ready();
        tg.expand();
        tg.enableClosingConfirmation();

        setState({
          webApp: tg,
          isReady: true,
          user: tg.initDataUnsafe?.user || null,
          theme: tg.themeParams || null,
        });

        if (tg.themeParams) {
          const root = document.documentElement;
          Object.entries(tg.themeParams).forEach(([key, value]) => {
            root.style.setProperty(`--tg-theme-${key}`, value as string);
          });
        }
      }
    };

    const loadScript = () => {
      console.log('📦 [TG] SDK not found, loading script...');
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-web-app.js';
      script.async = true;

      script.onload = () => {
        console.log('✅ [TG] Script loaded successfully');
        initTelegram();
      };

      script.onerror = () => {
        console.error('❌ [TG] Failed to load SDK script!');
        // Если загрузка не удалась, помечаем как готовое (но без webApp),
        // чтобы приложение не висело вечно
        setState((prev) => ({ ...prev, isReady: true }));
      };

      document.head.appendChild(script);
    };

    // Логика запуска
    if (typeof window !== 'undefined') {
      console.log('[DIAG] window.Telegram:', window.Telegram);
      console.log('[DIAG] Environment:', process.env.NODE_ENV);
      console.log('[DIAG] Enable Mock:', process.env.NEXT_PUBLIC_ENABLE_MOCK);

      // 1. Если включен принудительный мок (для отладки на Vercel)
      if (process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true' && !window.Telegram) {
        console.log('🤖 [DEV] Forcing Mock Mode...');
        initTelegramMock();
        // Мока достаточно, initTelegram вызовем после, так как мок может сразу установить window.Telegram
        setTimeout(initTelegram, 10);
        return;
      }

      // 2. Если реальный SDK уже есть
      if (window.Telegram?.WebApp) {
        initTelegram();
        return;
      }

      // 3. Если SDK нет и мы не в режиме мока — грузим скрипт
      loadScript();
    }
  }, []);

  return (
    <TelegramContext.Provider value={state}>
      {children}

      {/* Визуальный мок MainButton (показываем, если он включен, даже в production) */}
      {(process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true') &&
        mockMainButton.visible && (
          <button
            onClick={() => {
              if (mockMainButton.onClick) mockMainButton.onClick();
              setMockMainButton((prev) => ({ ...prev, visible: false }));
            }}
            className="bg-[var(--tg-theme-button-color, #2481cc)] text-[var(--tg-theme-button-text-color, #ffffff)] fixed right-0 bottom-0 left-0 z-50 w-full py-4 text-lg font-bold shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] transition-opacity active:opacity-80"
          >
            {mockMainButton.text || 'Continue'}
          </button>
        )}
    </TelegramContext.Provider>
  );
}
