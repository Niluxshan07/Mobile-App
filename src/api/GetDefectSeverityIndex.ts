// Using React Native's built-in fetch API for Defect Severity Index API integration
// This approach doesn't require additional dependencies like axios

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
const REQUEST_TIMEOUT = 15000; // 15 seconds timeout

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Interface for DSI calculation data
export interface DefectSeverityIndexData {
  projectId: number;
  totalDefects: number;
  actualSeverityScore: number;
  maximumSeverityScore: number;
  dsiPercentage: number;
  interpretation: string;
}

// Interface for severity breakdown (for detailed analysis)
export interface SeverityBreakdown {
  severity: string;
  weight: number;
  defectCount: number;
  score: number; // defectCount * weight
}

// API Response interface for success
export interface DefectSeverityIndexApiResponse {
  status: 'Success';
  message: string;
  data: DefectSeverityIndexData;
  statusCode: 2000;
}

// API Response interface for failure
export interface DefectSeverityIndexApiErrorResponse {
  status: 'Failure';
  message: string;
  data: null;
  statusCode: 4000;
}

// Custom error class for API errors
export class DefectSeverityIndexApiError extends Error {
  public apiStatus: string;
  public statusCode: number;
  public originalMessage: string;

  constructor(apiStatus: string, statusCode: number, message: string) {
    super(message);
    this.name = 'DefectSeverityIndexApiError';
    this.apiStatus = apiStatus;
    this.statusCode = statusCode;
    this.originalMessage = message;
  }
}

// Function to get defect severity index from API using fetch
export const getDefectSeverityIndex = async (projectId: number): Promise<DefectSeverityIndexData> => {
  // Try the working endpoint first based on your example
  const url = `${API_BASE_URL}/dashboard/dsi/${projectId}`;
  
  console.log('📊 Making DSI API request to:', url);
  console.log('📊 Project ID:', projectId);
  
  try {
    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: DEFAULT_HEADERS,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log('📡 DSI Response status:', response.status);
    console.log('📡 DSI Response ok:', response.ok);
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData: DefectSeverityIndexApiErrorResponse = await response.json();
        throw new DefectSeverityIndexApiError(
          'no_defects_found',
          errorData.statusCode || 4000,
          errorData.message || 'No defects found for this project'
        );
      }
      
      throw new DefectSeverityIndexApiError(
        'http_error',
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const responseData: DefectSeverityIndexApiResponse = await response.json();
    console.log('📡 Raw DSI API response:', JSON.stringify(responseData, null, 2));
    
    // Check if the response indicates success
    if (responseData.status !== 'Success' || responseData.statusCode !== 2000) {
      throw new DefectSeverityIndexApiError(
        'api_error',
        responseData.statusCode || 4000,
        responseData.message || 'API returned non-success status'
      );
    }
    
    if (!responseData.data) {
      throw new DefectSeverityIndexApiError(
        'data_error',
        4001,
        'No data received from API'
      );
    }
    
    console.log('✅ Successfully parsed DSI data');
    console.log('📊 Project ID:', responseData.data.projectId);
    console.log('📊 Total Defects:', responseData.data.totalDefects);
    console.log('📊 DSI Percentage:', responseData.data.dsiPercentage + '%');
    console.log('📊 Interpretation:', responseData.data.interpretation);
    
    return responseData.data;
    
  } catch (error: any) {
    console.error('❌ Error in getDefectSeverityIndex:', error);
    
    if (error.name === 'AbortError') {
      throw new DefectSeverityIndexApiError(
        'timeout_error',
        408,
        'Request timeout - server took too long to respond'
      );
    }
    
    if (error instanceof DefectSeverityIndexApiError) {
      throw error;
    }
    
    if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
      throw new DefectSeverityIndexApiError(
        'network_error',
        0,
        'Network connection failed - please check your internet connection'
      );
    }
    
    throw new DefectSeverityIndexApiError(
      'unknown_error',
      500,
      error.message || 'Unknown error occurred'
    );
  }
};

// Helper function to get DSI interpretation color
export const getDSIInterpretationColor = (dsiPercentage: number): string => {
  if (dsiPercentage >= 0 && dsiPercentage <= 25) {
    return '#16A34A'; // Green - Excellent quality
  } else if (dsiPercentage >= 26 && dsiPercentage <= 50) {
    return '#D97706'; // Yellow - Good but some concern
  } else if (dsiPercentage >= 51 && dsiPercentage <= 75) {
    return '#DC2626'; // Red - Significant risk
  } else if (dsiPercentage >= 76 && dsiPercentage <= 100) {
    return '#7C2D12'; // Dark Red - Critical risk
  }
  return '#6B7280'; // Gray - Unknown
};

// Helper function to get DSI interpretation text
export const getDSIInterpretationText = (dsiPercentage: number): string => {
  if (dsiPercentage >= 0 && dsiPercentage <= 25) {
    return 'Excellent quality';
  } else if (dsiPercentage >= 26 && dsiPercentage <= 50) {
    return 'Good but some concern';
  } else if (dsiPercentage >= 51 && dsiPercentage <= 75) {
    return 'Significant risk';
  } else if (dsiPercentage >= 76 && dsiPercentage <= 100) {
    return 'Critical risk';
  }
  return 'Unknown';
};

// Helper function to get DSI risk level
export const getDSIRiskLevel = (dsiPercentage: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
  if (dsiPercentage >= 0 && dsiPercentage <= 25) {
    return 'Low';
  } else if (dsiPercentage >= 26 && dsiPercentage <= 50) {
    return 'Medium';
  } else if (dsiPercentage >= 51 && dsiPercentage <= 75) {
    return 'High';
  } else if (dsiPercentage >= 76 && dsiPercentage <= 100) {
    return 'Critical';
  }
  return 'Medium'; // Default fallback
};

// Helper function to format DSI percentage for display
export const formatDSIPercentage = (dsiPercentage: number): string => {
  return `${dsiPercentage.toFixed(1)}%`;
};

// Helper function to format DSI data for UI display
export const formatDSIForDisplay = (dsiData: DefectSeverityIndexData) => {
  return {
    projectId: dsiData.projectId,
    totalDefects: dsiData.totalDefects,
    actualScore: dsiData.actualSeverityScore,
    maxScore: dsiData.maximumSeverityScore,
    percentage: formatDSIPercentage(dsiData.dsiPercentage),
    interpretation: dsiData.interpretation,
    color: getDSIInterpretationColor(dsiData.dsiPercentage),
    riskLevel: getDSIRiskLevel(dsiData.dsiPercentage)
  };
};
