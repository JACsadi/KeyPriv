'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { mockSaveOrgProfile, mockFetchOrgProfile } from '../../lib/mockApi/orgProfile';
import { EU_COUNTRIES } from '../../lib/constants/euCountries';

interface OrgProfileData {
  orgName: string;
  industry: string;
  companySize: string;
  country: string;
  timezone: string;
  securityEmail: string;
  agencyType?: string;
  logo?: File | null;
  logoPreview?: string;
}

const OrgProfileForm: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the tenant domain from query params
  const tenantDomain = searchParams.get('tenant_domain') || '';
  
  // State for the form data
  const [formData, setFormData] = useState<OrgProfileData>({
    orgName: '',
    industry: '',
    companySize: '',
    country: '',
    timezone: '',
    securityEmail: '',
    agencyType: '',
    logo: null,
    logoPreview: '',
  });
  
  // State for UI indicators and messages
  const [loading, setLoading] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<string>(''); // 'saving', 'saved', 'failed'
  const [error, setError] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isOffline, setIsOffline] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Refs
  const autosaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Initialize the form
  useEffect(() => {
    // Extract org name from tenant domain
    if (tenantDomain) {
      const domainMatch = tenantDomain.match(/^(.+)\.onkeypriv\.com$/);
      if (domainMatch) {
        const orgName = domainMatch[1].toUpperCase();
        setFormData(prev => ({ ...prev, orgName }));
      }
    }
    
    // Load existing draft data
    const loadDraft = async () => {
      try {
        const savedData = await mockFetchOrgProfile();
        if (savedData) {
          setFormData(savedData);
          setSuccessBanner('Profile loaded from saved draft.');
        }
      } catch (err) {
        console.error('Error loading draft:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadDraft();

    // Track analytics
    analytics.track('org_profile_viewed');

    // Listen to online/offline events
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial offline status
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (autosaveTimeoutRef.current) {
        clearTimeout(autosaveTimeoutRef.current);
      }
    };
  }, [tenantDomain]);
  
  // Function to update form data and trigger autosave
  const updateFormData = (data: Partial<OrgProfileData>) => {
    setFormData(prev => ({ ...prev, ...data }));

    // Clear field errors when the field is changed
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      if (data.orgName !== undefined) delete newErrors.orgName;
      if (data.industry !== undefined) delete newErrors.industry;
      if (data.companySize !== undefined) delete newErrors.companySize;
      if (data.country !== undefined) delete newErrors.country;
      if (data.timezone !== undefined) delete newErrors.timezone;
      if (data.securityEmail !== undefined) delete newErrors.securityEmail;
      return newErrors;
    });

    // Trigger autosave
    if (autosaveTimeoutRef.current) {
      clearTimeout(autosaveTimeoutRef.current);
    }

    autosaveTimeoutRef.current = setTimeout(async () => {
      await performAutosave();
    }, 1000); // Debounce for 1 second
  };
  
  // Perform autosave
  const performAutosave = async () => {
    setAutoSaveStatus('saving');
    
    if (isOffline) {
      setAutoSaveStatus('offline — pending save');
      analytics.track('org_profile_autosave_success'); // Log as success when offline since no API call is made
      return;
    }
    
    try {
      await mockSaveOrgProfile(formData);
      setAutoSaveStatus('saved');
      analytics.track('org_profile_autosave_success');
    } catch (err: any) {
      if (err.message === 'server_error') {
        // Retry 3 times with exponential backoff
        let retryAttempts = 0;
        while (retryAttempts < 3) {
          setAutoSaveStatus('save failed — retrying');
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryAttempts) * 1000));
          
          try {
            await mockSaveOrgProfile(formData);
            setAutoSaveStatus('saved');
            analytics.track('org_profile_autosave_success');
            return;
          } catch (retryErr: any) {
            retryAttempts++;
            if (retryErr.message !== 'server_error' || retryAttempts >= 3) {
              setAutoSaveStatus('autosave failed — will try again');
              analytics.track('org_profile_save_failed', { error: retryErr.message });
              break;
            }
          }
        }
      } else {
        setAutoSaveStatus('failed');
        analytics.track('org_profile_save_failed', { error: err.message });
      }
    }
  };
  
  // Handle file upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setFieldErrors(prev => ({ ...prev, logo: 'Please upload a PNG, JPG, or WebP file.' }));
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFieldErrors(prev => ({ ...prev, logo: 'File size must be under 5MB.' }));
      return;
    }
    
    // Clear logo error
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.logo;
      return newErrors;
    });
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    
    updateFormData({
      logo: file,
      logoPreview: previewUrl
    });
  };
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };
  
  // Handle agency type change (only shown when industry is Government)
  const handleAgencyTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateFormData({ agencyType: e.target.value });
  };
  
  // Pure function to check form validity without setting state
  const isFormValid = useMemo((): boolean => {
    if (!formData.orgName.trim()) return false;
    if (formData.orgName.trim().length > 100) return false;
    if (!formData.industry) return false;
    if (!formData.companySize) return false;
    if (!formData.country) return false;
    if (!formData.timezone) return false;
    if (formData.securityEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.securityEmail)) return false;
    return true;
  }, [formData]);

  // Validate form data and update field errors (only call this in event handlers)
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.orgName.trim()) {
      errors.orgName = 'Organization name is required';
    } else if (formData.orgName.trim().length > 100) {
      errors.orgName = 'Organization name must be 100 characters or less';
    }

    if (!formData.industry) {
      errors.industry = 'Industry is required';
    }

    if (!formData.companySize) {
      errors.companySize = 'Company size is required';
    }

    if (!formData.country) {
      errors.country = 'Country is required';
    }

    if (!formData.timezone) {
      errors.timezone = 'Timezone is required';
    }

    if (formData.securityEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.securityEmail)) {
      errors.securityEmail = 'Please enter a valid email address';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle save and continue
  const handleSaveAndContinue = async () => {
    if (!validateForm()) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const response = await mockSaveOrgProfile(formData);
      analytics.track('org_profile_completed');
      router.push(response.next);
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving the profile');
      analytics.track('org_profile_save_failed', { error: err.message });
    } finally {
      setIsSaving(false);
    }
  };
  
  // Handle save draft
  const handleSaveDraft = async () => {
    if (isOffline) {
      // If offline, just show the status
      setAutoSaveStatus('offline — pending save');
      return;
    }
    
    try {
      await mockSaveOrgProfile(formData);
      setSuccessBanner('Draft saved successfully!');
      analytics.track('org_profile_autosave_success');
    } catch (err: any) {
      setSuccessBanner('Failed to save draft. Changes will be saved when online.');
      analytics.track('org_profile_save_failed', { error: err.message });
    }
  };
  
  // Check if the country is in the EU
  const isEUCountry = EU_COUNTRIES.includes(formData.country);
  
  // Check if security email domain differs from tenant domain
  const extractedTenantDomain = useMemo(() => {
    if (!tenantDomain) return '';
    const domainMatch = tenantDomain.match(/^(.+)\.onkeypriv\.com$/);
    return domainMatch ? domainMatch[1] : '';
  }, [tenantDomain]);

  const hasSecurityEmailDomainMismatch = useMemo(() => {
    return formData.securityEmail &&
      extractedTenantDomain &&
      !formData.securityEmail.toLowerCase().endsWith(`@${extractedTenantDomain}.onkeypriv.com`);
  }, [formData.securityEmail, extractedTenantDomain]);
  
 if (loading) {
    return (
      <div className="w-full max-w-md p-6 mt-10 border rounded-2xl shadow bg-white text-center">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }
  
  return (
    <div className="w-full max-w-md p-6 mt-10 border rounded-2xl shadow bg-white">
      {/* Success banner */}
      {successBanner && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm">
          {successBanner}
        </div>
      )}
      
      {/* Offline banner */}
      {isOffline && (
        <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-md text-sm">
          Offline — changes will be saved when the connection restores.
        </div>
      )}
      
      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* Auto-save status */}
      {autoSaveStatus && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-md text-sm text-center">
          {autoSaveStatus}
        </div>
      )}
      
      <div className="flex justify-center mb-6">
        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
          <span className="text-gray-600 font-bold">DO</span>
        </div>
      </div>

      <div className="text-center mb-6">
        <h1 className="text-xl font-semibold mb-2">Organization Profile Setup</h1>
      </div>

      <div className="space-y-4">
        {/* Organization Name */}
        <div>
          <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
            Organization Name
          </label>
          <input
            id="orgName"
            name="orgName"
            type="text"
            value={formData.orgName}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
              fieldErrors.orgName 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }`}
            placeholder="Enter organization name"
          />
          {fieldErrors.orgName && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.orgName}</p>
          )}
        </div>

        {/* Industry */}
        <div>
          <label htmlFor="industry" className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <select
            id="industry"
            name="industry"
            value={formData.industry}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white ${
              isEUCountry ? 'border-2 border-blue-500' : 'border-gray-300'
            } ${
              fieldErrors.industry 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'focus:ring-blue-200 focus:border-blue-500'
            } bg-[url('data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2Q4ZDhEO308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi1kb3duLXN2Zy1nZW5lcmF0b3I8L3RpdGxlPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI0Ljk1IDQuMjIgMC43MyA0LjIyIDIuNDggMC43MyAyLjQ4IDAgMi40OCAwIDQuOTUgMi40OCA0Ljk1IDQuMjIiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMCA1Ljc4IDQuMjIgNS43OCAyLjQ4IDkuMjcgMi40OCAxMCAyLjQ4IDEwIDAgNy41MiAwIDUuNzgiLz48L3N2Zz4=')] bg-no-repeat bg-[right_1rem_center] bg-[length:0.8rem] pr-10`}
          >
            <option value="">Select an industry</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="healthcare">Healthcare</option>
            <option value="education">Education</option>
            <option value="government">Government</option>
            <option value="retail">Retail</option>
            <option value="manufacturing">Manufacturing</option>
            <option value="other">Other</option>
          </select>
          {fieldErrors.industry && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.industry}</p>
          )}
        </div>

        {/* Agency Type (conditional field for Government industry) */}
        {formData.industry === 'government' && (
          <div>
            <label htmlFor="agencyType" className="block text-sm font-medium text-gray-700 mb-1">
              Agency Type
            </label>
            <input
              id="agencyType"
              name="agencyType"
              type="text"
              value={formData.agencyType || ''}
              onChange={handleAgencyTypeChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-500"
              placeholder="Enter agency type"
            />
          </div>
        )}

        {/* Company Size */}
        <div>
          <label htmlFor="companySize" className="block text-sm font-medium text-gray-700 mb-1">
            Company Size
          </label>
          <select
            id="companySize"
            name="companySize"
            value={formData.companySize}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white ${
              fieldErrors.companySize 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            } bg-[url('data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2Q4ZDhEO308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi1kb3duLXN2Zy1nZW5lcmF0b3I8L3RpdGxlPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI0Ljk1IDQuMjIgMC43MyA0LjIyIDIuNDggMC43MyAyLjQ4IDAgMi40OCAwIDQuOTUgMi40OCA0Ljk1IDQuMjIiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMCA1Ljc4IDQuMjIgNS43OCAyLjQ4IDkuMjcgMi40OCAxMCAyLjQ4IDEwIDAgNy41MiAwIDUuNzgiLz48L3N2Zz4=')] bg-no-repeat bg-[right_1rem_center] bg-[length:0.8rem] pr-10`}
          >
            <option value="">Select company size</option>
            <option value="1-10">1-10 employees</option>
            <option value="11-50">11-50 employees</option>
            <option value="51-200">51-200 employees</option>
            <option value="201-500">201-500 employees</option>
            <option value="501-1000">501-1000 employees</option>
            <option value="1000+">1000+ employees</option>
          </select>
          {fieldErrors.companySize && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.companySize}</p>
          )}
        </div>

        {/* Country / Region */}
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700 mb-1">
            Country / Region
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white ${
              fieldErrors.country 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            } bg-[url('data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2Q4ZDhEO308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi1kb3duLXN2Zy1nZW5lcmF0b3I8L3RpdGxlPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI0Ljk1IDQuMjIgMC43MyA0LjIyIDIuNDggMC43MyAyLjQ4IDAgMi40OCAwIDQuOTUgMi40OCA0Ljk1IDQuMjIiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMCA1Ljc4IDQuMjIgNS43OCAyLjQ4IDkuMjcgMi40OCAxMCAyLjQ4IDEwIDAgNy41MiAwIDUuNzgiLz48L3N2Zz4=')] bg-no-repeat bg-[right_1rem_center] bg-[length:0.8rem] pr-10`}
          >
            <option value="">Select a country</option>
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="GB">United Kingdom</option>
            <option value="DE">Germany</option>
            <option value="FR">France</option>
            <option value="JP">Japan</option>
            <option value="AU">Australia</option>
            <option value="IN">India</option>
            <option value="BR">Brazil</option>
            <option value="CN">China</option>
            <option value="MX">Mexico</option>
            <option value="KR">South Korea</option>
            <option value="NL">Netherlands</option>
            <option value="SG">Singapore</option>
            <option value="CH">Switzerland</option>
          </select>
          {fieldErrors.country && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.country}</p>
          )}
        </div>

        {/* Timezone */}
        <div>
          <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            id="timezone"
            name="timezone"
            value={formData.timezone}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none appearance-none bg-white ${
              fieldErrors.timezone 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            } bg-[url('data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfMSIgZGF0YS1uYW1lPSJMYXllciAxIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0Ljk1IDEwIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2Q4ZDhEO308L3N0eWxlPjwvZGVmcz48dGl0bGU+aWNvbi1kb3duLXN2Zy1nZW5lcmF0b3I8L3RpdGxlPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSI0Ljk1IDQuMjIgMC43MyA0LjIyIDIuNDggMC43MyAyLjQ4IDAgMi40OCAwIDQuOTUgMi40OCA0Ljk1IDQuMjIiLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iMCA1Ljc4IDQuMjIgNS43OCAyLjQ4IDkuMjcgMi40OCAxMCAyLjQ4IDEwIDAgNy41MiAwIDUuNzgiLz48L3N2Zz4=')] bg-no-repeat bg-[right_1rem_center] bg-[length:0.8rem] pr-10`}
          >
            <option value="">Select a timezone</option>
            <option value="EST">Eastern Time (EST)</option>
            <option value="CST">Central Time (CST)</option>
            <option value="MST">Mountain Time (MST)</option>
            <option value="PST">Pacific Time (PST)</option>
            <option value="GMT">Greenwich Mean Time (GMT)</option>
            <option value="CET">Central European Time (CET)</option>
            <option value="JST">Japan Standard Time (JST)</option>
            <option value="AEST">Australian Eastern Time (AEST)</option>
          </select>
          {fieldErrors.timezone && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.timezone}</p>
          )}
        </div>

        {/* Security Contact Email */}
        <div>
          <label htmlFor="securityEmail" className="block text-sm font-medium text-gray-700 mb-1">
            Security Contact Email
          </label>
          <input
            id="securityEmail"
            name="securityEmail"
            type="email"
            value={formData.securityEmail}
            onChange={handleInputChange}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:outline-none ${
              fieldErrors.securityEmail 
                ? 'border-red-500 focus:ring-red-200 focus:border-red-500' 
                : 'border-gray-300 focus:ring-blue-200 focus:border-blue-500'
            }`}
            placeholder="security@yourcompany.com"
          />
          {fieldErrors.securityEmail && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.securityEmail}</p>
          )}
          {hasSecurityEmailDomainMismatch && formData.securityEmail && (
            <p className="mt-1 text-sm text-yellow-600">
              We recommend using an internal security mailbox.
            </p>
          )}
        </div>

        {/* Company Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Company Logo Upload
          </label>
          <div className="flex items-center space-x-4">
            <div className="flex items-center justify-center w-16 h-16 border border-gray-300 rounded-md overflow-hidden">
              {formData.logoPreview ? (
                <img 
                  src={formData.logoPreview} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-gray-400 text-xs text-center">No logo</span>
              )}
            </div>
            <label className="flex flex-col items-center justify-center px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <span className="text-sm text-gray-600">Choose file</span>
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </label>
          </div>
          {fieldErrors.logo && (
            <p className="mt-1 text-sm text-red-600">{fieldErrors.logo}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            PNG, JPG, or WebP. Max file size: 5MB
          </p>
        </div>
      </div>

      <div className="flex space-x-3 mt-8">
        <button
          onClick={handleSaveDraft}
          disabled={isSaving}
          className="flex-1 py-3 px-4 rounded-lg font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-300"
        >
          Save Draft
        </button>
        
        <button
          onClick={handleSaveAndContinue}
          disabled={isSaving || isOffline || !isFormValid}
          className={`flex-1 py-3 px-4 rounded-lg font-medium text-white ${
            isFormValid && !isSaving && !isOffline
              ? 'bg-indigo-600 hover:bg-indigo-700'
              : 'bg-gray-400 cursor-not-allowed'
          }`}
        >
          {isSaving ? 'Processing...' : 'Save & Continue →'}
        </button>
      </div>
    </div>
  );
};

// Analytics stub
const analytics = {
  track: (event: string, properties?: any) => {
    console.log(`[Analytics] ${event}`, properties || '');
  }
};

export default OrgProfileForm;