// Mock API for organization profile

// Define the structure for the organization profile data
export interface OrgProfileData {
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

// Define the response structure
export interface OrgProfileResponse {
  next: string;
}

// Define the error response structure
export interface OrgProfileError {
  error: 'invalid' | 'already_exists' | 'server_error';
}

// Storage key for localStorage
const STORAGE_KEY = 'orgProfileDraft';

// Mock function to save organization profile
export async function mockSaveOrgProfile(data: OrgProfileData): Promise<OrgProfileResponse> {
  // Simulate network latency (700-1200ms)
  await new Promise(resolve => setTimeout(resolve, 700 + Math.random() * 500));

  // Simulate random errors (10-15% chance)
  if (Math.random() < 0.13) {
    let errorCode: OrgProfileError['error'];
    const errorTypes = ['invalid', 'already_exists', 'server_error'];
    errorCode = errorTypes[Math.floor(Math.random() * errorTypes.length)] as OrgProfileError['error'];

    throw new Error(errorCode);
  }

  // Save the data to localStorage
  const serializedData = JSON.stringify(data);
  localStorage.setItem(STORAGE_KEY, serializedData);

  // Return success response
  return {
    next: '/onboarding/entity-setup'
  };
}

// Mock function to fetch organization profile
export async function mockFetchOrgProfile(): Promise<OrgProfileData | null> {
  // Simulate network latency
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 200));

  // Retrieve data from localStorage
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) {
    return null;
  }

  try {
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error parsing stored organization profile data:', error);
    return null;
  }
}