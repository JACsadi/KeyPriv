import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import Card4AdminAccountClient from '../../../../components/onboarding/Card4AdminAccountClient';

export default async function AdminAccountPageWrapper({
  params,
}: {
  params: { locale: string };
}) {
  // Load messages for the current locale
  const messages = await getMessages({ locale: params.locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <Card4AdminAccountClient />
    </NextIntlClientProvider>
  );
}