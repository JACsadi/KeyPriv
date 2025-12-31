import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import EmailEntryCardClient from '@/features/onboarding/components/EmailEntryCardClient';

export default async function EmailEntryWrapper({
  params,
}: {
  params: { locale: string };
}) {
  // Load messages for the current locale
  const messages = await getMessages({ locale: params.locale });

  // Placeholder functions for the component props


  return (
    <NextIntlClientProvider messages={messages} locale={params.locale}>
      <EmailEntryCardClient />
    </NextIntlClientProvider>
  );
}