export interface SubdomainCheckResponse {
    available: boolean;
}
export interface CreateTenantPayload {
    organization_name: string;
    country: string;
    requested_subdomain: string;
    admin_email: string;
}
export interface CreateTenantResponse {
    tenant_id: string;
    realm_url: string;
    admin_user_id: string;
}
export interface CreateTenantError {
    circuit_breaker?: boolean;
    message?: string;
}
export declare function checkSubdomainAvailability(subdomain: string): Promise<SubdomainCheckResponse>;
export declare function createTenant(payload: CreateTenantPayload): Promise<CreateTenantResponse | CreateTenantError>;
export declare function createTenantWithRetry(payload: CreateTenantPayload, maxRetries?: number): Promise<CreateTenantResponse | CreateTenantError>;
