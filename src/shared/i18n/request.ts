import { getRequestConfig } from 'next-intl/server';

import { defaultLocale } from './config';

export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    timeZone: 'Europe/Moscow',
    messages: {
      common: (await import(`./locales/${defaultLocale}/common.json`)).default,
      menu: (await import(`./locales/${defaultLocale}/menu.json`)).default,
      game: (await import(`./locales/${defaultLocale}/game.json`)).default,
    },
  };
});
