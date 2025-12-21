'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

const CompleteClient: React.FC = () => {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') ? decodeURIComponent(searchParams.get('email')!) : null;
  const orgName = searchParams.get('orgName') ? decodeURIComponent(searchParams.get('orgName')!) : null;
  const country = searchParams.get('country') || null;
  const subdomain = searchParams.get('subdomain') ? decodeURIComponent(searchParams.get('subdomain')!) : null;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/20 text-center">
        {/* Celebration Animation Placeholder */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div className="w-20 h-20 bg-gradient-to-tr from-green-400 to-emerald-600 rounded-full shadow-lg flex items-center justify-center animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div className="absolute top-0 right-0 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
          </div>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">
          {t('complete.title')}
        </h1>
        
        <p className="text-gray-600 mb-8 leading-relaxed">
          {t('complete.subtitle')}
        </p>

        <div className="space-y-4">
          <button
            className="w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98] transition-all duration-200"
            onClick={() => router.push(`/${locale}/onboarding/admin`)}
          >
            {t('admin-account.title')} (Debug: Go to Admin)
          </button>
          
          <button
            className="w-full py-4 px-6 rounded-xl font-bold text-gray-700 bg-gray-50 hover:bg-white border border-gray-200 hover:border-gray-300 shadow-sm hover:shadow-md transition-all duration-200"
            onClick={() => router.push(`/${locale}/onboarding/org-profile`)}
          >
            {t('complete.continue-button')} (Debug: Go to Profile)
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            Secure connection established
          </p>
        </div>
      </div>
    </div>
  );
};

export default CompleteClient;