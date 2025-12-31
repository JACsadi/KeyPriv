'use client';

import React, { useState } from 'react';

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
  onNext: (email: string) => void;          // goes to OTP (Card 2)
  onSsoRedirect: (email: string) => void;   // initiate SSO redirect
};

const EmailEntryCard: React.FC<EmailEntryCardProps> = ({ logo, onNext, onSsoRedirect }) => {
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
      setEmailError('Please enter a valid email address');
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
          onSsoRedirect(data.normalizedEmail);
        } else {
          onNext(data.normalizedEmail);
        }
      } else {
        setEmailError('Please enter a valid email address');
      }
    } catch (error) {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto p-6 mt-10 border rounded-2xl shadow bg-white">
      <div className="flex justify-center mb-6">
        {logo || (
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-600 font-bold">DO</span>
          </div>
        )}
      </div>

      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold mb-2">Sign in or Create Account</h1>
        <p className="text-gray-600 text-sm mb-6">Enter your work email to continue</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleInputChange}
            className={`border rounded-lg px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              emailError ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="user@example.com"
            aria-invalid={!!emailError}
          />
        </div>

        {(emailError || apiError) && (
          <div
            role="alert"
            className="text-red-600 text-sm flex items-start gap-2 mt-2"
          >
            <span>[ ! ]</span>
            <span>{emailError || apiError}</span>
          </div>
        )}

        {publicDomainWarning && !emailError && (
          <div
            role="alert"
            className="text-red-600 text-sm flex items-start gap-2 mt-2"
          >
            <span>[ ! ]</span>
            <span>Please use your work email (gmail/yahoo disallowed)</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || !validateEmail(email)}
          className={`bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-xl w-full mt-5 ${
            (!validateEmail(email) || isSubmitting) ? 'opacity-60 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? 'Processing…' : 'Next →'}
        </button>
      </form>

      <p className="text-xs text-gray-500 text-center mt-4">
        By continuing, you agree to our Terms & Privacy Policy
      </p>
    </div>
  );
};

export default EmailEntryCard;