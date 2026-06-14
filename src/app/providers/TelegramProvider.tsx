"use client";

import { useEffect, useState, ReactNode } from 'react';
import { TelegramContext, ITelegramContext } from '@/shared/lib/telegram';
import { initTelegramMock } from '@/shared/lib/telegram-mock';

export function TelegramProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ITelegramContext>({
    webApp: null,
    isReady: false,
    user: null,
    theme: null,
  });

  // Стейт для визуального мока MainButton (только для dev)
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
    // 1. Инициализация мока
    if (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'development' &&
      !window.Telegram
    ) {
      console.log('🤖 [DEV] Initializing Telegram WebApp Mock...');
      initTelegramMock(); // Передаем сеттер, если хотим обновлять UI мока
    }

    // 2. Инициализация реального SDK (или мока, если он создался выше)
    if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
      const tg = window.Telegram.WebApp;

      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();

      setState({
        webApp: tg,
        isReady: true,
        user: tg.initDataUnsafe?.user || null,
        theme: tg.themeParams || null,
      });

      // Применяем тему к CSS
      if (tg.themeParams) {
        const root = document.documentElement;
        Object.entries(tg.themeParams).forEach(([key, value]) => {
          root.style.setProperty(`--tg-theme-${key}`, value as string);
        });
      }
    } else {
      setState(prev => ({ ...prev, isReady: true }));
    }
  }, []);

  return (
    <TelegramContext.Provider value={state}>
      {children}

      {/* Визуальный мок MainButton (только в dev) */}
      {process.env.NODE_ENV === 'development' && mockMainButton.visible && (
        <button
          onClick={() => {
            if (mockMainButton.onClick) mockMainButton.onClick();
            setMockMainButton(prev => ({ ...prev, visible: false }));
          }}
          className="fixed bottom-0 left-0 right-0 w-full py-4 font-bold text-lg text-[var(--tg-theme-button-text-color)] bg-[var(--tg-theme-button-color)] active:opacity-80 transition-opacity z-50 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]"
        >
          {mockMainButton.text || 'Continue'}
        </button>
      )}
    </TelegramContext.Provider>
  );
}