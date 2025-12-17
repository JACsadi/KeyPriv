import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import Card2OTPClient from '../../../../components/onboarding/Card2OTPClient';

export default async function OTPPageWrapper({
  params,
}: {
  params: { locale: string };
}) {
  // Load messages for the current locale
  const messages = await getMessages({ locale: params.locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <Card2OTPClient />
    </NextIntlClientProvider>
  );
}