'use client';

import { NextIntlClientProvider } from 'next-intl';
import { type PropsWithChildren } from 'react';

import { timeZone, type Locale, type LocaleMessages } from '@/shared/i18n';

interface IntlProviderProps {
  locale: Locale;
  messages: LocaleMessages;
}

export const IntlProvider = ({
  locale,
  messages,
  children,
}: PropsWithChildren<IntlProviderProps>) => (
  // timeZone обязателен: без него next-intl падает с ENVIRONMENT_FALLBACK на клиенте.
  <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
    {children}
  </NextIntlClientProvider>
);
