'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

const Complete: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') ? decodeURIComponent(searchParams.get('email')!) : null;
  const orgName = searchParams.get('orgName') ? decodeURIComponent(searchParams.get('orgName')!) : null;
  const country = searchParams.get('country') || null;
  const subdomain = searchParams.get('subdomain') ? decodeURIComponent(searchParams.get('subdomain')!) : null;

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-white font-bold">✓</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Setup Complete!</h1>
        <p className="text-gray-600 mt-2">Your organization has been created successfully.</p>
      </div>

      <div className="space-y-4">
        {email && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Email</p>
            <p className="font-medium">{email}</p>
          </div>
        )}
        {orgName && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Organization</p>
            <p className="font-medium">{orgName}</p>
          </div>
        )}
        {country && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Country</p>
            <p className="font-medium">{country}</p>
          </div>
        )}
        {subdomain && (
          <div className="p-3 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Subdomain</p>
            <p className="font-medium">{subdomain}.onkeypriv.com</p>
          </div>
        )}
      </div>

      <div className="space-y-3 mt-8">
        <button
          className="w-full py-3 px-4 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700"
          onClick={() => router.push('/onboarding/admin')}
        >
          Create Admin Account
        </button>
        <button
          className="w-full py-3 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300"
          onClick={() => router.push('/onboarding/org-profile')}
        >
          Continue to Profile Setup
        </button>
      </div>
    </div>
  );
};

export default Complete;