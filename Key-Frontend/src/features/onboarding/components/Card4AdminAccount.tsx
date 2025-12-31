'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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

const Card4AdminAccount = () => {
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
      newErrors.fullName = 'Full name is required';
    } else if (fullName.trim().length < 2) {
      newErrors.fullName = 'Full name must be at least 2 characters';
    }
    
    // Validate password
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength === 'weak') {
      newErrors.password = 'Password is too weak';
    }
    
    // Validate confirm password
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (!passwordMatch) {
      newErrors.confirmPassword = 'Passwords do not match';
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
      router.push('/onboarding/org-profile');
      router.refresh(); // Refresh to ensure state updates
    } catch (error: any) {
      setIsLoading(false);

      // Handle different error types
      if (error.message.includes('409')) {
        setApiError('Admin account already exists. Please continue to the next step.');
      } else if (error.message.includes('400')) {
        setApiError('Password too weak. Please use a stronger password.');
      } else if (error.message.includes('500')) {
        setApiError('Something went wrong. Please try again.');
      } else {
        setApiError(error.message || 'An unexpected error occurred');
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
    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-8 space-y-6 border border-gray-200">
      {/* Logo Placeholder */}
      <div className="flex justify-center">
        <div className="bg-gray-200 border-2 border-dashed rounded-xl w-16 h-16 flex items-center justify-center">
          <span className="text-gray-500 text-xs text-center">DarkOnion Logo</span>
        </div>
      </div>
      
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900">Create your admin account</h1>
        <p className="mt-2 text-sm text-gray-600">
          Set up your personal account to access the admin panel
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Full Name Field */}
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={handleFullNameChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
              errors.fullName 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }`}
            placeholder="John Doe"
            disabled={isLoading}
          />
          {errors.fullName && (
            <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
          )}
        </div>

        {/* Password Field */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
              errors.password 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }`}
            placeholder="Enter your password"
            disabled={isLoading}
          />
          
          {/* Password Strength Indicator */}
          <div className="mt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Password strength:</span>
              <span className={`text-xs font-medium ${
                passwordStrength === 'weak' ? 'text-red-600' :
                passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'
              }`}>
                {passwordStrength === 'weak' ? 'Too Weak' : 
                 passwordStrength === 'medium' ? 'Weak' : 'Strong'}
              </span>
            </div>
            <div className="mt-1 flex space-x-1">
              {[1, 2, 3].map((level) => (
                <div
                  key={level}
                  className={`h-2 flex-1 rounded-full ${
                    password.length === 0
                      ? 'bg-gray-200'
                      : level <= (passwordStrength === 'weak' ? 1 : passwordStrength === 'medium' ? 2 : 3)
                        ? passwordStrength === 'weak' ? 'bg-red-500' : 
                          passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                        : 'bg-gray-200'
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
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
              errors.confirmPassword 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }`}
            placeholder="Confirm your password"
            disabled={isLoading}
          />
          {!passwordMatch && confirmPassword && (
            <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
          )}
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
          )}
        </div>

        {/* API Error Message */}
        {apiError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{apiError}</p>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={!isSubmitEnabled}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 ${
            isSubmitEnabled
              ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 cursor-pointer'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? 'Creating account...' : 'Create Admin Account →'}
        </button>
      </form>
    </div>
  );
};

export default Card4AdminAccount;