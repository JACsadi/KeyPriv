'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import OtpInput from '../../components/otp/OtpInput';
import { useTranslations, useLocale } from 'next-intl';
import ResendTimer from '../../components/onboarding/ResendTimer';
import { sendOtp, verifyOtp } from '../../lib/api/otp';

const Card2OTPClient: React.FC = () => {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [email, setEmail] = useState<string>('');

  // Extract email from query parameters (Next.js doesn't have location.state)
  useEffect(() => {
    const emailParam = searchParams.get('email');
    const extractedEmail = emailParam ? decodeURIComponent(emailParam) : null;

    if (!extractedEmail) {
      // Redirect back to Card 1 if email is not provided in params
      router.push(`/${locale}`);
      return;
    }

    setEmail(extractedEmail);

    // Send OTP automatically when component mounts
    sendOtpCode(extractedEmail);
  }, [searchParams, router]);

  const sendOtpCode = async (email: string) => {
    try {
      await sendOtp(email);
      // Success - OTP sent
    } catch (err) {
      setApiError(t('otp.verification-failed'));
      console.error('Error sending OTP:', err);
    }
  };

  const handleOtpComplete = async (value: string) => {
    setOtp(value);
  };

  const handleNextClick = async () => {
    if (otp.length !== 6) {
      setError(t('otp.otp-error'));
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiError(null);

    try {
      const response = await verifyOtp(email, otp);

      if (response.success) {
        // Navigate to organization setup page with email as query param
        router.push(`/${locale}/onboarding/org-setup?email=${encodeURIComponent(email)}`);
      } else {
        setError(t('otp.verification-failed'));
      }
    } catch (err: any) {
      setError(err.message || t('otp.verification-failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await sendOtp(email);
      setApiError(null);
    } catch (err) {
      setApiError(t('otp.verification-failed'));
      console.error('Error resending OTP:', err);
    }
  };

  const canSubmit = otp.length === 6 && !isLoading;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="max-w-md w-full mx-auto p-8 rounded-2xl shadow-2xl bg-white/95 backdrop-blur-xl border border-white/20"
      >
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3">
            <span className="text-white font-bold text-xl">DO</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 text-gray-900">{t('otp.title')}</h1>
          <p className="text-gray-600 text-sm mb-2">{t('otp.subtitle')}</p>
          <div className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium border border-indigo-100">
            {email}
          </div>
        </div>

        <div className="mb-8">
          <label className="block text-sm font-semibold text-gray-700 mb-4 text-center">
            {t('otp.otp-label')}
          </label>

          <div className="flex justify-center">
            <OtpInput
              length={6}
              value={otp}
              onChange={setOtp}
              onComplete={handleOtpComplete}
              disabled={isLoading}
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm mt-4 text-center font-medium bg-red-50 p-2 rounded-lg border border-red-100 animate-shake" role="alert">
              {error}
            </div>
          )}

          {apiError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm mt-4 flex items-center justify-center gap-2" role="alert">
               <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {apiError}
            </div>
          )}
        </div>

        <ResendTimer
          onResend={handleResendCode}
          initialSeconds={20}
          disabled={isLoading}
        />

        <button
          onClick={handleNextClick}
          disabled={!canSubmit}
          className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-200 mt-8
            ${!canSubmit 
              ? 'bg-gray-400 cursor-not-allowed opacity-70 shadow-none' 
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]'
            }
          `}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {t('otp.processing')}
            </span>
          ) : t('otp.next-button')}
        </button>

        <p className="text-xs text-gray-500 text-center mt-8">
          {t('otp.powered-by')}
        </p>
      </motion.div>
    </div>
  );
};

export default Card2OTPClient;