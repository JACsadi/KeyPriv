'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { mockSaveOrgProfile, mockFetchOrgProfile } from '@/lib/mockApi/orgProfile';
import { EU_COUNTRIES } from '@/config/euCountries';

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

const OrgProfileFormClient: React.FC = () => {
  const t = useTranslations('onboarding');
  const locale = useLocale();
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
  const isFormValid = useMemo(() => {
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
      errors.orgName = t('org-setup.org-name-error');
    } else if (formData.orgName.trim().length > 100) {
      errors.orgName = t('org-setup.org-name-error').replace('is required', 'must be 100 characters or less');
    }

    if (!formData.industry) {
      errors.industry = 'Industry is required';
    }

    if (!formData.companySize) {
      errors.companySize = 'Company size is required';
    }

    if (!formData.country) {
      errors.country = t('org-setup.country-label') + ' is required';
    }

    if (!formData.timezone) {
      errors.timezone = 'Timezone is required';
    }

    if (formData.securityEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.securityEmail)) {
      errors.securityEmail = t('email-entry.email-error');
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
      
      const nextPath = response.next.startsWith('/') ? response.next : `/${response.next}`;
      router.push(`/${locale}${nextPath}`);
    } catch (err: any) {
      setError(err.message || t('org-setup.success-message').replace('Organization created successfully!', 'An error occurred while saving the profile'));
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
      setSuccessBanner(t('org-setup.success-message').replace('Organization created successfully!', 'Failed to save draft. Changes will be saved when online.'));
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
        <p className="mt-4 text-gray-600">{t('org-setup.processing')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 transition-all duration-300">
        {/* Success banner */}
        {successBanner && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            {successBanner}
          </div>
        )}

        {/* Offline banner */}
        {isOffline && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {t('org-setup.success-message').replace('Organization created successfully!', 'Offline — changes will be saved when the connection restores.')}
          </div>
        )}

        {/* Error banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {/* Auto-save status */}
        {autoSaveStatus && (
          <div className="mb-6 px-4 py-2 bg-blue-50/50 text-blue-600 rounded-full text-xs font-semibold uppercase tracking-wider text-center w-fit mx-auto border border-blue-100">
            {autoSaveStatus}
          </div>
        )}

        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center transform -rotate-3 hover:rotate-0 transition-transform duration-300">
            <span className="text-white font-bold text-xl">DO</span>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{t('org-setup.title')}</h1>
        </div>

        <div className="space-y-5">
          {/* Organization Name */}
          <div>
            <label htmlFor="orgName" className="block text-sm font-semibold text-gray-700 mb-1">
              {t('org-setup.org-name-label')}
            </label>
            <input
              id="orgName"
              name="orgName"
              type="text"
              value={formData.orgName}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-4 transition-all outline-none bg-gray-50 focus:bg-white ${
                fieldErrors.orgName
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-gray-200 focus:ring-blue-500/10 focus:border-blue-500'
              }`}
              placeholder={t('org-setup.org-name-placeholder')}
            />
            {fieldErrors.orgName && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.orgName}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Industry */}
            <div>
              <label htmlFor="industry" className="block text-sm font-semibold text-gray-700 mb-1">
                {t('org-setup.org-name-label').replace('Name', 'Industry')}
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className={`w-full px-3 py-3 border rounded-xl focus:ring-4 transition-all outline-none appearance-none bg-white ${
                  isEUCountry ? 'border-2 border-blue-500' : 'border-gray-200'
                } ${
                  fieldErrors.industry
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                    : 'focus:ring-blue-500/10 focus:border-blue-500'
                }`}
              >
                <option value="">Select...</option>
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
                <p className="mt-1 text-xs text-red-600">{fieldErrors.industry}</p>
              )}
            </div>

            {/* Company Size */}
            <div>
              <label htmlFor="companySize" className="block text-sm font-semibold text-gray-700 mb-1">
                {t('org-setup.org-name-label').replace('Name', 'Size')}
              </label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                className={`w-full px-3 py-3 border rounded-xl focus:ring-4 transition-all outline-none appearance-none bg-white ${
                  fieldErrors.companySize
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-gray-200 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
              >
                <option value="">Select...</option>
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-200">51-200</option>
                <option value="201-500">201-500</option>
                <option value="501-1000">501-1k</option>
                <option value="1000+">1k+</option>
              </select>
              {fieldErrors.companySize && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.companySize}</p>
              )}
            </div>
          </div>

          {/* Agency Type (conditional field for Government industry) */}
          {formData.industry === 'government' && (
            <div className="animate-fadeIn">
              <label htmlFor="agencyType" className="block text-sm font-semibold text-gray-700 mb-1">
                {t('org-setup.org-name-label').replace('Name', 'Agency Type')}
              </label>
              <input
                id="agencyType"
                name="agencyType"
                type="text"
                value={formData.agencyType || ''}
                onChange={handleAgencyTypeChange}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:outline-none focus:border-blue-500 transition-all bg-gray-50 focus:bg-white"
                placeholder="e.g. Federal, State, Local"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
             {/* Country / Region */}
            <div>
              <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-1">
                {t('org-setup.country-label')}
              </label>
              <select
                id="country"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                className={`w-full px-3 py-3 border rounded-xl focus:ring-4 transition-all outline-none appearance-none bg-white ${
                  fieldErrors.country
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-gray-200 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
              >
                <option value="">Select...</option>
                <option value="US">USA</option>
                <option value="CA">Canada</option>
                <option value="GB">UK</option>
                <option value="DE">Germany</option>
                <option value="FR">France</option>
                <option value="JP">Japan</option>
                <option value="AU">Australia</option>
                <option value="IN">India</option>
                <option value="BR">Brazil</option>
                <option value="CN">China</option>
                <option value="MX">Mexico</option>
                <option value="KR">Korea</option>
                <option value="NL">Netherlands</option>
                <option value="SG">Singapore</option>
                <option value="CH">Switzerland</option>
              </select>
              {fieldErrors.country && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.country}</p>
              )}
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="timezone" className="block text-sm font-semibold text-gray-700 mb-1">
                {t('org-setup.org-name-label').replace('Name', 'Timezone')}
              </label>
              <select
                id="timezone"
                name="timezone"
                value={formData.timezone}
                onChange={handleInputChange}
                className={`w-full px-3 py-3 border rounded-xl focus:ring-4 transition-all outline-none appearance-none bg-white ${
                  fieldErrors.timezone
                    ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                    : 'border-gray-200 focus:ring-blue-500/10 focus:border-blue-500'
                }`}
              >
                <option value="">Select...</option>
                <option value="EST">EST</option>
                <option value="CST">CST</option>
                <option value="MST">MST</option>
                <option value="PST">PST</option>
                <option value="GMT">GMT</option>
                <option value="CET">CET</option>
                <option value="JST">JST</option>
                <option value="AEST">AEST</option>
              </select>
              {fieldErrors.timezone && (
                <p className="mt-1 text-xs text-red-600">{fieldErrors.timezone}</p>
              )}
            </div>
          </div>

          {/* Security Contact Email */}
          <div>
            <label htmlFor="securityEmail" className="block text-sm font-semibold text-gray-700 mb-1">
              Contact Email
            </label>
            <input
              id="securityEmail"
              name="securityEmail"
              type="email"
              value={formData.securityEmail}
              onChange={handleInputChange}
              className={`w-full px-4 py-3 border rounded-xl focus:ring-4 transition-all outline-none ${
                fieldErrors.securityEmail
                  ? 'border-red-300 bg-red-50 focus:border-red-500 focus:ring-red-500/10'
                  : 'border-gray-200 focus:ring-blue-500/10 focus:border-blue-500'
              }`}
              placeholder="security@company.com"
            />
            {fieldErrors.securityEmail && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.securityEmail}</p>
            )}
            {hasSecurityEmailDomainMismatch && formData.securityEmail && (
              <p className="mt-1 text-xs text-amber-600 font-medium flex items-center gap-1">
                 <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Recommend internal security mailbox
              </p>
            )}
          </div>

          {/* Company Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Company Logo
            </label>
            <div className={`border-2 border-dashed rounded-xl p-4 transition-colors ${formData.logoPreview ? 'border-indigo-300 bg-indigo-50' : 'border-gray-300 hover:border-gray-400'}`}>
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 w-16 h-16 border border-gray-200 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-sm">
                  {formData.logoPreview ? (
                    <img
                      src={formData.logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                </div>
                <label className="flex-1 cursor-pointer">
                  <span className="block text-sm font-medium text-indigo-600 hover:text-indigo-500">
                    Upload new logo
                  </span>
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/jpg, image/webp"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    PNG, JPG, or WebP. Max 5MB.
                  </p>
                </label>
              </div>
            </div>
            {fieldErrors.logo && (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.logo}</p>
            )}
          </div>
        </div>

        <div className="flex space-x-3 mt-8">
          <button
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="flex-1 py-4 px-4 rounded-xl font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-all hover:scale-[1.02]"
          >
            Save Draft
          </button>

          <button
            onClick={handleSaveAndContinue}
            disabled={isSaving || isOffline || !isFormValid}
            className={`flex-[2] py-4 px-6 rounded-xl font-bold text-white shadow-lg transition-all duration-200 ${
              isFormValid && !isSaving && !isOffline
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:scale-[1.02] shadow-blue-500/30 hover:shadow-blue-500/40'
                : 'bg-gray-400 cursor-not-allowed shadow-none opacity-70'
            }`}
          >
            {isSaving ? t('org-setup.processing') : t('org-setup.next-button')}
          </button>
        </div>
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

export default OrgProfileFormClient;