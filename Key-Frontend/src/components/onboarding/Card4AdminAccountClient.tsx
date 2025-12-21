'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

// Mock API function for admin creation
const mockCreateAdminAccount = async (fullName: string, password: string) => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Check password strength on "server-side" to potentially return 400
  let score = 0;
  if (password.length >= 8) {
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
  }

  if (score < 1 || password.length < 8) {
    throw new Error('400: Password too weak');
  }

  // Check for duplicate submission
  if (typeof window !== 'undefined' && localStorage.getItem('adminCreated')) {
    throw new Error('409: Admin account already exists');
  }

  // Simulate occasional random 500 error (~1 in 8 times)
  if (Math.random() < 0.125) {
    throw new Error('500: Internal Server Error');
  }

  // Set flag to prevent duplicate submissions
  if (typeof window !== 'undefined') {
    localStorage.setItem('adminCreated', 'true');
  }

  // Return mock success response
  return {
    status: 201,
    data: {
      id: 'admin-1',
      fullName,
      email: 'founder@acme.onkeypriv.com',
      tenant_id: '11111111-1111-1111-1111-111111111111',
      tenantSubdomain: 'acme'
    }
  };
};

const Card4AdminAccountClient = () => {
  const t = useTranslations('onboarding');
  const locale = useLocale();
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong'>('weak');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const router = useRouter();

  // Calculate password strength
  useEffect(() => {
    let strength = 'weak';

    if (password.length >= 8) {
      let score = 0;
      if (/[A-Z]/.test(password)) score++;
      if (/[0-9]/.test(password)) score++;
      if (/[^A-Za-z0-9]/.test(password)) score++;

      if (score >= 3) {
        strength = 'strong';
      } else if (score >= 1) {
        strength = 'medium';
      } else {
        strength = 'weak';
      }
    } else {
      strength = 'weak';
    }

    setPasswordStrength(strength as 'weak' | 'medium' | 'strong');
  }, [password]);

  // Check password match
  useEffect(() => {
    setPasswordMatch(password === confirmPassword);
  }, [password, confirmPassword]);

  // Clean full name on input
  const handleFullNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Remove numbers and special characters, allow only letters and spaces
    value = value.replace(/[^a-zA-Z\s]/g, '');

    // Normalize spaces (remove extra spaces)
    value = value.trim().replace(/\s+/g, ' ');

    setFullName(value);

    // Clear error when user starts typing
    if (errors.fullName) {
      setErrors(prev => ({...prev, fullName: ''}));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    // Validate full name
    if (!fullName.trim()) {
      newErrors.fullName = t('admin-account.first-name-error');
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = t('admin-account.first-name-error').replace('is required', 'must be at least 2 characters');
    }

    // Validate password
    if (!password) {
      newErrors.password = t('admin-account.password-error');
    } else if (passwordStrength === 'weak') {
      newErrors.password = t('admin-account.password-error');
    }

    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = t('admin-account.confirm-password-error');
    } else if (!passwordMatch) {
      newErrors.confirmPassword = t('admin-account.confirm-password-error');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const result = await mockCreateAdminAccount(fullName, password);

      // Reset the admin created flag for testing purposes (remove in production)
      if (typeof window !== 'undefined') {
        localStorage.removeItem('adminCreated');
      }

      // Redirect to organization profile setup
      router.push(`/${locale}/onboarding/org-profile`);
      router.refresh(); // Refresh to ensure state updates
    } catch (error: any) {
      setIsLoading(false);

      // Handle different error types
      if (error.message.includes('409')) {
        setApiError(t('admin-account.success-message').replace('Account created successfully!', 'Admin account already exists. Please continue to the next step.'));
      } else if (error.message.includes('400')) {
        setApiError(t('admin-account.password-error'));
      } else if (error.message.includes('500')) {
        setApiError(t('admin-account.success-message').replace('Account created successfully!', 'Something went wrong. Please try again.'));
      } else {
        setApiError(error.message || t('admin-account.success-message').replace('Account created successfully!', 'An unexpected error occurred'));
      }
    }
  };

  // Determine if the submit button should be enabled
  const isSubmitEnabled =
    fullName.trim().length > 0 &&
    password.length >= 8 &&
    passwordStrength !== 'weak' &&
    passwordMatch &&
    !isLoading;

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md p-8 space-y-6 border border-white/20">
        {/* Logo Placeholder */}
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center transform rotate-3">
            <span className="text-white font-bold text-xl">DO</span>
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">{t('admin-account.title')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('admin-account.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Full Name Field */}
          <div>
            <label htmlFor="fullName" className="block text-sm font-semibold text-gray-700 mb-1">
              {t('admin-account.first-name-label')} {t('admin-account.last-name-label')}
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={handleFullNameChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-4 transition-all outline-none ${
                errors.fullName
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/10'
              }`}
              placeholder={`${t('admin-account.first-name-placeholder')} ${t('admin-account.last-name-placeholder')}`}
              disabled={isLoading}
            />
            {errors.fullName && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
              {t('admin-account.password-label')}
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-4 transition-all outline-none ${
                errors.password
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/10'
              }`}
              placeholder={t('admin-account.password-placeholder')}
              disabled={isLoading}
            />

            {/* Password Strength Indicator */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-500 font-medium">{t('admin-account.password-label')} {t('admin-account.password-label').toLowerCase().replace('password', 'strength')}:</span>
                <span className={`text-xs font-bold uppercase tracking-wider ${
                  passwordStrength === 'weak' ? 'text-red-600' :
                  passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'
                }`}>
                  {passwordStrength === 'weak' ? t('admin-account.password-label').toLowerCase().replace('password', 'too weak') :
                   passwordStrength === 'medium' ? t('admin-account.password-label').toLowerCase().replace('password', 'weak') : t('admin-account.password-label').toLowerCase().replace('password', 'strong')}
                </span>
              </div>
              <div className="flex space-x-1 h-1.5">
                {[1, 2, 3].map((level) => (
                  <div
                    key={level}
                    className={`flex-1 rounded-full transition-all duration-300 ${
                      password.length === 0
                        ? 'bg-gray-100'
                        : level <= (passwordStrength === 'weak' ? 1 : passwordStrength === 'medium' ? 2 : 3)
                          ? passwordStrength === 'weak' ? 'bg-red-500' :
                            passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          : 'bg-gray-100'
                    }`}
                  />
                ))}
              </div>
            </div>

            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password Field */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
              {t('admin-account.confirm-password-label')}
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-4 transition-all outline-none ${
                errors.confirmPassword
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-gray-200 bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-blue-500/10'
              }`}
              placeholder={t('admin-account.confirm-password-label')}
              disabled={isLoading}
            />
            {!passwordMatch && confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{t('admin-account.confirm-password-error')}</p>
            )}
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* API Error Message */}
          {apiError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2">
              <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <p className="text-sm text-red-700">{apiError}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={!isSubmitEnabled}
            className={`w-full py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 ${
              isSubmitEnabled
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] shadow-blue-500/30 hover:shadow-blue-500/40'
                : 'bg-gray-300 cursor-not-allowed shadow-none opacity-70'
            }`}
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {t('admin-account.processing')}
              </span>
            ) : t('admin-account.create-account-button')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Card4AdminAccountClient;