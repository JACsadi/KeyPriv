import OrgSetupPageWrapper from './OrgSetupPageWrapper';

export default async function OrgSetupPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <OrgSetupPageWrapper params={resolvedParams} />
    </div>
  );
}