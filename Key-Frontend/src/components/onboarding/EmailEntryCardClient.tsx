'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const PUBLIC_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com"
];

type EmailEntryCardProps = {
  logo?: React.ReactNode;
  onNext?: (email: string) => void;          // goes to OTP (Card 2)
  onSsoRedirect?: (email: string) => void;   // initiate SSO redirect
};

const EmailEntryCardClient: React.FC<EmailEntryCardProps> = ({ 
  logo, 
  onNext = (email) => console.log('Mock Next:', email), 
  onSsoRedirect = (email) => console.log('Mock SSO:', email) 
}) => {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [publicDomainWarning, setPublicDomainWarning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const isPublicDomain = (email: string): boolean => {
    const domain = email.split('@')[1]?.toLowerCase();
    return !!domain && PUBLIC_DOMAINS.includes(domain);
  };

  const validateEmail = (email: string): boolean => {
    return EMAIL_REGEX.test(email);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setEmail(value);

    // Reset errors when user types
    if (emailError) setEmailError(null);
    if (apiError) setApiError(null);

    // Update public domain warning
    setPublicDomainWarning(validateEmail(value) && isPublicDomain(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateEmail(email)) {
      setEmailError(t('email-entry.email-error'));
      return;
    }

    setIsSubmitting(true);

    try {
      // For demo purposes - in real implementation, this would call your API
      // Simulating response for now
      const data = {
        valid: true,
        sso_detected: false, // Assuming no SSO for this example
        normalizedEmail: email
      };

      if (data.valid) {
        if (data.sso_detected) {
          // onSsoRedirect(data.normalizedEmail);
          console.log('SSO Redirect not implemented');
        } else {
          // Encode email to ensure it's safe for URL
          const encodedEmail = encodeURIComponent(data.normalizedEmail);
          router.push(`/${locale}/onboarding/otp?email=${encodedEmail}`);
        }
      } else {
        setEmailError(t('email-entry.email-error'));
      }
    } catch (error) {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/20">
        <div className="flex justify-center mb-8">
          {logo || (
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3 hover:rotate-6 transition-transform duration-300">
              <span className="text-white font-bold text-xl">DO</span>
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">{t('email-entry.title')}</h1>
          <p className="text-gray-600 text-sm">{t('email-entry.subtitle')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
              {t('email-entry.email-label')}
            </label>
            <div className="relative group">
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleInputChange}
                className={`block w-full px-4 py-3 rounded-xl border-2 transition-all duration-200 outline-none
                  ${emailError 
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                    : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                  }
                `}
                placeholder={t('email-entry.email-placeholder')}
                aria-invalid={!!emailError}
              />
            </div>
          </div>

          {(emailError || apiError) && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm flex items-center gap-2 animate-shake"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{emailError || apiError}</span>
            </div>
          )}

          {publicDomainWarning && !emailError && (
            <div
              role="alert"
              className="p-3 rounded-lg bg-amber-50 border border-amber-100 text-amber-700 text-sm flex items-center gap-2"
            >
              <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{t('email-entry.public-domain-warning')}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !validateEmail(email)}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200
              ${(!validateEmail(email) || isSubmitting) 
                ? 'bg-gray-400 cursor-not-allowed opacity-70 transform-none shadow-none' 
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]'
              }
            `}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('email-entry.processing')}
              </span>
            ) : t('email-entry.next-button')}
          </button>
        </form>

        <p className="text-xs text-gray-500 text-center mt-8 px-4">
          {t('email-entry.terms-text')}
        </p>
      </div>
    </div>
  );
};

export default EmailEntryCardClient;