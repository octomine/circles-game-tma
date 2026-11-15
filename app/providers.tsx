'use client';

import { useEffect, useState, type PropsWithChildren } from 'react';

import { IntlProvider } from '@/app/providers';
import { GamePushProvider, useGamePush } from '@/shared/gamepush';
import { loadMessages, resolveLocale, type Locale, type LocaleMessages } from '@/shared/i18n';
import { GameNavigationProvider, type GameScreen } from '@/shared/navigation';

interface AppProvidersProps {
  /** Локаль, под которую собран статический экспорт (её сообщения пришли с сервера). */
  locale: string;
  messages: LocaleMessages;
  initialScreen?: GameScreen;
}

interface IntlProviderWrapperProps {
  serverLocale: string;
  serverMessages: LocaleMessages;
}

const IntlProviderWrapper = ({
  serverLocale,
  serverMessages,
  children,
}: PropsWithChildren<IntlProviderWrapperProps>) => {
  const { language, isReady, isInitFailed } = useGamePush();

  const [pendingMessages, setPendingMessages] = useState<{
    locale: Locale;
    messages: LocaleMessages;
  } | null>(null);

  // Язык считаем известным и при провале инициализации: иначе недоступный CDN держал бы
  // игрока на заглушке вечно (провайдер ставит isInitFailed по таймауту или при сбое).
  const isLanguageResolved = isReady || isInitFailed;

  // Фолбэк на английский: resolveLocale сводит отсутствующий или неподдерживаемый код
  // языка (а также 'de', 'ja' и прочие коды вне locales) к 'en' — это требование чек-листа.
  const finalLocale = resolveLocale(language);

  // Сообщения сервера годятся только для локали, под которую собран экспорт: в статическом
  // экспорте getMessages() уже не пересчитать, поэтому остальные локали грузим чанком.
  const canReuseServerMessages = finalLocale === serverLocale;
  const loadedMessages = pendingMessages?.locale === finalLocale ? pendingMessages.messages : null;
  const messages = canReuseServerMessages ? serverMessages : loadedMessages;

  useEffect(() => {
    // layout.tsx статичен, поэтому атрибут html обновляем сами: язык из него читают
    // скринридеры и Telegram WebView.
    document.documentElement.lang = finalLocale;
  }, [finalLocale]);

  useEffect(() => {
    if (!isLanguageResolved || canReuseServerMessages || loadedMessages) return;

    let cancelled = false;

    loadMessages(finalLocale)
      .then((nextMessages) => {
        if (cancelled) return;

        setPendingMessages({ locale: finalLocale, messages: nextMessages });
      })
      .catch((error: unknown) => {
        if (cancelled) return;

        // Чанк не загрузился (офлайн, битый кэш): пустой экран хуже, чем перевод
        // с серверной локали, поэтому откатываемся к сообщениям из layout.
        console.warn('[i18n] Не удалось загрузить сообщения для локали', finalLocale, error);

        setPendingMessages({ locale: finalLocale, messages: serverMessages });
      });

    return () => {
      cancelled = true;
    };
  }, [finalLocale, isLanguageResolved, canReuseServerMessages, loadedMessages, serverMessages]);

  if (!isLanguageResolved || !messages) {
    // Заглушка вместо контента. Она же рендерится при статическом экспорте: isReady на
    // сервере всегда false, поэтому разметка сервера и клиента совпадает (нет hydration
    // mismatch), а язык не мигает — IntlProvider монтируется сразу с итоговой локалью.
    return <div className="bg-background h-dvh w-full" aria-busy="true" />;
  }

  return (
    <IntlProvider locale={finalLocale} messages={messages}>
      {children}
    </IntlProvider>
  );
};

export const AppProviders = ({
  locale,
  messages,
  initialScreen,
  children,
}: PropsWithChildren<AppProvidersProps>) => (
  // GamePush снаружи остальных провайдеров: это инфраструктура уровня приложения,
  // которая не зависит ни от локали, ни от навигации, но нужна любому экрану.
  <GamePushProvider>
    <IntlProviderWrapper serverLocale={locale} serverMessages={messages}>
      <GameNavigationProvider initialScreen={initialScreen}>{children}</GameNavigationProvider>
    </IntlProviderWrapper>
  </GamePushProvider>
);
