// app/providers.tsx
'use client';

import {NextIntlClientProvider} from 'next-intl';
import {notFound} from 'next/navigation';
import {ReactNode} from 'react';

export function Providers({
  children,
  locale,
  messages
}: {
  children: ReactNode;
  locale: string;
  messages: any;
}) {
  if (!messages) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}