import { getRequestConfig } from 'next-intl/server';

import { defaultLocale, isLocale, timeZone } from './config';
import { loadMessages } from './messages';

export default getRequestConfig(async ({ locale: requestedLocale }) => {
  // Читаем готовую локаль (`locale`), а не `requestLocale`: последний внутри next-intl
  // зовёт headers(), а любое обращение к headers() делает страницу динамической —
  // статический экспорт (`output: 'export'`) на этом падает при пререндере /_not-found.
  const locale = isLocale(requestedLocale) ? requestedLocale : defaultLocale;

  return {
    locale,
    timeZone,
    messages: await loadMessages(locale),
  };
});
