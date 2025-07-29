// Using React Native's built-in fetch for consistency with existing API integration

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';

// Defect to Remark Ratio interface based on API response
export interface DefectToRemarkData {
  remarks: number;
  defects: number;
  ratio: string;
  category: string;
  color: string;
}

// API Response interface
export interface GetDefectToRemarkResponse {
  status: 'success' | 'failure';
  message: string;
  data: DefectToRemarkData | null;
  statusCode: number;
}

// Error response interface
export interface DefectToRemarkApiError {
  status: 'failure';
  message: string;
  statusCode: number;
}

// Custom error class for API errors
export class DefectToRemarkError extends Error {
  public statusCode: number;
  public apiStatus: string;

  constructor(message: string, statusCode: number, apiStatus: string) {
    super(message);
    this.name = 'DefectToRemarkError';
    this.statusCode = statusCode;
    this.apiStatus = apiStatus;
  }
}

// UI Color mapping based on defect to remark ratio ranges
export interface DefectToRemarkUIMapping {
  ratio: number;
  color: string;
  category: string;
  uiColor: string; // Color for UI display
}

/**
 * Maps defect to remark ratio to UI colors and categories
 * 
 * @param ratioValue - The calculated ratio value (0-100)
 * @returns DefectToRemarkUIMapping - UI mapping object
 */
export const mapDefectToRemarkRatioToUI = (ratioValue: number): DefectToRemarkUIMapping => {
  if (ratioValue > 98 && ratioValue <= 100) {
    return {
      ratio: ratioValue,
      color: 'Green',
      category: 'Low',
      uiColor: '#00ff6b' // Green - Low risk
    };
  } else if (ratioValue >= 90 && ratioValue <= 98) {
    return {
      ratio: ratioValue,
      color: 'Yellow',
      category: 'Medium',
      uiColor: '#FFFF00' // Yellow - Medium risk
    };
  } else {
    return {
      ratio: ratioValue,
      color: 'Red',
      category: 'High',
      uiColor: '#FF0000' // Red - High risk
    };
  }
};

/**
 * Parses ratio string to numeric value
 * 
 * @param ratioString - Ratio string (e.g., "100.00%", "95.50%")
 * @returns number - Numeric ratio value
 */
export const parseRatioString = (ratioString: string): number => {
  // Remove percentage sign and convert to number
  const numericValue = parseFloat(ratioString.replace('%', ''));
  return isNaN(numericValue) ? 0 : numericValue;
};

/**
 * Fetches defect to remark ratio data from the API
 * 
 * @param projectId - The unique ID of the project
 * @returns Promise<DefectToRemarkData> - Defect to remark ratio data
 * @throws DefectToRemarkError - When API request fails or returns error
 */
export const getDefectToRemarkRatio = async (projectId: number): Promise<DefectToRemarkData> => {
  try {
    const url = `${API_BASE_URL}/dashboard/defect-remark-ratio?projectId=${projectId}`;
    console.log('🚀 Fetching defect to remark ratio from API:', url);
    console.log('📊 Parameters - ProjectID:', projectId);

    // Add timeout and better error handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    // Make API request using fetch
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

    // Check if response is ok before parsing
    if (!response.ok) {
      console.error('❌ HTTP Error:', response.status, response.statusText);
      throw new DefectToRemarkError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        'http_error'
      );
    }

    // Parse JSON response
    const responseData: GetDefectToRemarkResponse = await response.json();
    console.log('📊 API Response Data:', responseData);

    // Check if response is successful
    if (responseData.status === 'success' && responseData.data) {
      console.log('✅ Defect to remark ratio retrieved successfully:', responseData.data.ratio);
      
      // Parse ratio and apply UI mapping
      const ratioValue = parseRatioString(responseData.data.ratio);
      const uiMapping = mapDefectToRemarkRatioToUI(ratioValue);
      
      // Return enhanced data with UI mapping
      return {
        ...responseData.data,
        color: uiMapping.color,
        category: uiMapping.category,
      };
    } else {
      // Handle API error response
      const errorMessage = responseData.message || 'Unknown API error';
      const statusCode = responseData.statusCode || 500;
      
      console.error('❌ API returned error:', errorMessage);
      throw new DefectToRemarkError(
        errorMessage,
        statusCode,
        responseData.status || 'failure'
      );
    }

  } catch (error) {
    console.error('💥 Error fetching defect to remark ratio:', error);

    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DefectToRemarkError(
        'Request timeout: Server took too long to respond. Please try again.',
        0,
        'timeout_error'
      );
    }

    // Handle network errors
    if (error instanceof TypeError || 
        (error instanceof Error && (
          error.message.includes('Network request failed') ||
          error.message.includes('fetch') ||
          error.message.includes('Failed to fetch')
        ))) {
      throw new DefectToRemarkError(
        'Network error: Unable to connect to server. Please check your internet connection.',
        0,
        'network_error'
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new DefectToRemarkError(
        'Invalid response format: Server returned invalid JSON.',
        0,
        'parse_error'
      );
    }

    // Handle other types of errors
    if (error instanceof DefectToRemarkError) {
      throw error;
    }

    // Unknown error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new DefectToRemarkError(
      `Unexpected error: ${errorMessage}. Please check your network connection and try again.`,
      0,
      'unknown_error'
    );
  }
};

/**
 * Debug function to test the defect to remark ratio API endpoint
 */
export const debugDefectToRemarkCall = async (projectId: number): Promise<void> => {
  console.log('🔧 === DEBUG DEFECT TO REMARK RATIO API CALL START ===');
  console.log('🔧 API URL:', `${API_BASE_URL}/dashboard/defect-remark-ratio?projectId=${projectId}`);
  console.log('🔧 Parameters - ProjectID:', projectId);
  console.log('🔧 Current time:', new Date().toISOString());
  
  try {
    const result = await getDefectToRemarkRatio(projectId);
    console.log('🔧 ✅ Defect to remark ratio API call successful!');
    console.log('🔧 Result:', JSON.stringify(result, null, 2));
    
    const ratioValue = parseRatioString(result.ratio);
    const uiMapping = mapDefectToRemarkRatioToUI(ratioValue);
    console.log('🔧 UI Mapping:', JSON.stringify(uiMapping, null, 2));
    
  } catch (error) {
    console.error('🔧 ❌ Defect to remark ratio API call failed:', error);
    if (error instanceof DefectToRemarkError) {
      console.error('🔧 Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        apiStatus: error.apiStatus
      });
    }
  }
  
  console.log('🔧 === DEBUG DEFECT TO REMARK RATIO API CALL END ===');
};

// Export default
export default {
  getDefectToRemarkRatio,
  mapDefectToRemarkRatioToUI,
  parseRatioString,
  debugDefectToRemarkCall,
  DefectToRemarkError,
};
