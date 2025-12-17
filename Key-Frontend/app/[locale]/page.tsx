import EmailEntryWrapper from './EmailEntryWrapper';

export default async function LocaleHome({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <EmailEntryWrapper params={resolvedParams} />
    </div>
  );
}