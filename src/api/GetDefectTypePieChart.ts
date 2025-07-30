// Using React Native's built-in fetch API for Defect Type Pie Chart API integration
// This approach doesn't require additional dependencies like axios

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
const REQUEST_TIMEOUT = 15000; // 15 seconds timeout

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Interface for individual defect type data
export interface DefectTypeItem {
  defectType: string;
  defectCount: number;
  percentage: number;
}

// Interface for defect type statistics data
export interface DefectTypeData {
  defectTypes: DefectTypeItem[];
  totalDefectCount: number;
  mostCommonDefectType: string;
  mostCommonDefectCount: number;
}

// API Response interface for success
export interface DefectTypeApiResponse {
  status: 'success';
  message: string;
  data: DefectTypeData;
  statusCode: 2000;
}

// API Response interface for failure
export interface DefectTypeApiErrorResponse {
  status: 'failure';
  message: string;
  data: null;
  statusCode: 4000;
}

// Custom error class for API errors
export class DefectTypeApiError extends Error {
  public apiStatus: string;
  public statusCode: number;
  public originalMessage: string;

  constructor(apiStatus: string, statusCode: number, message: string) {
    super(message);
    this.name = 'DefectTypeApiError';
    this.apiStatus = apiStatus;
    this.statusCode = statusCode;
    this.originalMessage = message;
  }
}

// Function to get defect type statistics from API using fetch
export const getDefectTypeStatistics = async (projectId: number): Promise<DefectTypeData> => {
  const url = `${API_BASE_URL}/dashboard/defect-type/${projectId}`;
  
  console.log('📊 Making Defect Type API request to:', url);
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
    
    console.log('📡 Defect Type Response status:', response.status);
    console.log('📡 Defect Type Response ok:', response.ok);
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData: DefectTypeApiErrorResponse = await response.json();
        throw new DefectTypeApiError(
          'no_defects_found',
          errorData.statusCode || 4000,
          errorData.message || 'No defects found for this project'
        );
      }
      
      throw new DefectTypeApiError(
        'http_error',
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const responseData: DefectTypeApiResponse = await response.json();
    console.log('📡 Raw Defect Type API response:', JSON.stringify(responseData, null, 2));
    
    // Check if the response indicates success
    if (responseData.status !== 'success' || responseData.statusCode !== 2000) {
      throw new DefectTypeApiError(
        'api_error',
        responseData.statusCode || 4000,
        responseData.message || 'API returned non-success status'
      );
    }
    
    if (!responseData.data) {
      throw new DefectTypeApiError(
        'data_error',
        4001,
        'No data received from API'
      );
    }
    
    console.log('✅ Successfully parsed defect type data');
    console.log('📊 Total Defects:', responseData.data.totalDefectCount);
    console.log('📊 Most Common Type:', responseData.data.mostCommonDefectType);
    console.log('📊 Defect Types Count:', responseData.data.defectTypes.length);
    
    return responseData.data;
    
  } catch (error: any) {
    console.error('❌ Error in getDefectTypeStatistics:', error);
    
    if (error.name === 'AbortError') {
      throw new DefectTypeApiError(
        'timeout_error',
        408,
        'Request timeout - server took too long to respond'
      );
    }
    
    if (error instanceof DefectTypeApiError) {
      throw error;
    }
    
    if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
      throw new DefectTypeApiError(
        'network_error',
        0,
        'Network connection failed - please check your internet connection'
      );
    }
    
    throw new DefectTypeApiError(
      'unknown_error',
      500,
      error.message || 'Unknown error occurred'
    );
  }
};

// Helper function to get color for defect type (for pie chart)
// 🎨 VIBRANT COLORS: Matching the bright colors from your pie chart screenshot
export const getDefectTypeColor = (defectType: string, index: number): string => {
  const colors = [
    '#4285F4', // Bright Blue (like Configurations)
    '#FF5722', // Bright Red-Orange (like Project Management)
    '#FFC107', // Bright Yellow (like Bench)
    '#F44336', // Bright Red (like Defects)
    '#E91E63', // Bright Pink (like Test Cases)
    '#00BCD4', // Bright Cyan (like Employee)
    '#FF9800', // Bright Orange (like Releases)
    '#4CAF50', // Bright Green (like Main Template)
    '#9C27B0', // Bright Purple (like Project)
    '#FF6B35', // Vivid Orange
    '#00E676', // Electric Green
    '#2196F3', // Electric Blue
    '#FFEB3B', // Bright Yellow
    '#E040FB', // Bright Magenta
    '#00FFFF', // Cyan
  ];
  
  // Map specific defect types to vibrant colors (matching your screenshot)
  const typeColorMap: { [key: string]: string } = {
    'functionality': '#F44336',    // Bright Red (like Defects in screenshot)
    'ui': '#00BCD4',              // Bright Cyan (like Employee in screenshot)
    'ui/ux': '#00BCD4',           // Bright Cyan (like Employee in screenshot)
    'usability': '#4285F4',       // Bright Blue (like Configurations in screenshot)
    'validation': '#4CAF50',      // Bright Green (like Main Template in screenshot)
    'performance': '#FFC107',     // Bright Yellow (like Bench in screenshot)
    'security': '#E91E63',        // Bright Pink (like Test Cases in screenshot)
    'compatibility': '#FF9800',   // Bright Orange (like Releases in screenshot)
    'localization': '#9C27B0',    // Bright Purple (like Project in screenshot)
    'accessibility': '#FF5722',   // Bright Red-Orange (like Project Management in screenshot)
  };
  
  const normalizedType = defectType.toLowerCase().replace(/[^a-z]/g, '');
  const selectedColor = typeColorMap[normalizedType] || colors[index % colors.length];

  console.log('🎨 Defect Type Color:', {
    defectType: defectType,
    normalizedType: normalizedType,
    index: index,
    selectedColor: selectedColor,
    note: 'Using vibrant colors matching your screenshot pie chart'
  });

  return selectedColor;
};

// Helper function to format defect type data for pie chart
export const formatDefectTypeForPieChart = (defectTypeData: DefectTypeData) => {
  return defectTypeData.defectTypes.map((item, index) => ({
    name: item.defectType,
    population: item.defectCount,
    color: getDefectTypeColor(item.defectType, index),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
    percentage: item.percentage,
  }));
};

// Helper function to get summary statistics
export const getDefectTypeSummary = (defectTypeData: DefectTypeData) => {
  return {
    totalDefects: defectTypeData.totalDefectCount,
    typeCount: defectTypeData.defectTypes.length,
    mostCommon: {
      type: defectTypeData.mostCommonDefectType,
      count: defectTypeData.mostCommonDefectCount,
      percentage: defectTypeData.defectTypes.find(
        item => item.defectType === defectTypeData.mostCommonDefectType
      )?.percentage || 0
    },
    distribution: defectTypeData.defectTypes.map(item => ({
      type: item.defectType,
      count: item.defectCount,
      percentage: item.percentage.toFixed(1)
    }))
  };
};

// Helper function to validate defect type data
export const validateDefectTypeData = (data: DefectTypeData): boolean => {
  if (!data || !data.defectTypes || !Array.isArray(data.defectTypes)) {
    return false;
  }
  
  if (data.totalDefectCount <= 0) {
    return false;
  }
  
  // Check if percentages add up to approximately 100%
  const totalPercentage = data.defectTypes.reduce((sum, item) => sum + item.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 1) { // Allow 1% tolerance
    console.warn('⚠️ Defect type percentages do not add up to 100%:', totalPercentage);
  }
  
  return true;
};
