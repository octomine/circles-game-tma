'use client';

import { type AbstractIntlMessages } from 'next-intl';
import { type PropsWithChildren } from 'react';

import { IntlProvider } from '@/app/providers';
import { GameNavigationProvider, type GameScreen } from '@/shared/navigation';

interface AppProvidersProps {
  locale: string;
  messages: Record<string, AbstractIntlMessages>;
  initialScreen?: GameScreen;
}

export const AppProviders = ({
  locale,
  messages,
  initialScreen,
  children,
}: PropsWithChildren<AppProvidersProps>) => (
  <IntlProvider locale={locale} messages={messages}>
    <GameNavigationProvider initialScreen={initialScreen}>{children}</GameNavigationProvider>
  </IntlProvider>
);
