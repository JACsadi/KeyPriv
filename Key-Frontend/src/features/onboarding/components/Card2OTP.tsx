'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import OtpInput from '@/features/auth/components/OtpInput';
import ResendTimer from './ResendTimer';
import { sendOtp, verifyOtp } from '@/features/auth/api/otp';

const Card2OTP: React.FC = () => {
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
      router.push('/');
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
      setApiError('Failed to send verification code. Please try again.');
      console.error('Error sending OTP:', err);
    }
  };

  const handleOtpComplete = async (value: string) => {
    setOtp(value);
  };

  const handleNextClick = async () => {
    if (otp.length !== 6) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsLoading(true);
    setError(null);
    setApiError(null);

    try {
      const response = await verifyOtp(email, otp);

      if (response.success) {
        // Navigate to organization setup page with email as query param
        router.push(`/onboarding/org-setup?email=${encodeURIComponent(email)}`);
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      await sendOtp(email);
      setApiError(null);
    } catch (err) {
      setApiError('Failed to resend verification code. Please try again.');
      console.error('Error resending OTP:', err);
    }
  };

  const canSubmit = otp.length === 6 && !isLoading;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-md mx-auto p-6 mt-10 border rounded-2xl shadow bg-white"
    >
      <div className="flex justify-center mb-6">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-bold">DO</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold mb-2">Verify Your Email</h1>
        <p className="text-gray-600 text-sm">
          We sent a 6-digit verification code to:
        </p>
        <p className="font-medium text-gray-800">{email}</p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Enter Verification Code
        </label>
        
        <OtpInput
          length={6}
          value={otp}
          onChange={setOtp}
          onComplete={handleOtpComplete}
          disabled={isLoading}
        />
        
        {error && (
          <div className="text-red-600 text-sm mt-2" role="alert">
            {error}
          </div>
        )}
        
        {apiError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 text-sm mt-2" role="alert">
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
        className={`bg-indigo-600 text-white px-4 py-3 rounded-xl w-full mt-6 ${
          canSubmit ? 'hover:bg-indigo-700' : 'opacity-60 cursor-not-allowed'
        }`}
      >
        {isLoading ? 'Processing…' : 'Next →'}
      </button>

      <p className="text-xs text-gray-500 text-center mt-6">
        This verification is powered by keypriv.com
      </p>
    </motion.div>
  );
};

export default Card2OTP;