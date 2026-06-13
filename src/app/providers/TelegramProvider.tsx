'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { ITelegramContext, TgWebApp } from "../types/TelegramContext.types";
import { ThemeParams } from "@twa-dev/types";
import { initTelegramMock } from "@/shared";

const TelegramContext = createContext<ITelegramContext>({
  webApp: null,
  isReady: false,
  user: null,
  theme: null,
})

export function TelegramProvider({ children }: { children: ReactNode }) {
  initTelegramMock();

  const [webApp, setWebApp] = useState<TgWebApp | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window !== undefined && window.Telegram?.WebApp) {
      const tg = window.Telegram?.WebApp;

      tg.ready();
      tg.expand();
      tg.enableClosingConfirmation();

      setWebApp(tg);
      setIsReady(true);

      applyThemeCSS(tg.themeParams);
    } else {
      setIsReady(true);
    }
  }, []);

  const applyThemeCSS = (themeParams: ThemeParams) => {
    if (!themeParams) return;
    const root = document.documentElement;
    Object.entries(themeParams).forEach(([key, value]) => {
      root.style.setProperty(`--tg-theme-${key}`, value);
    })
  }

  const user = webApp?.initDataUnsafe?.user || null;
  const theme = webApp?.themeParams || null;

  return (
    <TelegramContext.Provider value={{ webApp, isReady, user, theme }}>
      {children}
    </TelegramContext.Provider>
  )
}

export const useTelegram = () => {
  const context = useContext(TelegramContext);
  if (!context) {
    throw new Error('useTelegram must be used withinn TelegramProvider');
  }
  return context;
}
