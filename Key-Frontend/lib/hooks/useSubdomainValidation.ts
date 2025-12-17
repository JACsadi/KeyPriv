import { useState, useEffect } from 'react';
import { useDebounce } from './useDebounce';
import { normalizeSubdomain, isReservedSubdomain, formatSubdomain } from '../utils/subdomain';
import { RESERVED_SUBDOMAINS } from '../constants/reservedSubdomains';
import { checkSubdomainAvailability } from '../api/tenant';

export interface SubdomainValidationState {
  normalizedSubdomain: string;
  fullSubdomain: string;
  availability: 'idle' | 'checking' | 'available' | 'unavailable';
  isReserved: boolean;
  error: string | null;
}

export function useSubdomainValidation(orgName: string) {
  const [validationState, setValidationState] = useState<SubdomainValidationState>({
    normalizedSubdomain: '',
    fullSubdomain: '',
    availability: 'idle',
    isReserved: false,
    error: null,
  });

  const debouncedOrgName = useDebounce(orgName, 400);

  useEffect(() => {
    if (!orgName.trim()) {
      setValidationState({
        normalizedSubdomain: '',
        fullSubdomain: '',
        availability: 'idle',
        isReserved: false,
        error: null,
      });
      return;
    }

    const normalized = normalizeSubdomain(orgName);

    if (!normalized) {
      setValidationState(prev => ({
        ...prev,
        normalizedSubdomain: '',
        fullSubdomain: '',
        error: 'Invalid organization name format',
      }));
      return;
    }

    const isReserved = isReservedSubdomain(normalized, RESERVED_SUBDOMAINS);
    const fullSubdomain = formatSubdomain(normalized);

    setValidationState(prev => ({
      ...prev,
      normalizedSubdomain: normalized,
      fullSubdomain,
      isReserved,
      error: isReserved ? 'Reserved subdomain' : null,
    }));

    if (!isReserved && normalized) {
      // Check availability after a delay to prevent excessive API calls
      setValidationState(prev => ({
        ...prev,
        availability: 'checking',
      }));

      const checkAvailability = async () => {
        try {
          const result = await checkSubdomainAvailability(normalized);
          setValidationState(prev => ({
            ...prev,
            availability: result.available ? 'available' : 'unavailable',
            error: result.available ? null : 'Subdomain already in use',
          }));
        } catch (error) {
          setValidationState(prev => ({
            ...prev,
            availability: 'unavailable',
            error: 'Failed to check subdomain availability',
          }));
        }
      };

      // Use a timeout to debounce the API call
      const timer = setTimeout(checkAvailability, 100);
      return () => clearTimeout(timer);
    }
  }, [debouncedOrgName]);

  return validationState;
}