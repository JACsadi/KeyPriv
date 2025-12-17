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

// Mock API for checking subdomain availability
export async function checkSubdomainAvailability(subdomain: string): Promise<SubdomainCheckResponse> {
  // Artificial delay to simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));

  // If subdomain contains "taken", return conflict
  if (subdomain.includes('taken')) {
    return { available: false };
  }

  // Otherwise return available
  return { available: true };
}

// Mock API for creating a tenant with retry logic
export async function createTenant(payload: CreateTenantPayload): Promise<CreateTenantResponse | CreateTenantError> {
  // Simulate a delay to mimic API processing
  await new Promise(resolve => setTimeout(resolve, 500));

  // If subdomain includes "fail", return an error to trigger retry logic
  if (payload.requested_subdomain.includes('fail')) {
    throw new Error('Simulated failure for testing retry logic');
  }

  // Mock successful response
  return {
    tenant_id: `tenant_${Math.random().toString(36).substring(2, 15)}`,
    realm_url: `https://${payload.requested_subdomain}.onkeypriv.com`,
    admin_user_id: `user_${Math.random().toString(36).substring(2, 15)}`,
  };
}

// Internal retry logic for createTenant
export async function createTenantWithRetry(payload: CreateTenantPayload, maxRetries: number = 3): Promise<CreateTenantResponse | CreateTenantError> {
  const delays = [100, 300, 900]; // Delay values in ms

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // On the first attempt, try the main call
      if (attempt === 0) {
        return await createTenant(payload);
      }

      // On retry attempts, wait for the specified delay before retrying
      await new Promise(resolve => setTimeout(resolve, delays[attempt - 1]));
      return await createTenant(payload);
    } catch (error) {
      if (attempt === maxRetries - 1) {
        // If we're on the last attempt, return a circuit breaker error
        return { circuit_breaker: true, message: 'Failed to create tenant after maximum retries' };
      }
      // Otherwise continue to the next retry
      continue;
    }
  }

  // This should never be reached due to the loop logic, but added for type safety
  return { circuit_breaker: true, message: 'Unexpected error during tenant creation' };
}