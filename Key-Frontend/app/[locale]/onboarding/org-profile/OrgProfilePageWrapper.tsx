import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import OrgProfileFormClient from '../../../../components/onboarding/OrgProfileFormClient';

export default async function OrgProfilePageWrapper({
  params,
}: {
  params: { locale: string };
}) {
  // Load messages for the current locale
  const messages = await getMessages({ locale: params.locale });

  return (
    <NextIntlClientProvider locale={params.locale} messages={messages}>
      <OrgProfileFormClient />
    </NextIntlClientProvider>
  );
}