import { getMessages } from 'next-intl/server';
import { NextIntlClientProvider } from 'next-intl';
import Card3OrganizationSetupClient from '../../../../components/onboarding/Card3OrganizationSetupClient';

export default async function OrgSetupPageWrapper({
  params,
}: {
  params: { locale: string };
}) {
  // Load messages for the current locale
  const messages = await getMessages({ locale: params.locale });

  return (
    <NextIntlClientProvider messages={messages}>
      <Card3OrganizationSetupClient />
    </NextIntlClientProvider>
  );
}