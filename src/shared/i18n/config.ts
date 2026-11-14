export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];

// Язык, под который собран статический экспорт: пререндер и SSR всегда идут на нём,
// а реальный язык игрока приходит уже на клиенте из GamePush.
export const defaultLocale: Locale = 'ru';

// Фолбэк обязательного чек-листа GamePush: если SDK отдал код, которого нет в `locales`,
// показываем английский, а не язык проекта.
export const fallbackLocale: Locale = 'en';

// Часовой пояс нужен и серверу, и клиенту: без него next-intl кидает ENVIRONMENT_FALLBACK
// при форматировании дат и чисел, потому что не может выбрать зону по умолчанию.
export const timeZone = 'Europe/Moscow';

/** Проверка, что произвольная строка — поддерживаемая локаль. */
export const isLocale = (value: string | null | undefined): value is Locale =>
  value != null && (locales as readonly string[]).includes(value);

/**
 * Приводит язык из SDK к поддерживаемой локали.
 *
 * GamePush отдаёт ISO 639-1, но не гарантирует, что код есть в нашем списке:
 * поэтому берём первичный сабтег ('de-AT' → 'de'), нормализуем регистр, а всё
 * неподдерживаемое (и пустое) сводим к английскому — так требует чек-лист.
 */
export const resolveLocale = (language: string | null): Locale => {
  if (!language) return fallbackLocale;

  const primary = language.trim().toLowerCase().split('-')[0];

  return isLocale(primary) ? primary : fallbackLocale;
};

// Маппинг для Telegram language_code
export const telegramLocaleMap: Record<string, Locale> = {
  ru: 'ru',
  en: 'en',
  // Добавим другие языки по мере необходимости
};

export const getLocaleFromTelegram = (tgLangCode: string | undefined): Locale => {
  if (!tgLangCode) return defaultLocale;
  return telegramLocaleMap[tgLangCode] || defaultLocale;
};
