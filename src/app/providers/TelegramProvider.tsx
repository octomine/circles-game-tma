'use client';

import { useEffect, useState, ReactNode } from 'react';

import { initTelegramMock, ITelegramContext, TelegramContext } from '@/shared';

const USER_RETRY_ATTEMPTS = 10;
const USER_RETRY_INTERVAL_MS = 100;
const SDK_WAIT_ATTEMPTS = 20;
const SDK_WAIT_INTERVAL_MS = 50;

function applyTelegramTheme(themeParams: ITelegramContext['theme']) {
  if (!themeParams) return;

  const root = document.documentElement;
  Object.entries(themeParams).forEach(([key, value]) => {
    if (typeof value === 'string') {
      root.style.setProperty(`--tg-theme-${key}`, value);
    }
  });
}

function readTelegramState(): ITelegramContext | null {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  return {
    webApp: tg,
    isReady: true,
    user: tg.initDataUnsafe?.user || null,
    theme: tg.themeParams || null,
  };
}

function bootstrapTelegramWebApp() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return null;

  tg.ready?.();
  tg.expand?.();

  if (typeof tg.isVersionAtLeast !== 'function' || tg.isVersionAtLeast('6.2')) {
    try {
      tg.enableClosingConfirmation?.();
    } catch (error) {
      console.warn('[TG] enableClosingConfirmation failed:', error);
    }
  }

  applyTelegramTheme(tg.themeParams || null);
  return readTelegramState();
}

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
    let cancelled = false;
    let userRetryId: number | undefined;
    let sdkWaitId: number | undefined;

    const syncState = (nextState: ITelegramContext) => {
      if (!cancelled) {
        setState(nextState);
      }
    };

    const retryUserIfMissing = () => {
      if (window.Telegram?.WebApp?.initDataUnsafe?.user) return;

      let attempts = 0;
      userRetryId = window.setInterval(() => {
        if (cancelled) {
          window.clearInterval(userRetryId);
          return;
        }

        attempts += 1;
        const nextState = readTelegramState();
        const user = nextState?.user;

        if (user) {
          window.clearInterval(userRetryId);
          applyTelegramTheme(nextState.theme);
          syncState(nextState);
          return;
        }

        if (attempts >= USER_RETRY_ATTEMPTS) {
          window.clearInterval(userRetryId);
        }
      }, USER_RETRY_INTERVAL_MS);
    };

    const initTelegram = () => {
      const nextState = bootstrapTelegramWebApp();
      if (!nextState) return false;

      console.log('🟢 [TG] SDK found, initializing...');
      syncState(nextState);
      retryUserIfMissing();
      return true;
    };

    const maybeInitMock = () => {
      const hasRealInitData = Boolean(window.Telegram?.WebApp?.initData);
      if (process.env.NEXT_PUBLIC_ENABLE_MOCK === 'true' && !hasRealInitData) {
        console.log('🤖 [DEV] Forcing Mock Mode...');
        initTelegramMock();
      }
    };

    console.log('[DIAG] window.Telegram:', window.Telegram);
    console.log('[DIAG] Environment:', process.env.NODE_ENV);
    console.log('[DIAG] Enable Mock:', process.env.NEXT_PUBLIC_ENABLE_MOCK);

    maybeInitMock();

    if (initTelegram()) {
      return () => {
        cancelled = true;
        if (userRetryId) window.clearInterval(userRetryId);
      };
    }

    let waitAttempts = 0;
    sdkWaitId = window.setInterval(() => {
      if (cancelled) {
        window.clearInterval(sdkWaitId);
        return;
      }

      waitAttempts += 1;
      maybeInitMock();

      if (initTelegram()) {
        window.clearInterval(sdkWaitId);
        return;
      }

      if (waitAttempts >= SDK_WAIT_ATTEMPTS) {
        window.clearInterval(sdkWaitId);
        console.warn('[TG] SDK did not appear, continuing without WebApp');
        syncState({
          webApp: null,
          isReady: true,
          user: null,
          theme: null,
        });
      }
    }, SDK_WAIT_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (userRetryId) window.clearInterval(userRetryId);
      if (sdkWaitId) window.clearInterval(sdkWaitId);
    };
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
