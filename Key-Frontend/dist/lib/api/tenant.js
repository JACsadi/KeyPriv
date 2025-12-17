"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkSubdomainAvailability = checkSubdomainAvailability;
exports.createTenant = createTenant;
exports.createTenantWithRetry = createTenantWithRetry;
async function checkSubdomainAvailability(subdomain) {
    await new Promise(resolve => setTimeout(resolve, 300));
    if (subdomain.includes('taken')) {
        return { available: false };
    }
    return { available: true };
}
async function createTenant(payload) {
    await new Promise(resolve => setTimeout(resolve, 500));
    if (payload.requested_subdomain.includes('fail')) {
        throw new Error('Simulated failure for testing retry logic');
    }
    return {
        tenant_id: `tenant_${Math.random().toString(36).substring(2, 15)}`,
        realm_url: `https://${payload.requested_subdomain}.onkeypriv.com`,
        admin_user_id: `user_${Math.random().toString(36).substring(2, 15)}`,
    };
}
async function createTenantWithRetry(payload, maxRetries = 3) {
    const delays = [100, 300, 900];
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            if (attempt === 0) {
                return await createTenant(payload);
            }
            await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
            return await createTenant(payload);
        }
        catch (error) {
            if (attempt === maxRetries - 1) {
                return { circuit_breaker: true, message: 'Failed to create tenant after maximum retries' };
            }
            continue;
        }
    }
    return { circuit_breaker: true, message: 'Unexpected error during tenant creation' };
}
//# sourceMappingURL=tenant.js.map