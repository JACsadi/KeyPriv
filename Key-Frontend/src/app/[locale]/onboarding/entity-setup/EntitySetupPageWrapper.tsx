import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import EntitySetupClient from './EntitySetupClient';

export default async function EntitySetupPageWrapper({
  params,
}: {
  params: { locale: string };
}) {
  // Load messages for the current locale
  const messages = await getMessages({ locale: params.locale });

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <EntitySetupClient />
    </NextIntlClientProvider>
  );
}
