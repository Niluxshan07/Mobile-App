// Using React Native's built-in fetch API for Project Card Color API integration
// This approach doesn't require additional dependencies like axios

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
const REQUEST_TIMEOUT = 15000; // 15 seconds timeout

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Interface for project card color data
export interface ProjectCardColorData {
  projectId: number;
  projectName: string;
  availableRiskLevels: string[];
  projectCardColor: string;
}

// Interface for individual project risk assessment (from documentation)
export interface ProjectRiskAssessment {
  projectName: string;
  severityIndex: 'High' | 'Medium' | 'Low';
  reopenCount: 'High' | 'Medium' | 'Low';
  remarkRatio: 'High' | 'Medium' | 'Low';
  densityMeter: 'High' | 'Medium' | 'Low';
  status: 'High Risk' | 'Medium Risk' | 'Low Risk';
  colorCode: 'Red' | 'Yellow' | 'Green';
}

// API Response interface for success
export interface ProjectCardColorApiResponse {
  status: 'success';
  message: string;
  data: ProjectCardColorData;
  statusCode: 2000;
}

// API Response interface for failure
export interface ProjectCardColorApiErrorResponse {
  status: 'error';
  message: string;
  statusCode: 4000;
}

// Custom error class for API errors
export class ProjectCardColorApiError extends Error {
  public apiStatus: string;
  public statusCode: number;
  public originalMessage: string;

  constructor(apiStatus: string, statusCode: number, message: string) {
    super(message);
    this.name = 'ProjectCardColorApiError';
    this.apiStatus = apiStatus;
    this.statusCode = statusCode;
    this.originalMessage = message;
  }
}

// Function to get project card color from API using fetch
export const getProjectCardColor = async (projectId: number): Promise<ProjectCardColorData> => {
  const url = `${API_BASE_URL}/dashboard/project-card-color/${projectId}`;
  
  console.log('🎨 Making API request to:', url);
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
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response ok:', response.ok);
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData: ProjectCardColorApiErrorResponse = await response.json();
        throw new ProjectCardColorApiError(
          'project_not_found',
          errorData.statusCode || 4000,
          errorData.message || 'Project not found'
        );
      }
      
      throw new ProjectCardColorApiError(
        'http_error',
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const responseData: ProjectCardColorApiResponse = await response.json();
    console.log('📡 Raw API response:', JSON.stringify(responseData, null, 2));
    
    // Check if the response indicates success
    if (responseData.status !== 'success' || responseData.statusCode !== 2000) {
      throw new ProjectCardColorApiError(
        'api_error',
        responseData.statusCode || 4000,
        responseData.message || 'API returned non-success status'
      );
    }
    
    if (!responseData.data) {
      throw new ProjectCardColorApiError(
        'data_error',
        4001,
        'No data received from API'
      );
    }
    
    console.log('✅ Successfully parsed project card color data');
    console.log('🎨 Project:', responseData.data.projectName);
    console.log('🎨 Card Color:', responseData.data.projectCardColor);
    console.log('🎨 Risk Levels:', responseData.data.availableRiskLevels);
    
    return responseData.data;
    
  } catch (error: any) {
    console.error('❌ Error in getProjectCardColor:', error);
    
    if (error.name === 'AbortError') {
      throw new ProjectCardColorApiError(
        'timeout_error',
        408,
        'Request timeout - server took too long to respond'
      );
    }
    
    if (error instanceof ProjectCardColorApiError) {
      throw error;
    }
    
    if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
      throw new ProjectCardColorApiError(
        'network_error',
        0,
        'Network connection failed - please check your internet connection'
      );
    }
    
    throw new ProjectCardColorApiError(
      'unknown_error',
      500,
      error.message || 'Unknown error occurred'
    );
  }
};

// Helper function to convert gradient color to React Native style
export const convertGradientToRNStyle = (gradientColor: string): string => {
  // Convert Tailwind gradient classes to hex colors for React Native
  if (gradientColor.includes('red')) {
    return '#DC2626'; // Red
  } else if (gradientColor.includes('yellow') || gradientColor.includes('amber')) {
    return '#D97706'; // Yellow/Amber
  } else if (gradientColor.includes('green')) {
    return '#16A34A'; // Green
  } else if (gradientColor.includes('blue')) {
    return '#2563EB'; // Blue
  } else if (gradientColor.includes('purple')) {
    return '#9333EA'; // Purple
  } else if (gradientColor.includes('gray') || gradientColor.includes('grey')) {
    return '#6B7280'; // Gray
  }
  
  // Default fallback color
  return '#6B7280'; // Gray
};

// Helper function to get risk level color
export const getRiskLevelColor = (riskLevel: string): string => {
  switch (riskLevel.toLowerCase()) {
    case 'high':
      return '#DC2626'; // Red
    case 'medium':
      return '#D97706'; // Yellow
    case 'low':
      return '#16A34A'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

// Helper function to determine overall risk based on individual metrics
export const calculateOverallRisk = (
  severityIndex: string,
  reopenCount: string,
  remarkRatio: string,
  densityMeter: string
): { risk: string; color: string } => {
  const metrics = [severityIndex, reopenCount, remarkRatio, densityMeter];
  
  // If any metric is High -> Red (High Risk)
  if (metrics.some(metric => metric.toLowerCase() === 'high')) {
    return { risk: 'High Risk', color: 'Red' };
  }
  
  // If any metric is Medium -> Yellow (Medium Risk)
  if (metrics.some(metric => metric.toLowerCase() === 'medium')) {
    return { risk: 'Medium Risk', color: 'Yellow' };
  }
  
  // If all metrics are Low -> Green (Low Risk)
  return { risk: 'Low Risk', color: 'Green' };
};

// Helper function to format project card color for display
export const formatProjectCardColor = (colorData: ProjectCardColorData): string => {
  return convertGradientToRNStyle(colorData.projectCardColor);
};
