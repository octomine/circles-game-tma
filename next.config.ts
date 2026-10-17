import type { NextConfig } from 'next';
import { PHASE_DEVELOPMENT_SERVER } from 'next/constants';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

const nextConfig = (phase: string): NextConfig => {
  const isDev = phase === PHASE_DEVELOPMENT_SERVER;

  const config: NextConfig = {
    output: 'export',
    allowedDevOrigins: ['192.168.3.14'],
    // В dev префикс должен быть пустым: next/font падает с NextFontError
    // («assetPrefix must start with a leading slash or be an absolute URL»)
    // на относительном './', из-за чего клиентский бандл не собирается,
    // гидратация не происходит и все onClick-обработчики перестают работать.
    assetPrefix: isDev ? undefined : './',
    trailingSlash: true,
    images: {
      unoptimized: true,
    },
  };

  return withNextIntl(config);
};

export default nextConfig;
