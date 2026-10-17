'use client';

import { AbstractIntlMessages, NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

import { timeZone } from '@/shared/i18n';

interface IntlProviderProps {
  locale: string;
  messages: Record<string, AbstractIntlMessages>;
  children: ReactNode;
}

export function IntlProvider({ locale, messages, children }: IntlProviderProps) {
  return (
    // timeZone обязателен: без него next-intl падает с ENVIRONMENT_FALLBACK на клиенте.
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
