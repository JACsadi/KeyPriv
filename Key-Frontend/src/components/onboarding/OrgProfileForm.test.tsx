import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OrgProfileForm from './OrgProfileForm';
import { mockSaveOrgProfile, mockFetchOrgProfile } from '../../lib/mockApi/orgProfile';
import { EU_COUNTRIES } from '../../lib/constants/euCountries';

// Mock the router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue('acme.onkeypriv.com')
  })
}));

// Mock the mock API functions
jest.mock('../../../lib/mockApi/orgProfile', () => ({
  mockSaveOrgProfile: jest.fn(),
  mockFetchOrgProfile: jest.fn(),
  EU_COUNTRIES: ['DE', 'FR', 'NL']
}));

const mockedRouter = useRouter as jest.MockedFunction<any>;
const mockedSaveOrgProfile = mockSaveOrgProfile as jest.MockedFunction<any>;
const mockedFetchOrgProfile = mockFetchOrgProfile as jest.MockedFunction<any>;

describe('OrgProfileForm', () => {
  beforeEach(() => {
    mockedRouter.mockReturnValue({
      push: jest.fn(),
      refresh: jest.fn(),
    });
    
    mockedSaveOrgProfile.mockResolvedValue({ next: '/onboarding/entity-setup' });
    mockedFetchOrgProfile.mockResolvedValue(null);
    
    // Mock window.URL.createObjectURL for image previews
    Object.defineProperty(window, 'URL', {
      value: {
        createObjectURL: jest.fn(() => 'mocked-url'),
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the form with all required fields', () => {
    render(<OrgProfileForm />);
    
    expect(screen.getByText('Organization Profile Setup')).toBeInTheDocument();
    expect(screen.getByLabelText('Organization Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Industry')).toBeInTheDocument();
    expect(screen.getByLabelText('Company Size')).toBeInTheDocument();
    expect(screen.getByLabelText('Country / Region')).toBeInTheDocument();
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument();
    expect(screen.getByLabelText('Security Contact Email')).toBeInTheDocument();
    expect(screen.getByText('Company Logo Upload')).toBeInTheDocument();
    expect(screen.getByText('Save Draft')).toBeInTheDocument();
    expect(screen.getByText('Save & Continue →')).toBeInTheDocument();
  });

  it('prefills organization name from tenant domain', async () => {
    render(<OrgProfileForm />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('ACME')).toBeInTheDocument();
    });
  });

  it('loads existing draft data when available', async () => {
    mockedFetchOrgProfile.mockResolvedValue({
      orgName: 'Test Company',
      industry: 'technology',
      companySize: '51-200',
      country: 'US',
      timezone: 'EST',
      securityEmail: 'test@example.com'
    });
    
    render(<OrgProfileForm />);
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('Test Company')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Profile loaded from saved draft.')).toBeInTheDocument();
  });

  it('triggers autosave when fields are changed', async () => {
    render(<OrgProfileForm />);
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Change organization name to trigger autosave
    const orgNameInput = screen.getByLabelText('Organization Name');
    fireEvent.change(orgNameInput, { target: { value: 'New Company Name' } });
    
    // Wait for debounce timeout (1 second in our implementation)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });
    
    expect(mockedSaveOrgProfile).toHaveBeenCalled();
  });

  it('shows validation errors when required fields are empty', async () => {
    render(<OrgProfileForm />);
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Click save and continue without filling required fields
    const saveContinueButton = screen.getByText('Save & Continue →');
    fireEvent.click(saveContinueButton);
    
    await waitFor(() => {
      expect(screen.getByText('Organization name is required')).toBeInTheDocument();
      expect(screen.getByText('Industry is required')).toBeInTheDocument();
      expect(screen.getByText('Company size is required')).toBeInTheDocument();
      expect(screen.getByText('Country is required')).toBeInTheDocument();
      expect(screen.getByText('Timezone is required')).toBeInTheDocument();
    });
  });

  it('shows inline error when mock API returns 400 error', async () => {
    mockedSaveOrgProfile.mockRejectedValue(new Error('invalid'));
    
    render(<OrgProfileForm />);
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Fill all required fields
    fireEvent.change(screen.getByLabelText('Organization Name'), { target: { value: 'Test Company' } });
    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'technology' } });
    fireEvent.change(screen.getByLabelText('Company Size'), { target: { value: '51-200' } });
    fireEvent.change(screen.getByLabelText('Country / Region'), { target: { value: 'US' } });
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'EST' } });
    
    // Click save and continue
    const saveContinueButton = screen.getByText('Save & Continue →');
    fireEvent.click(saveContinueButton);
    
    await waitFor(() => {
      expect(screen.getByText('invalid')).toBeInTheDocument();
    });
  });

  it('shows agency type field when industry is government', async () => {
    render(<OrgProfileForm />);
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Change industry to government
    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'government' } });
    
    expect(screen.getByLabelText('Agency Type')).toBeInTheDocument();
  });

  it('shows security email warning when domain differs', async () => {
    render(<OrgProfileForm />);
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Enter a security email with different domain
    fireEvent.change(screen.getByLabelText('Security Contact Email'), { target: { value: 'external@otherdomain.com' } });
    
    expect(screen.getByText('We recommend using an internal security mailbox.')).toBeInTheDocument();
  });

  it('highlights industry dropdown when EU country is selected', async () => {
    render(<OrgProfileForm />);
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Select an EU country
    fireEvent.change(screen.getByLabelText('Country / Region'), { target: { value: 'DE' } });
    
    const industrySelect = screen.getByLabelText('Industry');
    // Check that the industry dropdown has a blue border (indicating EU country)
    expect(industrySelect).toHaveAttribute('class', expect.stringContaining('border-2'));
    expect(industrySelect).toHaveAttribute('class', expect.stringContaining('border-blue-500'));
  });

  it('validates file upload', () => {
    render(<OrgProfileForm />);
    
    // Create a mock file with invalid type
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const fileInput = screen.getByLabelText('Choose file');
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
    });
    
    fireEvent.change(fileInput);
    
    expect(screen.getByText('Please upload a PNG, JPG, or WebP file.')).toBeInTheDocument();
  });

  it('shows offline mode banner', async () => {
    // Mock navigator.onLine to be false
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    
    render(<OrgProfileForm />);
    
    expect(screen.getByText('Offline — changes will be saved when the connection restores.')).toBeInTheDocument();
  });

  it('redirects on successful save and continue', async () => {
    const pushMock = jest.fn();
    mockedRouter.mockReturnValue({
      push: pushMock,
      refresh: jest.fn(),
    });
    
    render(<OrgProfileForm />);
    
    // Wait for initial loading to finish
    await waitFor(() => {
      expect(screen.queryByText('Loading profile...')).not.toBeInTheDocument();
    });
    
    // Fill all required fields
    fireEvent.change(screen.getByLabelText('Organization Name'), { target: { value: 'Test Company' } });
    fireEvent.change(screen.getByLabelText('Industry'), { target: { value: 'technology' } });
    fireEvent.change(screen.getByLabelText('Company Size'), { target: { value: '51-200' } });
    fireEvent.change(screen.getByLabelText('Country / Region'), { target: { value: 'US' } });
    fireEvent.change(screen.getByLabelText('Timezone'), { target: { value: 'EST' } });
    
    // Click save and continue
    fireEvent.click(screen.getByText('Save & Continue →'));
    
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/onboarding/entity-setup');
    });
  });
});