// Mock API functions for OTP

export interface OtpResponse {
  success: boolean;
  tenant?: {
    tenant_domain: string;
  };
}

export interface TenantResponse {
  tenant_domain: string;
}

export async function sendOtp(email: string): Promise<void> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`OTP sent to: ${email}`);
  return;
}

export async function verifyOtp(_email: string, otp: string): Promise<OtpResponse> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Mock validation - if OTP is "123456", consider it valid
  if (otp === "123456") {
    return {
      success: true
    };
  } else if (otp) {
    // If OTP is provided but incorrect
    return { success: false };
  } else {
    // If no OTP provided
    return { success: false };
  }
}

export async function createTenant(_email: string, orgName: string): Promise<TenantResponse> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Generate a mock tenant domain from the org name
  const normalizedOrgName = orgName.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

  return {
    tenant_domain: `${normalizedOrgName}.onkeypriv.com`
  };
}