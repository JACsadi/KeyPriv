import EntitySetupPageWrapper from './EntitySetupPageWrapper';

export default async function EntitySetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <EntitySetupPageWrapper params={resolvedParams} />
    </div>
  );
}