// i18n configuration
export const locales = ['en-US', 'bn-BD', 'ar-SA'] as const;
export const defaultLocale = 'en-US';

// Helper function to get safe locale
export const getSafeLocale = (locale: string | undefined): string => {
  if (!locale) return defaultLocale;
  if (locales.includes(locale as any)) return locale;
  return defaultLocale;
};