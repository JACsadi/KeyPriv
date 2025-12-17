export interface OtpResponse {
    success: boolean;
    tenant?: {
        tenant_domain: string;
    };
}
export interface TenantResponse {
    tenant_domain: string;
}
export declare function sendOtp(email: string): Promise<void>;
export declare function verifyOtp(_email: string, otp: string): Promise<OtpResponse>;
export declare function createTenant(_email: string, orgName: string): Promise<TenantResponse>;
