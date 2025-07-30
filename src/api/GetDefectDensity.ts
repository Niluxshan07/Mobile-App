// Using React Native's built-in fetch for consistency with existing API integration

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';

// Defect Density interface based on API response
export interface DefectDensityData {
  defects: number;
  projectId: number;
  defectDensity: number;
  color: string;
  meaning: string;
  range: string;
  projectName: string;
  clientName: string;
  kloc: number;
}

// API Response interface
export interface GetDefectDensityResponse {
  status: 'success' | 'failure';
  message: string;
  data: DefectDensityData | null;
  statusCode: number;
}

// Error response interface
export interface DefectDensityApiError {
  status: 'failure';
  message: string;
  statusCode: number;
}

// Custom error class for API errors
export class DefectDensityError extends Error {
  public statusCode: number;
  public apiStatus: string;

  constructor(message: string, statusCode: number, apiStatus: string) {
    super(message);
    this.name = 'DefectDensityError';
    this.statusCode = statusCode;
    this.apiStatus = apiStatus;
  }
}

// UI Color mapping based on defect density ranges
export interface DefectDensityUIMapping {
  value: number;
  color: string;
  meaning: string;
  range: string;
  uiColor: string; // Color for UI display
}

/**
 * Gets theme-aware color for defect density (same as Home screen project cards)
 *
 * @param defectDensity - The defect density value
 * @param isDarkTheme - Whether dark theme is active
 * @returns string - The appropriate color for the theme
 */
export const getDefectDensityColor = (defectDensity: number, isDarkTheme: boolean = false): string => {
  if (defectDensity >= 0 && defectDensity < 7) {
    // Green range (0-7) - same as Low Risk from Home screen
    return isDarkTheme ? '#66BB6A' : '#22C55E';
  } else if (defectDensity >= 7 && defectDensity < 10) {
    // Orange range (7-10) - same as Medium Risk from Home screen
    return isDarkTheme ? '#FF9800' : '#F59E0B';
  } else {
    // Red range (10-20+) - same as High Risk from Home screen
    return isDarkTheme ? '#EF5350' : '#EF4444';
  }
};

/**
 * Maps defect density value to UI colors and meanings
 *
 * @param defectDensity - The calculated defect density value
 * @returns DefectDensityUIMapping - UI mapping object
 */
export const mapDefectDensityToUI = (defectDensity: number): DefectDensityUIMapping => {
  // 🎨 COLOR MATCHING: Using EXACT same colors and ranges as Home screen project cards
  // 0-7 Green, 7-10 Orange, 10-20 Red (same as Home screen project status)

  if (defectDensity >= 0 && defectDensity < 7) {
    // GREEN RANGE (0-7) - Same as Low Risk from Home screen
    let meaning = '';
    if (defectDensity < 2) {
      meaning = 'Excellent Quality';
    } else if (defectDensity < 4) {
      meaning = 'Very Good Quality';
    } else if (defectDensity < 6) {
      meaning = 'Good Quality';
    } else {
      meaning = 'Acceptable Quality';
    }

    return {
      value: defectDensity,
      color: 'Green',
      meaning: meaning,
      range: '0 to 7',
      uiColor: '#22C55E' // Same as Low Risk from Home screen (light theme)
    };
  } else if (defectDensity >= 7 && defectDensity < 10) {
    // ORANGE RANGE (7-10) - Same as Medium Risk from Home screen
    return {
      value: defectDensity,
      color: 'Orange',
      meaning: 'Caution Required',
      range: '7 to 10',
      uiColor: '#F59E0B' // Same as Medium Risk from Home screen (light theme)
    };
  } else {
    // RED RANGE (10-20+) - Same as High Risk from Home screen
    let meaning = '';
    if (defectDensity < 15) {
      meaning = 'High Risk';
    } else if (defectDensity < 18) {
      meaning = 'Critical Risk';
    } else if (defectDensity <= 20) {
      meaning = 'Severe Risk';
    } else {
      meaning = 'Extreme Risk';
    }

    return {
      value: defectDensity,
      color: 'Red',
      meaning: meaning,
      range: '10 to 20+',
      uiColor: '#EF4444' // Same as High Risk from Home screen (light theme)
    };
  }
};

/**
 * Fetches defect density data from the API
 * 
 * @param projectId - The unique ID of the project
 * @param kloc - Kilo Lines of Code
 * @returns Promise<DefectDensityData> - Defect density data
 * @throws DefectDensityError - When API request fails or returns error
 */
export const getDefectDensity = async (projectId: number, kloc: number): Promise<DefectDensityData> => {
  try {
    const url = `${API_BASE_URL}/dashboard/defect-density/${projectId}?kloc=${kloc}`;
    console.log('🚀 Fetching defect density from API:', url);
    console.log('📊 Parameters - ProjectID:', projectId, 'KLOC:', kloc);

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
      throw new DefectDensityError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        'http_error'
      );
    }

    // Parse JSON response
    const responseData: GetDefectDensityResponse = await response.json();
    console.log('📊 API Response Data:', responseData);

    // Check if response is successful
    if (responseData.status === 'success' && responseData.data) {
      console.log('✅ Defect density retrieved successfully:', responseData.data.defectDensity);
      
      // Apply UI color mapping
      const uiMapping = mapDefectDensityToUI(responseData.data.defectDensity);
      
      // Return enhanced data with UI mapping
      return {
        ...responseData.data,
        color: uiMapping.color,
        meaning: uiMapping.meaning,
        range: uiMapping.range,
      };
    } else {
      // Handle API error response
      const errorMessage = responseData.message || 'Unknown API error';
      const statusCode = responseData.statusCode || 500;
      
      console.error('❌ API returned error:', errorMessage);
      throw new DefectDensityError(
        errorMessage,
        statusCode,
        responseData.status || 'failure'
      );
    }

  } catch (error) {
    console.error('💥 Error fetching defect density:', error);

    // Handle AbortError (timeout)
    if (error instanceof Error && error.name === 'AbortError') {
      throw new DefectDensityError(
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
      throw new DefectDensityError(
        'Network error: Unable to connect to server. Please check your internet connection.',
        0,
        'network_error'
      );
    }

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      throw new DefectDensityError(
        'Invalid response format: Server returned invalid JSON.',
        0,
        'parse_error'
      );
    }

    // Handle other types of errors
    if (error instanceof DefectDensityError) {
      throw error;
    }

    // Unknown error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new DefectDensityError(
      `Unexpected error: ${errorMessage}. Please check your network connection and try again.`,
      0,
      'unknown_error'
    );
  }
};

/**
 * Debug function to test the defect density API endpoint
 */
export const debugDefectDensityCall = async (projectId: number, kloc: number): Promise<void> => {
  console.log('🔧 === DEBUG DEFECT DENSITY API CALL START ===');
  console.log('🔧 API URL:', `${API_BASE_URL}/dashboard/defect-density/${projectId}?kloc=${kloc}`);
  console.log('🔧 Parameters - ProjectID:', projectId, 'KLOC:', kloc);
  console.log('🔧 Current time:', new Date().toISOString());
  
  try {
    const result = await getDefectDensity(projectId, kloc);
    console.log('🔧 ✅ Defect density API call successful!');
    console.log('🔧 Result:', JSON.stringify(result, null, 2));
    
    const uiMapping = mapDefectDensityToUI(result.defectDensity);
    console.log('🔧 UI Mapping:', JSON.stringify(uiMapping, null, 2));
    
  } catch (error) {
    console.error('🔧 ❌ Defect density API call failed:', error);
    if (error instanceof DefectDensityError) {
      console.error('🔧 Error details:', {
        message: error.message,
        statusCode: error.statusCode,
        apiStatus: error.apiStatus
      });
    }
  }
  
  console.log('🔧 === DEBUG DEFECT DENSITY API CALL END ===');
};

// Export default
export default {
  getDefectDensity,
  mapDefectDensityToUI,
  getDefectDensityColor,
  debugDefectDensityCall,
  DefectDensityError,
};
