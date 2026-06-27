import createMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from '@/shared/i18n/config';

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'never', // Важно для TMA: не добавляем /ru/ в URL
});

export const config = {
  matcher: ['/', '/(ru|en)/:path*', '/((?!_next|_vercel|.*\\..*).*)'],
};
