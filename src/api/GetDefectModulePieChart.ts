// Using React Native's built-in fetch API for Defect Module Pie Chart API integration
// This approach doesn't require additional dependencies like axios

// Base API configuration
const API_BASE_URL = 'http://34.56.162.48:8087/api/v1';
const REQUEST_TIMEOUT = 15000; // 15 seconds timeout

// Default headers for API requests
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
};

// Interface for individual module data
export interface DefectModuleItem {
  moduleId: number;
  name: string;
  value: number;
  percentage: number;
}

// API Response interface for success
export interface DefectModuleApiResponse {
  status: 'success';
  message: string;
  data: DefectModuleItem[];
  statusCode: 2000;
}

// API Response interface for failure
export interface DefectModuleApiErrorResponse {
  status: 'failure';
  message: string;
  data: null;
  statusCode: 4000;
}

// Custom error class for API errors
export class DefectModuleApiError extends Error {
  public apiStatus: string;
  public statusCode: number;
  public originalMessage: string;

  constructor(apiStatus: string, statusCode: number, message: string) {
    super(message);
    this.name = 'DefectModuleApiError';
    this.apiStatus = apiStatus;
    this.statusCode = statusCode;
    this.originalMessage = message;
  }
}

// Function to get defect module statistics from API using fetch
export const getDefectModuleStatistics = async (projectId: number): Promise<DefectModuleItem[]> => {
  const url = `${API_BASE_URL}/dashboard/module?projectId=${projectId}`;
  
  console.log('📊 Making Defect Module API request to:', url);
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
    
    console.log('📡 Defect Module Response status:', response.status);
    console.log('📡 Defect Module Response ok:', response.ok);
    
    if (!response.ok) {
      if (response.status === 400) {
        const errorData: DefectModuleApiErrorResponse = await response.json();
        throw new DefectModuleApiError(
          'no_defects_found',
          errorData.statusCode || 4000,
          errorData.message || 'No defects found for the given project'
        );
      }
      
      throw new DefectModuleApiError(
        'http_error',
        response.status,
        `HTTP ${response.status}: ${response.statusText}`
      );
    }
    
    const responseData: DefectModuleApiResponse = await response.json();
    console.log('📡 Raw Defect Module API response:', JSON.stringify(responseData, null, 2));
    
    // Check if the response indicates success
    if (responseData.status !== 'success' || responseData.statusCode !== 2000) {
      throw new DefectModuleApiError(
        'api_error',
        responseData.statusCode || 4000,
        responseData.message || 'API returned non-success status'
      );
    }
    
    if (!responseData.data || !Array.isArray(responseData.data)) {
      throw new DefectModuleApiError(
        'data_error',
        4001,
        'No data received from API or data is not an array'
      );
    }
    
    console.log('✅ Successfully parsed defect module data');
    console.log('📊 Total Modules:', responseData.data.length);
    console.log('📊 Total Defects:', responseData.data.reduce((sum, item) => sum + item.value, 0));
    
    return responseData.data;
    
  } catch (error: any) {
    console.error('❌ Error in getDefectModuleStatistics:', error);
    
    if (error.name === 'AbortError') {
      throw new DefectModuleApiError(
        'timeout_error',
        408,
        'Request timeout - server took too long to respond'
      );
    }
    
    if (error instanceof DefectModuleApiError) {
      throw error;
    }
    
    if (error.message?.includes('Network request failed') || error.code === 'NETWORK_ERROR') {
      throw new DefectModuleApiError(
        'network_error',
        0,
        'Network connection failed - please check your internet connection'
      );
    }
    
    throw new DefectModuleApiError(
      'unknown_error',
      500,
      error.message || 'Unknown error occurred'
    );
  }
};

// Helper function to get color for module (for pie chart)
// 🎨 VIBRANT COLORS: Exactly matching your screenshot pie chart colors
export const getDefectModuleColor = (moduleName: string, index: number): string => {
  const colors = [
    '#4285F4', // Bright Blue (Configurations - 15.35%)
    '#FF5722', // Bright Red-Orange (Project Management - 11.94%)
    '#FFC107', // Bright Yellow (Bench - 12.12%)
    '#F44336', // Bright Red (Defects - 14.95%)
    '#E91E63', // Bright Pink (Test Cases - 12.12%)
    '#00BCD4', // Bright Cyan (Employee - 14.55%)
    '#FF9800', // Bright Orange (Releases - 7.07%)
    '#9C27B0', // Bright Purple (Project - 5.25%)
    '#4CAF50', // Bright Green (Main Template - 0.81%)
    '#FF6B35', // Vivid Orange (Dashboard - 3.94%)
    '#00E676', // Electric Green
    '#2196F3', // Electric Blue
    '#FFEB3B', // Bright Yellow
    '#E040FB', // Bright Magenta
    '#00FFFF', // Cyan
    '#8BC34A', // Light Green
    '#FF7043', // Deep Orange
    '#AB47BC', // Purple
    '#26C6DA', // Light Blue
    '#FFCA28', // Amber
  ];
  
  // Map specific module names to exact colors from your screenshot
  const moduleColorMap: { [key: string]: string } = {
    'dashboard': '#FF6B35',        // Vivid Orange (Dashboard - 3.94%)
    'employee': '#00BCD4',         // Bright Cyan (Employee - 14.55%)
    'bench': '#FFC107',            // Bright Yellow (Bench - 12.12%)
    'configurations': '#4285F4',   // Bright Blue (Configurations - 15.35%)
    'project management': '#FF5722', // Bright Red-Orange (Project Management - 11.94%)
    'project': '#9C27B0',          // Bright Purple (Project - 5.25%)
    'releases': '#FF9800',         // Bright Orange (Releases - 7.07%)
    'defects': '#F44336',          // Bright Red (Defects - 14.95%)
    'test cases': '#E91E63',       // Bright Pink (Test Cases - 12.12%)
    'main template': '#4CAF50',    // Bright Green (Main Template - 0.81%)
    'user management': '#00E676',  // Electric Green
    'reports': '#2196F3',          // Electric Blue
    'settings': '#FFEB3B',         // Bright Yellow
    'notifications': '#E040FB',    // Bright Magenta
    'audit': '#00FFFF',            // Cyan
  };
  
  const normalizedName = moduleName.toLowerCase().replace(/[^a-z\s]/g, '').trim();
  const selectedColor = moduleColorMap[normalizedName] || colors[index % colors.length];

  console.log('🎨 Module Color:', {
    moduleName: moduleName,
    normalizedName: normalizedName,
    index: index,
    selectedColor: selectedColor,
    note: 'Using vibrant colors matching your screenshot pie chart'
  });

  return selectedColor;
};

// Helper function to format defect module data for pie chart
export const formatDefectModuleForPieChart = (moduleData: DefectModuleItem[]) => {
  return moduleData.map((item, index) => ({
    name: item.name,
    population: item.value,
    color: getDefectModuleColor(item.name, index),
    legendFontColor: '#7F7F7F',
    legendFontSize: 12,
    percentage: item.percentage,
    moduleId: item.moduleId,
  }));
};

// Helper function to get summary statistics
export const getDefectModuleSummary = (moduleData: DefectModuleItem[]) => {
  const totalDefects = moduleData.reduce((sum, item) => sum + item.value, 0);
  const mostCommonModule = moduleData.length > 0 ? moduleData.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  ) : null;

  return {
    totalDefects,
    moduleCount: moduleData.length,
    mostCommon: mostCommonModule ? {
      name: mostCommonModule.name,
      count: mostCommonModule.value,
      percentage: mostCommonModule.percentage,
      moduleId: mostCommonModule.moduleId
    } : null,
    distribution: moduleData.map(item => ({
      moduleId: item.moduleId,
      name: item.name,
      count: item.value,
      percentage: item.percentage.toFixed(1)
    })).sort((a, b) => b.count - a.count) // Sort by count descending
  };
};

// Helper function to validate defect module data
export const validateDefectModuleData = (data: DefectModuleItem[]): boolean => {
  if (!data || !Array.isArray(data) || data.length === 0) {
    return false;
  }
  
  // Check if all required fields are present
  for (const item of data) {
    if (typeof item.moduleId !== 'number' || 
        typeof item.name !== 'string' || 
        typeof item.value !== 'number' || 
        typeof item.percentage !== 'number') {
      return false;
    }
    
    if (item.value < 0 || item.percentage < 0) {
      return false;
    }
  }
  
  // Check if percentages add up to approximately 100%
  const totalPercentage = data.reduce((sum, item) => sum + item.percentage, 0);
  if (Math.abs(totalPercentage - 100) > 1) { // Allow 1% tolerance
    console.warn('⚠️ Module percentages do not add up to 100%:', totalPercentage);
  }
  
  return true;
};

// Helper function to sort modules by different criteria
export const sortDefectModules = (
  moduleData: DefectModuleItem[], 
  sortBy: 'name' | 'value' | 'percentage' | 'moduleId' = 'value',
  ascending: boolean = false
): DefectModuleItem[] => {
  const sorted = [...moduleData].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'value':
        comparison = a.value - b.value;
        break;
      case 'percentage':
        comparison = a.percentage - b.percentage;
        break;
      case 'moduleId':
        comparison = a.moduleId - b.moduleId;
        break;
    }
    
    return ascending ? comparison : -comparison;
  });
  
  return sorted;
};
