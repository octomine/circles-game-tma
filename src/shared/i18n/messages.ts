import { type AbstractIntlMessages } from 'next-intl';

import { type Locale } from './config';

/** Сообщения одной локали в том виде, в котором их ждёт next-intl. */
export type LocaleMessages = Record<string, AbstractIntlMessages>;

/**
 * Лоадеры сообщений по локалям.
 *
 * Импорты перечислены явно, а не собраны шаблоном `./locales/${locale}/…`:
 * бандлеру нужны статические пути, иначе в статический экспорт не попадут чанки
 * не-дефолтных локалей и английский перевод «не найдётся» уже в рантайме.
 */
const MESSAGE_LOADERS: Record<Locale, () => Promise<LocaleMessages>> = {
  ru: async () => ({
    common: (await import('./locales/ru/common.json')).default,
    menu: (await import('./locales/ru/menu.json')).default,
    game: (await import('./locales/ru/game.json')).default,
    leaderboard: (await import('./locales/ru/leaderboard.json')).default,
    settings: (await import('./locales/ru/settings.json')).default,
  }),
  en: async () => ({
    common: (await import('./locales/en/common.json')).default,
    menu: (await import('./locales/en/menu.json')).default,
    game: (await import('./locales/en/game.json')).default,
    leaderboard: (await import('./locales/en/leaderboard.json')).default,
    settings: (await import('./locales/en/settings.json')).default,
  }),
};

/**
 * Загружает все неймспейсы локали.
 * Один и тот же путь используют и сервер (`request.ts`), и клиент (подмена языка после SDK).
 */
export const loadMessages = (locale: Locale): Promise<LocaleMessages> => MESSAGE_LOADERS[locale]();
