import createMiddleware from 'next-intl/middleware';

export default createMiddleware({
  locales: ['en-US', 'bn-BD', 'ar-SA'],
  defaultLocale: 'en-US'
});

export const config = {
  matcher: ['/', '/(en-US|bn-BD|ar-SA)/:path*']
};