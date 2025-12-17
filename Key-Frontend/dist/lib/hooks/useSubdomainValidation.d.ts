export interface SubdomainValidationState {
    normalizedSubdomain: string;
    fullSubdomain: string;
    availability: 'idle' | 'checking' | 'available' | 'unavailable';
    isReserved: boolean;
    error: string | null;
}
export declare function useSubdomainValidation(orgName: string): SubdomainValidationState;
