import CompletePageWrapper from './CompletePageWrapper';

export default async function CompletePage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <CompletePageWrapper params={resolvedParams} />
    </div>
  );
}