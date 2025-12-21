// i18n configuration
import {getRequestConfig} from 'next-intl/server';
import {notFound} from 'next/navigation';
import { defaultLocale } from './config';

export default getRequestConfig(async ({locale}) => {
  const safeLocale = locale ?? defaultLocale;

  // Validate that the locale is supported
  if (!['en-US', 'bn-BD', 'ar-SA'].includes(safeLocale as string)) {
    notFound();
  }

  try {
    const messages = { ...(await import(`./messages/${safeLocale}/index.ts`)) };
    return {messages, locale: safeLocale};
  } catch (error) {
    console.error(`Failed to load messages for locale: ${safeLocale}`, error);
    notFound();
  }
});