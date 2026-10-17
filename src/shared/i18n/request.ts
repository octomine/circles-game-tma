import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, timeZone } from './config';

export default getRequestConfig(async () => {
  return {
    locale: defaultLocale,
    timeZone,
    messages: {
      common: (await import(`./locales/${defaultLocale}/common.json`)).default,
      menu: (await import(`./locales/${defaultLocale}/menu.json`)).default,
      game: (await import(`./locales/${defaultLocale}/game.json`)).default,
      leaderboard: (await import(`./locales/${defaultLocale}/leaderboard.json`)).default,
    },
  };
});
