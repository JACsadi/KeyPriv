import OrgProfilePageWrapper from './OrgProfilePageWrapper';

export default async function OrgProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <OrgProfilePageWrapper params={resolvedParams} />
    </div>
  );
}