import OTPPageWrapper from './OTPPageWrapper';

export default async function OTPPage({ params }: { params: Promise<{ locale: string }> }) {
  const resolvedParams = await params;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <OTPPageWrapper params={resolvedParams} />
    </div>
  );
}