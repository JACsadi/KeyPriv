import AdminAccountPageWrapper from './AdminAccountPageWrapper';

export default async function AdminAccountPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <AdminAccountPageWrapper params={resolvedParams} />
    </div>
  );
}