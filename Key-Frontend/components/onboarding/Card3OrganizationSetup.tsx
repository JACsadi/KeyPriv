'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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

const Card3OrganizationSetup: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get email from query parameters
  const email = searchParams.get('email');
  if (!email) {
    router.push('/');
    return null;
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
        alert('Failed to create tenant. Please try again later.');
        return;
      }

      // Navigate to completion page on success with query parameters
      const params = new URLSearchParams({
        email: encodeURIComponent(email),
        orgName: encodeURIComponent(orgName),
        country: country,
        subdomain: encodeURIComponent(validationState.normalizedSubdomain),
      });
      router.push(`/onboarding/complete?${params.toString()}`);
    } catch (error) {
      console.error('Error creating tenant:', error);
      alert('An error occurred while creating your organization. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine the status message for the subdomain
  let subdomainStatusMessage = '';
  let subdomainStatusClass = '';

  if (validationState.availability === 'checking') {
    subdomainStatusMessage = 'Checking...';
    subdomainStatusClass = 'text-gray-500';
  } else if (validationState.availability === 'available') {
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
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="text-center mb-8">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
          <span className="text-gray-600 font-bold">DO</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800">Set up your organization</h1>
        <p className="text-gray-600 mt-2">Tell us a few details to create your workspace.</p>
      </div>

      <div className="space-y-6">
        {/* Organization Name */}
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name
          </label>
          <input
            id="orgName"
            type="text"
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Acme Corporation"
          />
        </div>

        {/* Country */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country / Region
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white bg-[url('data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2Q4ZDhEO308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi1kb3duLXN2Zy1nZW5lcmF0b3I8L3RpdGxlPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI0Ljk1IDQuMjIgMC43MyA0LjIyIDIuNDggMC43MyAyLjQ4IDAgMi40OCAwIDQuOTUgMi40OCA0Ljk1IDQuMjIiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMCA1Ljc4IDQuMjIgNS43OCAyLjQ4IDkuMjcgMi40OCAxMCAyLjQ4IDEwIDAgNy41MiAwIDUuNzgiLz48L3N2Zz4=')] bg-no-repeat bg-[right_1rem_center] bg-[length:0.8rem] pr-10"
          >
            <option value="">Select a country</option>
            {COUNTRIES.map((countryOption) => (
              <option key={countryOption.code} value={countryOption.code}>
                {countryOption.name}
              </option>
            ))}
          </select>
        </div>

        {/* Subdomain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preferred Subdomain (auto-suggested)
          </label>
          <div className="relative">
            <input
              type="text"
              value={validationState.fullSubdomain}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
              placeholder="Your subdomain will appear here"
            />
            {subdomainStatusMessage && (
              <div className={`absolute -bottom-5 right-0 text-xs ${subdomainStatusClass}`}>
                {subdomainStatusMessage}
              </div>
            )}
          </div>
        </div>

        {/* Next Button */}
        <button
          onClick={handleNext}
          disabled={!isFormValid || isLoading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white ${
            isFormValid && !isLoading
              ? 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
              : 'bg-gray-400 cursor-not-allowed'
          } transition-colors duration-200`}
        >
          {isLoading ? 'Creating...' : 'Next →'}
        </button>
      </div>
    </div>
  );
};

export default Card3OrganizationSetup;