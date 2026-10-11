import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/request.ts');

const nextConfig: NextConfig = {
  output: 'export',
  allowedDevOrigins: ['192.168.3.14'],
};

export default withNextIntl(nextConfig);
