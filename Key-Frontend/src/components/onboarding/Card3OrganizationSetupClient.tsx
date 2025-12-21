'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useSubdomainValidation } from '../../lib/hooks/useSubdomainValidation';
import { createTenantWithRetry } from '../../lib/api/tenant';
import type { CreateTenantPayload } from '../../lib/api/tenant';

// Define the countries data here instead of importing from a separate file
const COUNTRIES = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "CN", name: "China" },
  { code: "MX", name: "Mexico" },
  { code: "KR", name: "South Korea" },
  { code: "NL", name: "Netherlands" },
  { code: "SG", name: "Singapore" },
  { code: "CH", name: "Switzerland" },
];

const Card3OrganizationSetupClient: React.FC = () => {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from query parameters
  const email = searchParams.get('email');
  if (!email) {
    router.push(`/${locale}`);
    return;
  }

  const [orgName, setOrgName] = useState('');
  const [country, setCountry] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validationState = useSubdomainValidation(orgName);

  const isFormValid = orgName.trim() !== '' &&
                    country !== '' &&
                    !validationState.isReserved &&
                    validationState.availability === 'available';

  const handleNext = async () => {
    if (!isFormValid) return;

    setIsLoading(true);

    try {
      const payload: CreateTenantPayload = {
        organization_name: orgName,
        country,
        requested_subdomain: validationState.normalizedSubdomain,
        admin_email: email
      };

      const result = await createTenantWithRetry(payload);

      if ('circuit_breaker' in result) {
        // Handle circuit breaker error
        console.error('Failed to create tenant:', result);
        alert(t('org-setup.success-message')); // Using translation for error message
        return;
      }

      // Navigate to completion page on success with query parameters
      const params = new URLSearchParams({
        email: encodeURIComponent(email),
        orgName: encodeURIComponent(orgName),
        country: country,
        subdomain: encodeURIComponent(validationState.normalizedSubdomain),
      });
      // Redirect to Admin Account creation step instead of complete
      router.push(`/${locale}/onboarding/admin?${params.toString()}`);
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert(t('org-setup.success-message')); // Using translation for error message
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the status message for the subdomain
  let subdomainStatusMessage = '';
  let subdomainStatusClass = '';

  if (validationState.availability === 'checking') {
    subdomainStatusMessage = t('org-setup.processing');
    subdomainStatusClass = 'text-gray-500';
  } else if (validationState.availability === 'available') {
    subdomainStatusMessage = t('org-setup.success-message').replace('Organization created successfully!', 'Available');
    // Using a more appropriate translation if needed
    subdomainStatusMessage = 'Available';
    subdomainStatusClass = 'text-green-600';
  } else if (validationState.availability === 'unavailable') {
    subdomainStatusMessage = 'Already in use';
    subdomainStatusClass = 'text-red-600';
  } else if (validationState.isReserved) {
    subdomainStatusMessage = 'Reserved subdomain';
    subdomainStatusClass = 'text-red-600';
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transition-all duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-6 transform -rotate-3">
            <span className="text-white font-bold text-xl">DO</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('org-setup.title')}</h1>
          <p className="text-gray-600 text-sm">{t('org-setup.subtitle')}</p>
        </div>

        <div className="space-y-6">
          {/* Organization Name */}
          <div>
            <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('org-setup.org-name-label')}
            </label>
            <input
              id="orgName"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none bg-gray-50 focus:bg-white"
              placeholder={t('org-setup.org-name-placeholder')}
            />
          </div>

          {/* Country */}
          <div>
            <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('org-setup.country-label')}
            </label>
            <div className="relative">
              <select
                id="country"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 appearance-none bg-white transition-all outline-none cursor-pointer"
              >
                <option value="">{t('org-setup.country-placeholder')}</option>
                {COUNTRIES.map((countryOption) => (
                  <option key={countryOption.code} value={countryOption.code}>
                    {countryOption.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Subdomain */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('org-setup.subdomain-label')}
            </label>
            <div className="relative">
              <input
                type="text"
                value={validationState.fullSubdomain}
                readOnly
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-500 font-mono text-sm"
                placeholder={t('org-setup.subdomain-placeholder') + t('org-setup.subdomain-suffix')}
              />
              {subdomainStatusMessage && (
                <div className={`absolute -bottom-6 right-0 text-xs font-medium flex items-center gap-1 ${subdomainStatusClass}`}>
                  {validationState.availability === 'available' && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  )}
                  {subdomainStatusMessage}
                </div>
              )}
            </div>
          </div>

          {/* Next Button */}
          <button
            onClick={handleNext}
            disabled={!isFormValid || isLoading}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 mt-4
              ${isFormValid && !isLoading
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] shadow-blue-500/30 hover:shadow-blue-500/40'
                : 'bg-gray-300 cursor-not-allowed shadow-none opacity-70'
              }
            `}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('org-setup.processing')}
              </span>
            ) : t('org-setup.next-button')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Card3OrganizationSetupClient;