// Using React Native's built-in fetch instead of axios for better compatibility

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';

// Project interface based on API response
export interface ProjectData {
  id: number;
  projectId: string;
  projectName: string;
  description: string;
  startDate: string;
  endDate: string;
  clientName: string;
  country: string;
  state: string;
  email: string;
  phoneNo: string;
  userId: number;
  userFirstName: string;
  userLastName: string;
}

// API Response interface
export interface GetProjectsResponse {
  status: 'success' | 'failure';
  message: string;
  data: ProjectData[] | null;
  statusCode: number;
}

// Error response interface
export interface ApiError {
  status: 'failure';
  message: string;
  data: null;
  statusCode: string;
}

// Custom error class for API errors
export class ProjectApiError extends Error {
  public statusCode: number;
  public apiStatus: string;

  constructor(message: string, statusCode: number, apiStatus: string) {
    super(message);
    this.name = 'ProjectApiError';
    this.statusCode = statusCode;
    this.apiStatus = apiStatus;
  }
}

/**
 * Fetches all projects from the API
 *
 * @returns Promise<ProjectData[]> - Array of project data
 * @throws ProjectApiError - When API request fails or returns error
 */
export const getProjects = async (): Promise<ProjectData[]> => {
  try {
    const url = `${API_BASE_URL}/projects`;
    console.log('🚀 Fetching projects from API:', url);

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // Make API request using fetch with better configuration
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('📡 API Response Status:', response.status);
    console.log('📡 API Response Headers:', response.headers);

    // Check if response is ok before parsing
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      throw new ProjectApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        'http_error'
      );
    }

    // Parse JSON response
    const responseData: GetProjectsResponse = await response.json();
    console.log('📊 API Response Data:', responseData);

    // Check if response is successful
    if (response.ok && responseData.status === 'success') {
      // Validate that data exists and is an array
      if (responseData.data && Array.isArray(responseData.data)) {
        console.log('✅ Projects retrieved successfully:', responseData.data.length, 'projects');
        return responseData.data;
      } else {
        console.warn('⚠️ API returned success but no data array');
        return [];
      }
    } else {
      // Handle API error response
      const errorMessage = responseData.message || `HTTP ${response.status}: ${response.statusText}`;
      const statusCode = responseData.statusCode || response.status;

      console.error('❌ API returned error:', errorMessage);
      throw new ProjectApiError(
        errorMessage,
        statusCode,
        responseData.status || 'failure'
      );
    }

  } catch (error) {
    console.error('💥 Error fetching projects:', error);
    console.error('💥 Error type:', typeof error);
    console.error('💥 Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('💥 Error message:', error instanceof Error ? error.message : 'Unknown');

    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ProjectApiError(
        'Request timeout: Server took too long to respond. Please try again.',
        0,
        'timeout_error'
      );
    }

    // Handle network errors (most common cause)
    if (error instanceof TypeError ||
        (error instanceof Error && (
          error.message.includes('Network request failed') ||
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('ERR_NETWORK') ||
          error.message.includes('ERR_INTERNET_DISCONNECTED')
        ))) {
      throw new ProjectApiError(
        'Network error: Unable to connect to server. Please check your internet connection and ensure the server is accessible.',
        0,
        'network_error'
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new ProjectApiError(
        'Invalid response format: Server returned invalid JSON.',
        0,
        'parse_error'
      );
    }

    // Handle other types of errors
    if (error instanceof ProjectApiError) {
      throw error;
    }

    // Unknown error with more details
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new ProjectApiError(
      `Unexpected error: ${errorMessage}. Please check your network connection and try again.`,
      0,
      'unknown_error'
    );
  }
};

/**
 * Transforms API project data to match the existing Project interface used in the app
 * 
 * @param apiProjects - Array of projects from API
 * @returns Array of projects in app format
 */
export const transformProjectsForApp = (apiProjects: ProjectData[]) => {
  return apiProjects.map(project => ({
    id: project.id.toString(), // Use numeric id converted to string for consistency
    numericId: project.id, // Keep numeric ID for API calls that need it
    projectId: project.projectId, // Keep original projectId as well
    name: project.projectName,
    description: project.description,
    // Additional fields that might be useful
    clientName: project.clientName,
    startDate: project.startDate,
    endDate: project.endDate,
    country: project.country,
    state: project.state,
    email: project.email,
    phoneNo: project.phoneNo,
    teamLead: `${project.userFirstName} ${project.userLastName}`,
  }));
};

/**
 * Utility function to check if the API is reachable
 *
 * @returns Promise<boolean> - True if API is reachable
 */
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    console.log('🔍 Checking API health:', `${API_BASE_URL}/projects`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🔍 API health check response:', response.status, response.ok);
    return response.ok;
  } catch (error) {
    console.warn('🔍 API health check failed:', error);
    return false;
  }
};

/**
 * Test function to verify network connectivity
 *
 * @returns Promise<boolean> - True if basic network is working
 */
export const testNetworkConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🌐 Testing basic network connectivity...');

    // Test with a reliable public API first
    const response = await fetch('https://httpbin.org/get', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log('🌐 Network test response:', response.status, response.ok);
    return response.ok;
  } catch (error) {
    console.warn('🌐 Network connectivity test failed:', error);
    return false;
  }
};

/**
 * Debug function to test the API endpoint directly
 * This function provides detailed logging for troubleshooting
 */
export const debugApiCall = async (): Promise<void> => {
  console.log('🔧 === DEBUG API CALL START ===');
  console.log('🔧 API URL:', `${API_BASE_URL}/projects`);
  console.log('🔧 Current time:', new Date().toISOString());

  try {
    // Step 1: Test basic network
    console.log('🔧 Step 1: Testing basic network connectivity...');
    const networkTest = await testNetworkConnectivity();
    console.log('🔧 Network test result:', networkTest);

    if (!networkTest) {
      console.error('🔧 ❌ Basic network connectivity failed');
      return;
    }

    // Step 2: Test API endpoint
    console.log('🔧 Step 2: Testing API endpoint...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('🔧 ⏰ Request timeout triggered');
      controller.abort();
    }, 15000);

    const response = await fetch(`${API_BASE_URL}/projects`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cache-Control': 'no-cache',
        'User-Agent': 'DefectTracker-ReactNative/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log('🔧 Response status:', response.status);
    console.log('🔧 Response ok:', response.ok);
    console.log('🔧 Response headers:', JSON.stringify([...response.headers.entries()]));

    if (response.ok) {
      const data = await response.json();
      console.log('🔧 ✅ API call successful!');
      console.log('🔧 Response data:', JSON.stringify(data, null, 2));
    } else {
      console.error('🔧 ❌ API returned error status:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('🔧 Error response body:', errorText);
    }

  } catch (error) {
    console.error('🔧 ❌ API call failed with error:', error);
    console.error('🔧 Error type:', typeof error);
    console.error('🔧 Error name:', error instanceof Error ? error.name : 'Unknown');
    console.error('🔧 Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('🔧 Error stack:', error instanceof Error ? error.stack : 'No stack trace');
  }

  console.log('🔧 === DEBUG API CALL END ===');
};

// Export default
export default {
  getProjects,
  transformProjectsForApp,
  checkApiHealth,
  testNetworkConnectivity,
  debugApiCall,
  ProjectApiError,
};
