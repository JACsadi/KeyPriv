import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // Allow cross-origin requests from your development IP
  allowedDevOrigins: [
    'http://10.32.20.101:3000', // your LAN access URL
    'http://localhost:3000',    // local default (optional)
  ],
};

export default withNextIntl(nextConfig);
