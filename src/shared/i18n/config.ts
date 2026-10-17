export const locales = ['ru'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'ru';

// Часовой пояс нужен и серверу, и клиенту: без него next-intl кидает ENVIRONMENT_FALLBACK
// при форматировании дат и чисел, потому что не может выбрать зону по умолчанию.
export const timeZone = 'Europe/Moscow';

// Маппинг для Telegram language_code
export const telegramLocaleMap: Record<string, Locale> = {
  ru: 'ru',
  en: 'ru', // Fallback на русский, пока не добавим английский
  // Добавим другие языки по мере необходимости
};

export const getLocaleFromTelegram = (tgLangCode: string | undefined): Locale => {
  if (!tgLangCode) return defaultLocale;
  return telegramLocaleMap[tgLangCode] || defaultLocale;
};
