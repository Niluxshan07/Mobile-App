// Using React Native's built-in fetch API for better compatibility
// This approach doesn't require additional dependencies like axios

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
const REQUEST_TIMEOUT = 10000; // 10 seconds timeout (reduced for faster feedback)

// Simple connectivity test function
export const testApiConnectivity = async (): Promise<boolean> => {
  try {
    console.log('🌐 Testing API connectivity...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for connectivity test

    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('🌐 Connectivity test result:', response.ok);
    return response.ok;
  } catch (error) {
    console.log('🌐 Connectivity test failed:', error);
    return false;
  }
};

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Status interface for individual status items from API
export interface StatusItem {
  color: string;
  count: number;
}

// Status interface for defect statuses with colors (actual API response structure)
export interface DefectStatusItem {
  REOPEN?: StatusItem;
  NEW?: StatusItem;
  OPEN?: StatusItem;
  FIXED?: StatusItem;
  CLOSED?: StatusItem;
  REJECTED?: StatusItem;
  DUPLICATE?: StatusItem;
}

// Defect Summary interface for each severity level
export interface DefectSummaryItem {
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  Severity_color: 'Red' | 'Orange' | 'Yellow' | 'Green';
  total: number;
  statuses: DefectStatusItem;
}

// Main data interface for the API response
export interface SeveritySummaryData {
  projectId: number;
  projectName: string;
  totalDefects: number;
  defectSummary: DefectSummaryItem[];
}

// API Response interface for success
export interface SeveritySummaryApiResponse {
  status: 'success';
  statusCode: 2000;
  data: SeveritySummaryData;
}

// API Response interface for failure
export interface SeveritySummaryApiErrorResponse {
  status: 'failure';
  message: string;
  data: null;
  statusCode: 4000;
}

// Custom error class for API errors
export class SeveritySummaryApiError extends Error {
  public apiStatus: string;
  public statusCode: number;
  public originalMessage: string;

  constructor(apiStatus: string, statusCode: number, message: string) {
    super(message);
    this.name = 'SeveritySummaryApiError';
    this.apiStatus = apiStatus;
    this.statusCode = statusCode;
    this.originalMessage = message;
  }
}

// Function to get severity summary data from API using fetch
export const getSeveritySummary = async (projectId: number): Promise<SeveritySummaryData> => {
  const url = `${API_BASE_URL}/dashboard/defect_severity_summary/${projectId}`;

  console.log('🚀 Making API request to:', url);
  console.log('📊 Project ID:', projectId);

  try {
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      console.log('⏰ Request timeout after', REQUEST_TIMEOUT, 'ms');
      controller.abort();
    }, REQUEST_TIMEOUT);

    console.log('📡 Sending fetch request...');
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    console.log('📡 Fetch request completed');

    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);

    if (!response.ok) {
      if (response.status === 400) {
        const errorData: SeveritySummaryApiErrorResponse = await response.json();
        throw new SeveritySummaryApiError(
          'project_not_found',
          errorData.statusCode || 4000,
          errorData.message || 'Project not found'
        );
      }

      throw new SeveritySummaryApiError(
        'http_error',
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }

    const responseData: SeveritySummaryApiResponse = await response.json();
    console.log('📡 Raw API response:', JSON.stringify(responseData, null, 2));

    // Check if the response indicates success
    if (responseData.status !== 'success' || responseData.statusCode !== 2000) {
      throw new SeveritySummaryApiError(
        'api_error',
        responseData.statusCode || 4000,
        'API returned non-success status'
      );
    }

    if (!responseData.data) {
      throw new SeveritySummaryApiError(
        'data_error',
        4001,
        'No data received from API'
      );
    }

    console.log('✅ Successfully parsed severity summary data');
    console.log('📊 Total defects:', responseData.data.totalDefects);
    console.log('📊 Severity items:', responseData.data.defectSummary.length);

    return responseData.data;

  } catch (error: any) {
    console.error('❌ Error in getSeveritySummary:', error);
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);

    if (error.name === 'AbortError') {
      console.log('⏰ Request was aborted due to timeout');
      throw new SeveritySummaryApiError(
        'timeout_error',
        408,
        `Request timeout after ${REQUEST_TIMEOUT/1000} seconds - server took too long to respond`
      );
    }

    if (error instanceof SeveritySummaryApiError) {
      throw error;
    }

    // Handle various network error types
    if (error.message?.includes('Network request failed') ||
        error.message?.includes('fetch') ||
        error.code === 'NETWORK_ERROR' ||
        error.name === 'TypeError') {
      console.log('🌐 Network connectivity issue detected');
      throw new SeveritySummaryApiError(
        'network_error',
        0,
        'Network connection failed - please check your internet connection and server availability'
      );
    }

    // Handle JSON parsing errors
    if (error.message?.includes('JSON') || error.name === 'SyntaxError') {
      console.log('📄 JSON parsing error detected');
      throw new SeveritySummaryApiError(
        'parse_error',
        500,
        'Invalid response format from server'
      );
    }

    throw new SeveritySummaryApiError(
      'unknown_error',
      500,
      error.message || 'Unknown error occurred while fetching severity summary'
    );
  }
};

// Helper function to get severity color based on severity level
export const getSeverityColor = (severity: string): string => {
  switch (severity) {
    case 'Critical': return '#DC2626'; // Red
    case 'High': return '#EA580C'; // Orange  
    case 'Medium': return '#D97706'; // Yellow
    case 'Low': return '#16A34A'; // Green
    default: return '#6B7280'; // Gray
  }
};

// Helper function to get status color based on status
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Open': return '#3B82F6'; // Blue
    case 'Fixed': return '#000000'; // Black
    case 'Retest': return '#FFFFFF'; // White (with border)
    case 'Closed': return '#8B4513'; // Brown
    default: return '#6B7280'; // Gray
  }
};

// Helper function to format defect count for display
export const formatDefectCount = (count: number): string => {
  if (count === 0) return '0';
  if (count < 1000) return count.toString();
  if (count < 1000000) return `${(count / 1000).toFixed(1)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

// Helper function to calculate percentage
export const calculatePercentage = (part: number, total: number): string => {
  if (total === 0) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
};

// Helper function to convert API status data to simple count object
export const convertStatusesToCounts = (statuses: DefectStatusItem): { [key: string]: number } => {
  const counts: { [key: string]: number } = {};

  Object.entries(statuses).forEach(([status, statusItem]) => {
    if (statusItem && typeof statusItem === 'object' && 'count' in statusItem) {
      counts[status] = statusItem.count;
    }
  });

  return counts;
};

// Helper function to get status color from API data
export const getStatusColorFromApi = (statuses: DefectStatusItem, status: string): string => {
  const statusItem = statuses[status as keyof DefectStatusItem];
  if (statusItem && typeof statusItem === 'object' && 'color' in statusItem) {
    return statusItem.color;
  }
  return getStatusColor(status); // Fallback to default colors
};

// Helper function to get all available statuses from API data
export const getAvailableStatuses = (statuses: DefectStatusItem): string[] => {
  return Object.keys(statuses).filter(status => {
    const statusItem = statuses[status as keyof DefectStatusItem];
    return statusItem && typeof statusItem === 'object' && 'count' in statusItem;
  });
};
