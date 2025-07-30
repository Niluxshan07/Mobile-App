import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  Image,
  PanResponder,
  Animated,
  BackHandler,
  ActivityIndicator,
  Alert,
} from 'react-native';
import RNSpeedometer from 'react-native-speedometer';
import { useThemedStyles, useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import DefectTypeDistribution from '../components/DefectTypeDistribution';
import DefectsByModuleChart from '../components/DefectsByModuleChart';
import { getProjects, transformProjectsForApp, ProjectData, ProjectApiError, testNetworkConnectivity, checkApiHealth } from '../api/GetProject';
import { getDefectDensity, DefectDensityData, DefectDensityError, mapDefectDensityToUI, getDefectDensityColor } from '../api/GetDefectDensity';
import { getDefectToRemarkRatio, DefectToRemarkData, DefectToRemarkError } from '../api/GetDefectToRemark';
import { getSeveritySummary, SeveritySummaryData, SeveritySummaryApiError, getSeverityColor, getStatusColor as getApiStatusColor, getAvailableStatuses } from '../api/GetSeveritySummary';
import { getDefectSeverityIndex, DefectSeverityIndexData, DefectSeverityIndexApiError, getDSIInterpretationColor, formatDSIForDisplay } from '../api/GetDefectSeverityIndex';
import { getDefectTypeStatistics, DefectTypeData, DefectTypeApiError, formatDefectTypeForPieChart, getDefectTypeSummary } from '../api/GetDefectTypePieChart';
import { getDefectModuleStatistics, DefectModuleItem, DefectModuleApiError, formatDefectModuleForPieChart, getDefectModuleSummary } from '../api/GetDefectModulePieChart';
import { getProjectCardColor, ProjectCardColorData, ProjectCardColorApiError } from '../api/GetProjectCardColor';

const { height } = Dimensions.get('window');





// DefectDensityMeter Component Interface
interface DefectDensityMeterProps {
  totalDefects: number;
  totalLinesOfCode: number;
  styles: any;
  apiData?: DefectDensityData | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  isDarkTheme?: boolean; // Add theme support for color matching
}

// DefectToRemarkRatio Component Interface
interface DefectToRemarkRatioProps {
  styles: any;
  apiData?: DefectToRemarkData | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  defaultDefects?: number;
  defaultRemarks?: number;
  isDarkTheme?: boolean; // Add theme support for color matching
}

// DefectDensityMeter Component with KLOC calculation logic and API integration
const DefectDensityMeter: React.FC<DefectDensityMeterProps> = ({
  totalDefects,
  totalLinesOfCode,
  styles,
  apiData,
  isLoading,
  error,
  onRetry,
  isDarkTheme = false
}) => {
  // Calculate defect density per KLOC (thousand lines of code) - fallback calculation
  const calculateDefectDensity = (defects: number, loc: number): number => {
    if (loc === 0) return 0;
    return (defects / loc) * 1000; // Defects per 1000 lines of code
  };

  // Use API data if available, otherwise use local calculation
  const defectDensity = apiData ? apiData.defectDensity : calculateDefectDensity(totalDefects, totalLinesOfCode);
  const densityMeaning = apiData ? apiData.meaning : 'Calculated locally';

  console.log('📊 Defect Density Meter:', {
    defectDensity: defectDensity,
    range: '0-20',
    meaning: densityMeaning,
    source: apiData ? 'API' : 'Calculated',
    colorRange: defectDensity < 7 ? 'Green (0-7)' : defectDensity < 10 ? 'Orange (7-10)' : 'Red (10-20)',
    color: getDefectDensityColor(defectDensity, isDarkTheme),
    note: 'Using same colors as Home screen project cards'
  });
  // Speedometer labels using EXACT same colors as Home screen project cards
  // 🎨 COLOR MATCHING: 0-7 Green, 7-10 Orange, 10-20 Red (same as Home screen)
  const getSpeedometerColor = (value: number, isDarkTheme: boolean) => {
    if (value >= 0 && value < 7) {
      // Green range (0-7) - same as Low Risk from Home screen
      return isDarkTheme ? '#66BB6A' : '#22C55E';
    } else if (value >= 7 && value < 10) {
      // Orange range (7-10) - same as Medium Risk from Home screen
      return isDarkTheme ? '#FF9800' : '#F59E0B';
    } else {
      // Red range (10-20) - same as High Risk from Home screen
      return isDarkTheme ? '#EF5350' : '#EF4444';
    }
  };

  const speedometerLabels = [
    {
      name: '0',
      labelColor: getSpeedometerColor(0, isDarkTheme),
      activeBarColor: getSpeedometerColor(0, isDarkTheme),
    },
    {
      name: '2',
      labelColor: getSpeedometerColor(2, isDarkTheme),
      activeBarColor: getSpeedometerColor(2, isDarkTheme),
    },
    {
      name: '4',
      labelColor: getSpeedometerColor(4, isDarkTheme),
      activeBarColor: getSpeedometerColor(4, isDarkTheme),
    },
    {
      name: '6',
      labelColor: getSpeedometerColor(6, isDarkTheme),
      activeBarColor: getSpeedometerColor(6, isDarkTheme),
    },
    {
      name: '7',
      labelColor: getSpeedometerColor(7, isDarkTheme),
      activeBarColor: getSpeedometerColor(7, isDarkTheme),
    },
    {
      name: '8',
      labelColor: getSpeedometerColor(8, isDarkTheme),
      activeBarColor: getSpeedometerColor(8, isDarkTheme),
    },
    {
      name: '10',
      labelColor: getSpeedometerColor(10, isDarkTheme),
      activeBarColor: getSpeedometerColor(10, isDarkTheme),
    },
    {
      name: '12',
      labelColor: getSpeedometerColor(12, isDarkTheme),
      activeBarColor: getSpeedometerColor(12, isDarkTheme),
    },
    {
      name: '15',
      labelColor: getSpeedometerColor(15, isDarkTheme),
      activeBarColor: getSpeedometerColor(15, isDarkTheme),
    },
    {
      name: '20',
      labelColor: getSpeedometerColor(20, isDarkTheme),
      activeBarColor: getSpeedometerColor(20, isDarkTheme),
    },
  ];

  return (
    <View style={styles.densityMeterContainer}>
      <Text style={styles.densityTitle}>
        Defect Density per KLOC
        {apiData && (
          <Text style={styles.apiDataIndicator}> • Live Data</Text>
        )}
        {!apiData && (
          <Text style={styles.localDataIndicator}> • Calculated</Text>
        )}
      </Text>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading density data...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>⚠️ {error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Speedometer Component */}
      <View style={styles.speedometerWrapper}>
        <RNSpeedometer
          value={defectDensity}
          size={200}
          defaultValue={3.5}
          minValue={0}
          maxValue={20}
          easeDuration={500}
          labels={speedometerLabels}
          wrapperStyle={styles.speedometerWrapperStyle}
          outerCircleStyle={styles.outerCircleStyle}
          halfCircleStyle={styles.halfCircleStyle}
          imageWrapperStyle={styles.imageWrapperStyle}
          imageStyle={styles.imageStyle}
          innerCircleStyle={styles.innerCircleStyle}
          labelWrapperStyle={styles.labelWrapperStyle}
          labelStyle={styles.labelStyle}
          labelNoteStyle={styles.labelNoteStyle}
        />
      </View>

      {/* Enhanced Details with API Data */}
      <View style={styles.klocDetailsContainer}>
        <View style={styles.klocDetailRow}>
          <Text style={styles.klocDetailLabel}>Density:</Text>
          <Text style={[
            styles.densityResultValue,
            { color: getDefectDensityColor(defectDensity, isDarkTheme) }
          ]}>
            {defectDensity.toFixed(1)}
          </Text>
        </View>

        <View style={styles.klocDetailRow}>
          <Text style={styles.klocDetailLabel}>Status:</Text>
          <Text style={[
            styles.klocDetailValue,
            { color: getDefectDensityColor(defectDensity, isDarkTheme) }
          ]}>
            {densityMeaning}
          </Text>
        </View>
      </View>
    </View>
  );
};

// DefectToRemarkRatio Component with API integration
const DefectToRemarkRatio: React.FC<DefectToRemarkRatioProps> = ({
  styles,
  apiData,
  isLoading,
  error,
  onRetry,
  defaultDefects = 85,
  defaultRemarks = 142,
  isDarkTheme = false
}) => {
  // Use API data if available, otherwise use default values
  const defects = apiData ? apiData.defects : defaultDefects;
  const remarks = apiData ? apiData.remarks : defaultRemarks;
  const ratio = apiData ? apiData.ratio : `${((remarks / defects) * 100).toFixed(2)}%`;
  const category = apiData ? apiData.category : 'Medium';

  // Calculate ratio for display
  const ratioValue = defects > 0 ? (remarks / defects).toFixed(2) : '0.00';

  // Get UI color based on category - USING SAME COLORS AS HOME SCREEN PROJECT STATUS
  const getCategoryColor = (cat: string, isDarkTheme: boolean = false) => {
    let color = '';

    switch (cat.toLowerCase()) {
      case 'low':
        // Use same colors as Low Risk from Home screen
        color = isDarkTheme ? '#66BB6A' : '#22C55E'; // Green (same as Home screen)
        break;
      case 'medium':
        // Use same colors as Medium Risk from Home screen
        color = isDarkTheme ? '#FF9800' : '#F59E0B'; // Orange/Yellow (same as Home screen)
        break;
      case 'high':
        // Use same colors as High Risk from Home screen
        color = isDarkTheme ? '#EF5350' : '#EF4444'; // Red (same as Home screen)
        break;
      default:
        // Default to medium risk color
        color = isDarkTheme ? '#FF9800' : '#F59E0B'; // Orange/Yellow
        break;
    }

    console.log('🎨 Defect to Remark Ratio color matching:', {
      category: cat,
      isDarkTheme: isDarkTheme,
      selectedColor: color,
      note: 'Using same colors as Home screen project status'
    });

    return color;
  };

  return (
    <View style={styles.ratioContainer}>
      <Text style={styles.ratioTitle}>
        Defect to Remark Ratio
        {apiData && (
          <Text style={styles.apiDataIndicator}> • Live Data</Text>
        )}
        {!apiData && (
          <Text style={styles.localDataIndicator}> • Calculated</Text>
        )}
      </Text>

      {/* Loading State */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#007AFF" />
          <Text style={styles.loadingText}>Loading ratio data...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorMessage}>⚠️ {error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <View style={styles.ratioContent}>
        {/* Defects Section */}
        <View style={styles.ratioSection}>
          <View style={styles.ratioIconContainer}>
            <View style={[styles.ratioIcon, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.ratioIconText}>!</Text>
            </View>
          </View>
          <Text style={styles.ratioLabel}>Defects</Text>
          <Text style={styles.ratioValue}>{defects}</Text>
        </View>

        {/* Ratio Separator */}
        <View style={styles.ratioSeparator}>
          <Text style={styles.ratioSeparatorText}>:</Text>
        </View>

        {/* Remarks Section */}
        <View style={styles.ratioSection}>
          <View style={styles.ratioIconContainer}>
            <View style={[styles.ratioIcon, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.ratioIconText}>💬</Text>
            </View>
          </View>
          <Text style={styles.ratioLabel}>Remarks</Text>
          <Text style={styles.ratioValue}>{remarks}</Text>
        </View>
      </View>

      {/* Ratio Summary */}
      <View style={[
        styles.ratioSummary,
        { backgroundColor: getCategoryColor(category, isDarkTheme) }
      ]}>
        <Text style={styles.ratioSummaryLabel}>Ratio</Text>

        {/* Curved Rectangle without Color Background */}
        <View style={styles.ratioValueContainer}>
          <Text style={styles.ratioSummaryValue}>
            {ratio}
          </Text>
        </View>

        <Text style={styles.ratioSummaryDescription}>
          Category: {category} Risk
        </Text>
        {apiData && (
          <Text style={styles.ratioSummaryDescription}>
            1 : {ratioValue} (For every defect, there are {ratioValue} remarks)
          </Text>
        )}
      </View>
    </View>
  );
};

interface Project {
  id: string;
  name: string;
  description: string;
}

interface Defect {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'REOPEN' | 'NEW' | 'OPEN' | 'FIXED' | 'CLOSED' | 'REJECTED' | 'DUPLICATE';
  assignedTo: string;
  createdAt: string;
}

interface ProjectDashboardProps {
  route: {
    params: {
      projectId: string;
    };
  };
  navigation: any;
  onNavigateToProfile: () => void;
  onNavigateToSettings: () => void;
}

const ProjectDashboard: React.FC<ProjectDashboardProps> = ({ route, navigation, onNavigateToProfile, onNavigateToSettings }) => {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme(); // Move useTheme to top level to avoid hooks order violation
  const { projectId } = route.params;
  const [projects, setProjects] = useState<Project[]>([]);
  const [defects, setDefects] = useState<Defect[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  // API-related state
  const [apiProjects, setApiProjects] = useState<ProjectData[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Defect Density API state
  const [defectDensityData, setDefectDensityData] = useState<DefectDensityData | null>(null);
  const [isLoadingDefectDensity, setIsLoadingDefectDensity] = useState<boolean>(false);
  const [defectDensityError, setDefectDensityError] = useState<string | null>(null);

  // Defect to Remark Ratio API state
  const [defectToRemarkData, setDefectToRemarkData] = useState<DefectToRemarkData | null>(null);
  const [isLoadingDefectToRemark, setIsLoadingDefectToRemark] = useState<boolean>(false);
  const [defectToRemarkError, setDefectToRemarkError] = useState<string | null>(null);

  // Severity Summary API state
  const [severitySummaryData, setSeveritySummaryData] = useState<SeveritySummaryData | null>(null);
  const [isLoadingSeveritySummary, setIsLoadingSeveritySummary] = useState<boolean>(false);
  const [severitySummaryError, setSeveritySummaryError] = useState<string | null>(null);

  // Defect Severity Index API state
  const [dsiData, setDsiData] = useState<DefectSeverityIndexData | null>(null);
  const [isLoadingDSI, setIsLoadingDSI] = useState<boolean>(false);
  const [dsiError, setDsiError] = useState<string | null>(null);

  // Defect Type Pie Chart API state
  const [defectTypeData, setDefectTypeData] = useState<DefectTypeData | null>(null);
  const [isLoadingDefectType, setIsLoadingDefectType] = useState<boolean>(false);
  const [defectTypeError, setDefectTypeError] = useState<string | null>(null);

  // Defect Module Pie Chart API state
  const [defectModuleData, setDefectModuleData] = useState<DefectModuleItem[] | null>(null);
  const [isLoadingDefectModule, setIsLoadingDefectModule] = useState<boolean>(false);
  const [defectModuleError, setDefectModuleError] = useState<string | null>(null);

  // Project Card Color API state (same as Home screen)
  const [projectCardColors, setProjectCardColors] = useState<{ [key: string]: ProjectCardColorData }>({});
  const [isLoadingCardColors, setIsLoadingCardColors] = useState<boolean>(false);
  const [cardColorsError, setCardColorsError] = useState<string | null>(null);

  // Function to fetch projects from API
  const fetchProjectsFromApi = async () => {
    setIsLoadingProjects(true);
    setApiError(null);

    try {
      console.log('🚀 Starting to fetch projects from API...');

      // First test basic network connectivity
      console.log('🌐 Testing network connectivity...');
      const networkOk = await testNetworkConnectivity();
      if (!networkOk) {
        throw new ProjectApiError(
          'No internet connection detected. Please check your network settings.',
          0,
          'no_internet'
        );
      }
      console.log('✅ Network connectivity confirmed');

      // Then test API health
      console.log('🔍 Checking API health...');
      const apiHealthy = await checkApiHealth();
      if (!apiHealthy) {
        console.warn('⚠️ API health check failed, but attempting to fetch anyway...');
      }

      // Attempt to fetch projects
      const projectsData = await getProjects();

      console.log('✅ Successfully fetched projects:', projectsData.length);
      setApiProjects(projectsData);

      // Transform API projects to app format and merge with existing projects
      const transformedProjects = transformProjectsForApp(projectsData);

      // Update the projects state with API data
      setProjects(transformedProjects);

      // If no project is selected and we have projects, select the first one
      if (!selectedProject && transformedProjects.length > 0) {
        setSelectedProject(transformedProjects[0]);
      }

      // Clear any previous errors
      setApiError(null);

    } catch (error) {
      console.error('❌ Error fetching projects:', error);

      let errorMessage = 'Unknown error occurred';
      let alertTitle = 'Failed to Load Projects';
      let alertMessage = 'Unable to fetch projects from server.\n\nUsing offline data instead.';

      if (error instanceof ProjectApiError) {
        errorMessage = `${error.apiStatus} (${error.statusCode}): ${error.message}`;

        // Customize alert based on error type
        if (error.apiStatus === 'network_error' || error.apiStatus === 'no_internet') {
          alertTitle = 'Network Error';
          alertMessage = `${error.message}\n\nPlease check your internet connection and try again.\n\nUsing offline data instead.`;
        } else if (error.apiStatus === 'timeout_error') {
          alertTitle = 'Request Timeout';
          alertMessage = `${error.message}\n\nThe server may be busy. Please try again later.\n\nUsing offline data instead.`;
        } else {
          alertMessage = `Error: ${error.message}\n\nUsing offline data instead.`;
        }
      } else {
        errorMessage = 'Network error: Unable to connect to server';
        alertTitle = 'Connection Error';
        alertMessage = 'Unable to connect to the server. Please check your internet connection and try again.\n\nUsing offline data instead.';
      }

      setApiError(errorMessage);

      // Show user-friendly error message
      Alert.alert(alertTitle, alertMessage, [
        { text: 'OK' },
        { text: 'Retry', onPress: fetchProjectsFromApi }
      ]);

      // No fallback - show error state instead
      console.log('📱 API failed, showing error state...');
      setProjects([]);
      setSelectedProject(null);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Function to calculate project-specific metrics
  const getProjectMetrics = (project: Project | null) => {
    if (!project) {
      return {
        projectId: 1,
        kloc: 10.0,
        totalDefects: 85,
        totalLinesOfCode: 10000
      };
    }

    // Get defects for the selected project
    const projectDefects = defects.filter(defect => defect.projectId === project.id);
    const totalDefects = projectDefects.length;

    // Calculate KLOC based on project characteristics
    // You can customize this logic based on your project data
    let kloc = 10.0; // Default
    let totalLinesOfCode = 10000; // Default

    // Project-specific KLOC calculation based on realistic project sizes
    switch (project.id) {
      case 'proj-1': // Defect Tracker - Large enterprise app (34 defects)
        kloc = 15.0; // 15,000 lines of code
        totalLinesOfCode = 15000;
        break;
      case 'proj-2': // QA Testing - Medium app (8 defects)
        kloc = 5.5; // 5,500 lines of code
        totalLinesOfCode = 5500;
        break;
      case 'proj-3': // Project 1 - Small security app (5+ defects)
        kloc = 3.2; // 3,200 lines of code
        totalLinesOfCode = 3200;
        break;
      case 'proj-4': // Project 2 - Medium app
        kloc = 8.0; // 8,000 lines of code
        totalLinesOfCode = 8000;
        break;
      case 'proj-5': // Project 3 - Large app
        kloc = 12.5; // 12,500 lines of code
        totalLinesOfCode = 12500;
        break;
      default:
        // For API projects, calculate based on project characteristics
        const numericId = parseInt(project.id.replace(/\D/g, '')) || 1;

        // Base KLOC calculation with some variation
        if (numericId <= 3) {
          kloc = 5.0 + (numericId * 2.0); // 7.0, 9.0, 11.0
        } else {
          kloc = 8.0 + (numericId * 1.5); // Larger projects
        }
        totalLinesOfCode = kloc * 1000;
    }

    // Extract numeric project ID for API call
    const projectId = parseInt(project.id.replace(/\D/g, '')) || 1;

    return {
      projectId,
      kloc,
      totalDefects,
      totalLinesOfCode
    };
  };

  // Function to fetch defect density data from API
  const fetchDefectDensityFromApi = async (projectId: number, kloc: number) => {
    setIsLoadingDefectDensity(true);
    setDefectDensityError(null);

    try {
      console.log('🚀 Starting to fetch defect density from API...');
      console.log('📊 Parameters - ProjectID:', projectId, 'KLOC:', kloc);

      const densityData = await getDefectDensity(projectId, kloc);

      console.log('✅ Successfully fetched defect density:', densityData.defectDensity);
      setDefectDensityData(densityData);

      // Clear any previous errors
      setDefectDensityError(null);

    } catch (error) {
      console.error('❌ Error fetching defect density:', error);

      let errorMessage = 'Unknown error occurred';
      let alertTitle = 'Failed to Load Defect Density';
      let alertMessage = 'Unable to fetch defect density from server.\n\nUsing default calculation instead.';

      if (error instanceof DefectDensityError) {
        errorMessage = `${error.apiStatus} (${error.statusCode}): ${error.message}`;

        // Customize alert based on error type
        if (error.apiStatus === 'network_error') {
          alertTitle = 'Network Error';
          alertMessage = `${error.message}\n\nPlease check your internet connection and try again.\n\nUsing default calculation instead.`;
        } else if (error.apiStatus === 'timeout_error') {
          alertTitle = 'Request Timeout';
          alertMessage = `${error.message}\n\nThe server may be busy. Please try again later.\n\nUsing default calculation instead.`;
        } else if (error.statusCode === 4000) {
          alertTitle = 'Invalid Project';
          alertMessage = `${error.message}\n\nPlease select a valid project.\n\nUsing default calculation instead.`;
        } else {
          alertMessage = `Error: ${error.message}\n\nUsing default calculation instead.`;
        }
      } else {
        errorMessage = 'Network error: Unable to connect to server';
        alertTitle = 'Connection Error';
        alertMessage = 'Unable to connect to the server. Please check your internet connection and try again.\n\nUsing default calculation instead.';
      }

      setDefectDensityError(errorMessage);

      // Show user-friendly error message (optional - can be removed if too many alerts)
      console.warn('⚠️ Defect density API error:', errorMessage);

      // Don't set defectDensityData to null - let the component use default calculation

    } finally {
      setIsLoadingDefectDensity(false);
    }
  };

  // Function to fetch defect to remark ratio data from API
  const fetchDefectToRemarkFromApi = async (projectId: number) => {
    setIsLoadingDefectToRemark(true);
    setDefectToRemarkError(null);

    try {
      console.log('🚀 Starting to fetch defect to remark ratio from API...');
      console.log('📊 Parameters - ProjectID:', projectId);

      const ratioData = await getDefectToRemarkRatio(projectId);

      console.log('✅ Successfully fetched defect to remark ratio:', ratioData.ratio);
      setDefectToRemarkData(ratioData);

      // Clear any previous errors
      setDefectToRemarkError(null);

    } catch (error) {
      console.error('❌ Error fetching defect to remark ratio:', error);

      let errorMessage = 'Unknown error occurred';
      let alertTitle = 'Failed to Load Defect to Remark Ratio';
      let alertMessage = 'Unable to fetch defect to remark ratio from server.\n\nUsing default calculation instead.';

      if (error instanceof DefectToRemarkError) {
        errorMessage = `${error.apiStatus} (${error.statusCode}): ${error.message}`;

        // Customize alert based on error type
        if (error.apiStatus === 'network_error') {
          alertTitle = 'Network Error';
          alertMessage = `${error.message}\n\nPlease check your internet connection and try again.\n\nUsing default calculation instead.`;
        } else if (error.apiStatus === 'timeout_error') {
          alertTitle = 'Request Timeout';
          alertMessage = `${error.message}\n\nThe server may be busy. Please try again later.\n\nUsing default calculation instead.`;
        } else if (error.statusCode === 4000) {
          alertTitle = 'Data Not Found';
          alertMessage = `${error.message}\n\nNo defect data available for this project.\n\nUsing default calculation instead.`;
        } else {
          alertMessage = `Error: ${error.message}\n\nUsing default calculation instead.`;
        }
      } else {
        errorMessage = 'Network error: Unable to connect to server';
        alertTitle = 'Connection Error';
        alertMessage = 'Unable to connect to the server. Please check your internet connection and try again.\n\nUsing default calculation instead.';
      }

      setDefectToRemarkError(errorMessage);

      // Show user-friendly error message (optional - can be removed if too many alerts)
      console.warn('⚠️ Defect to remark ratio API error:', errorMessage);

      // Don't set defectToRemarkData to null - let the component use default calculation

    } finally {
      setIsLoadingDefectToRemark(false);
    }
  };

  // Function to fetch severity summary data from API
  const fetchSeveritySummaryFromApi = async (projectId: number) => {
    setIsLoadingSeveritySummary(true);
    setSeveritySummaryError(null);

    try {
      console.log('🚀 Starting to fetch severity summary from API...');
      console.log('📊 Parameters - ProjectID:', projectId);
      console.log('🌐 API Base URL: http://34.56.162.48:8087/api/v1');
      console.log('📡 Full URL: http://34.56.162.48:8087/api/v1/dashboard/defect_severity_summary/' + projectId);

      const summaryData = await getSeveritySummary(projectId);

      console.log('✅ Successfully fetched severity summary:', summaryData.totalDefects, 'total defects');
      console.log('📊 Severity summary data:', JSON.stringify(summaryData, null, 2));
      setSeveritySummaryData(summaryData);

      // Clear any previous errors
      setSeveritySummaryError(null);

    } catch (error) {
      console.error('❌ Error fetching severity summary:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof SeveritySummaryApiError) {
        errorMessage = `${error.apiStatus} (${error.statusCode}): ${error.message}`;

        // Provide user-friendly messages for common errors
        if (error.apiStatus === 'timeout_error') {
          errorMessage = 'Request timeout. The server is taking too long to respond.';
        } else if (error.apiStatus === 'network_error') {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.apiStatus === 'project_not_found') {
          errorMessage = 'Project not found. Please select a different project.';
        } else if (error.apiStatus === 'parse_error') {
          errorMessage = 'Server response format error. Please try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        errorMessage = 'Network error: Unable to connect to server';
      }

      setSeveritySummaryError(errorMessage);

      // Log error for debugging
      console.warn('⚠️ Severity summary API error:', errorMessage);
      console.warn('⚠️ Full error details:', error);

    } finally {
      setIsLoadingSeveritySummary(false);
    }
  };

  // Function to fetch defect severity index data from API
  const fetchDSIFromApi = async (projectId: number) => {
    setIsLoadingDSI(true);
    setDsiError(null);

    try {
      console.log('🚀 Starting to fetch DSI from API...');
      console.log('📊 Parameters - ProjectID:', projectId);

      const dsiResponse = await getDefectSeverityIndex(projectId);

      console.log('✅ Successfully fetched DSI:', dsiResponse.dsiPercentage + '%');
      setDsiData(dsiResponse);

    } catch (error) {
      console.error('❌ Error fetching DSI:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof DefectSeverityIndexApiError) {
        errorMessage = `${error.apiStatus} (${error.statusCode}): ${error.message}`;

        if (error.apiStatus === 'no_defects_found') {
          errorMessage = 'No defects found for this project';
        } else if (error.apiStatus === 'network_error') {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.apiStatus === 'timeout_error') {
          errorMessage = 'Request timeout. Please try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setDsiError(errorMessage);

      // Log error for debugging
      console.warn('⚠️ DSI API error:', errorMessage);

    } finally {
      setIsLoadingDSI(false);
    }
  };

  // Function to fetch defect type statistics from API
  const fetchDefectTypeFromApi = async (projectId: number) => {
    setIsLoadingDefectType(true);
    setDefectTypeError(null);

    try {
      console.log('🚀 Starting to fetch defect type data from API...');
      console.log('📊 Parameters - ProjectID:', projectId);

      const defectTypeResponse = await getDefectTypeStatistics(projectId);

      console.log('✅ Successfully fetched defect type data:', defectTypeResponse.totalDefectCount, 'total defects');
      setDefectTypeData(defectTypeResponse);

    } catch (error) {
      console.error('❌ Error fetching defect type data:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof DefectTypeApiError) {
        errorMessage = `${error.apiStatus} (${error.statusCode}): ${error.message}`;

        if (error.apiStatus === 'no_defects_found') {
          errorMessage = 'No defects found for this project';
        } else if (error.apiStatus === 'network_error') {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.apiStatus === 'timeout_error') {
          errorMessage = 'Request timeout. Please try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setDefectTypeError(errorMessage);

      // Log error for debugging
      console.warn('⚠️ Defect Type API error:', errorMessage);

    } finally {
      setIsLoadingDefectType(false);
    }
  };

  // Function to fetch defect module statistics from API
  const fetchDefectModuleFromApi = async (projectId: number) => {
    setIsLoadingDefectModule(true);
    setDefectModuleError(null);

    try {
      console.log('🚀 Starting to fetch defect module data from API...');
      console.log('📊 Parameters - ProjectID:', projectId);

      const defectModuleResponse = await getDefectModuleStatistics(projectId);

      console.log('✅ Successfully fetched defect module data:', defectModuleResponse.length, 'modules');
      setDefectModuleData(defectModuleResponse);

    } catch (error) {
      console.error('❌ Error fetching defect module data:', error);

      let errorMessage = 'Unknown error occurred';

      if (error instanceof DefectModuleApiError) {
        errorMessage = `${error.apiStatus} (${error.statusCode}): ${error.message}`;

        if (error.apiStatus === 'no_defects_found') {
          errorMessage = 'No defects found for the given project';
        } else if (error.apiStatus === 'network_error') {
          errorMessage = 'Network connection failed. Please check your internet connection.';
        } else if (error.apiStatus === 'timeout_error') {
          errorMessage = 'Request timeout. Please try again.';
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setDefectModuleError(errorMessage);

      // Log error for debugging
      console.warn('⚠️ Defect Module API error:', errorMessage);

    } finally {
      setIsLoadingDefectModule(false);
    }
  };

  // Fetch project card colors from API (same logic as Home screen)
  const fetchProjectCardColors = async (projectIds: number[]) => {
    if (projectIds.length === 0) return;

    try {
      setIsLoadingCardColors(true);
      setCardColorsError(null);

      console.log('🎨 Fetching project card colors for ProjectDashboard...', projectIds);

      const newCardColors: { [key: string]: ProjectCardColorData } = {};

      // Fetch colors for each project
      await Promise.all(
        projectIds.map(async (projectId) => {
          try {
            const colorData = await getProjectCardColor(projectId);
            // Store with both string and numeric keys for compatibility
            newCardColors[projectId.toString()] = colorData;
            newCardColors[projectId] = colorData;
          } catch (error) {
            console.warn(`⚠️ Failed to fetch color for project ${projectId}:`, error);
          }
        })
      );

      console.log('✅ Project card colors loaded for ProjectDashboard:', Object.keys(newCardColors).length);
      console.log('🎨 Card colors data:', JSON.stringify(newCardColors, null, 2));
      setProjectCardColors(newCardColors);

    } catch (error) {
      console.error('❌ Error fetching project card colors:', error);
      setCardColorsError('Failed to load project colors');
    } finally {
      setIsLoadingCardColors(false);
    }
  };

  // Animation values for fast 3D swipe with background visibility
  const translateX = useRef(new Animated.Value(0)).current;
  const rotateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  // Handle phone back button
  useEffect(() => {
    const backAction = () => {
      navigation.goBack(); // Navigate back to previous screen
      return true; // Prevent default back behavior
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);

    return () => backHandler.remove();
  }, [navigation]);

  // Create PanResponder for swipe gesture with animation
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes that are significant
      return Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 20;
    },
    onPanResponderMove: (_, gestureState) => {
      // Fast 3D swipe animation with background visibility (only for right swipes)
      if (gestureState.dx > 0) {
        const progress = Math.min(gestureState.dx / 150, 1); // Very fast progress (150px vs 200px)

        // Fast horizontal translation
        translateX.setValue(gestureState.dx * 1.2); // Increased for faster movement

        // 3D rotation for depth effect
        rotateY.setValue(progress * -25); // Subtle rotation for 3D effect

        // Slight scale for perspective
        scale.setValue(1 - (progress * 0.05)); // Minimal scale change

        // Reduced opacity to show background (not complete fade)
        opacity.setValue(1 - (progress * 0.4)); // Only 40% fade to keep background visible
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      // Check if it's a left-to-right swipe (positive dx) and significant distance
      if (gestureState.dx > 100 && Math.abs(gestureState.dy) < 100) {
        // Very fast 3D swipe completion with background visibility
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: 400, // Increased distance for dramatic effect
            duration: 100, // Very fast - reduced to 100ms
            useNativeDriver: true,
          }),
          Animated.timing(rotateY, {
            toValue: -35, // Complete the 3D rotation
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 0.9, // Final scale for depth
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.2, // Keep some visibility for background effect
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start(() => {
          navigation.goBack();
        });
      } else {
        // Very fast spring back to original position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            tension: 200, // Very high tension for instant snap
            friction: 5,  // Low friction for quick return
            useNativeDriver: true,
          }),
          Animated.spring(rotateY, {
            toValue: 0,
            tension: 200,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            tension: 200,
            friction: 5,
            useNativeDriver: true,
          }),
          Animated.spring(opacity, {
            toValue: 1,
            tension: 200,
            friction: 5,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  // No mock data - all data comes from API

  // No mock defects - all defect data should come from API calls




  useEffect(() => {
    // Initialize with empty defects - all data comes from API
    setDefects([]);

    // Fetch projects from API
    fetchProjectsFromApi();
  }, []);

  // Fetch project card colors when projects are loaded (same as Home screen)
  useEffect(() => {
    if (projects.length > 0) {
      console.log('🎨 Projects loaded, fetching card colors...');

      const projectIds = projects
        .map(project => {
          const numericId = (project as any).numericId || parseInt(project.id);
          return isNaN(numericId) ? null : numericId;
        })
        .filter(id => id !== null && id > 0) as number[];

      console.log('🎨 Valid project IDs for color fetching:', projectIds);

      if (projectIds.length > 0) {
        fetchProjectCardColors(projectIds);
      } else {
        console.warn('⚠️ No valid numeric project IDs found for color fetching');
      }
    }
  }, [projects]);

  // Effect to fetch defect density and defect to remark ratio when selected project changes
  useEffect(() => {
    if (selectedProject) {
      const metrics = getProjectMetrics(selectedProject);

      console.log('🎯 Selected project changed, fetching data for:', selectedProject.name);
      console.log('📊 Project metrics:', {
        projectId: metrics.projectId,
        kloc: metrics.kloc,
        totalDefects: metrics.totalDefects,
        totalLinesOfCode: metrics.totalLinesOfCode
      });

      // Fetch defect density data
      fetchDefectDensityFromApi(metrics.projectId, metrics.kloc);

      // Fetch defect to remark ratio data
      fetchDefectToRemarkFromApi(metrics.projectId);

      // Fetch severity summary data
      fetchSeveritySummaryFromApi(metrics.projectId);

      // Fetch defect severity index data
      fetchDSIFromApi(metrics.projectId);

      // Fetch defect type statistics data
      fetchDefectTypeFromApi(metrics.projectId);

      // Fetch defect module statistics data
      fetchDefectModuleFromApi(metrics.projectId);
    }
  }, [selectedProject]);

  useEffect(() => {
    if (projects.length > 0) {
      const project = projects.find(p => p.id === projectId);
      setSelectedProject(project || projects[0]);
    }
  }, [projects, projectId]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REOPEN': return '#EF4444'; // Red
      case 'NEW': return '#3B82F6'; // Blue
      case 'OPEN': return '#F59E0B'; // Yellow
      case 'FIXED': return '#10B981'; // Green
      case 'CLOSED': return '#6B7280'; // Gray
      case 'REJECTED': return '#DC2626'; // Dark Red
      case 'DUPLICATE': return '#8B5CF6'; // Purple
      default: return '#6B7280';
    }
  };

  const getDefectsByProjectAndSeverity = (projectId: string, severity: string) => {
    return defects.filter(d => d.projectId === projectId && d.severity === severity);
  };

  const getStatusCounts = (projectDefects: Defect[]) => {
    const statusCounts = {
      REOPEN: 0,
      NEW: 0,
      OPEN: 0,
      FIXED: 0,
      CLOSED: 0,
      REJECTED: 0,
      DUPLICATE: 0,
    };

    projectDefects.forEach(defect => {
      statusCounts[defect.status]++;
    });

    return statusCounts;
  };

  const renderSeverityPanel = (severity: 'high' | 'medium' | 'low', title: string, borderColor: string) => {
    if (!selectedProject) return null;

    const projectDefects = getDefectsByProjectAndSeverity(selectedProject.id, severity);
    const statusCounts = getStatusCounts(projectDefects);
    const total = projectDefects.length;

    return (
      <View style={[styles.severityPanel, { borderColor }]}>
        {/* Panel Header */}
        <View style={styles.panelHeader}>
          <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">{title}</Text>
        </View>

        {/* Status List */}
        <View style={styles.statusList}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <View key={status} style={styles.statusItem}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
              <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">{status}</Text>
              <Text style={styles.statusCount}>{count}</Text>
            </View>
          ))}
        </View>

        {/* Total Count */}
        <View style={styles.totalCountContainer}>
          <Text style={styles.totalCount}>Total: {total}</Text>
        </View>
      </View>
    );
  };

  const getProjectRiskStatus = (project: Project) => {
    // Use the EXACT same logic as Home screen to determine project risk status
    console.log('🎯 Getting project risk status for:', project.name);

    // Get the numeric ID for API lookup (same as Home screen)
    const numericId = (project as any).numericId || parseInt(project.id);
    const projectColorData = projectCardColors ?
      (projectCardColors[project.id] || projectCardColors[numericId?.toString()]) :
      undefined;

    console.log('🎯 Project color data lookup:', {
      projectId: project.id,
      numericId: numericId,
      hasColorData: !!projectColorData,
      availableRiskLevels: projectColorData?.availableRiskLevels,
      availableKeys: projectCardColors ? Object.keys(projectCardColors) : []
    });

    if (projectColorData && projectColorData.availableRiskLevels && projectColorData.availableRiskLevels.length > 0) {
      const riskLevels = projectColorData.availableRiskLevels;

      // Use the highest risk level from API data (same logic as Home screen)
      if (riskLevels.includes('High')) {
        console.log('🎯 Project status: High Risk (from API)');
        return 'High Risk';
      } else if (riskLevels.includes('Medium')) {
        console.log('🎯 Project status: Medium Risk (from API)');
        return 'Medium Risk';
      } else if (riskLevels.includes('Low')) {
        console.log('🎯 Project status: Low Risk (from API)');
        return 'Low Risk';
      } else {
        console.log('🎯 Project status: Unknown risk levels:', riskLevels);
        return 'Low Risk'; // Default fallback
      }
    } else {
      // No API data available, show loading status
      console.log('🎯 Project status: Loading... (no API data)');
      return 'Loading...';
    }
  };

  // Helper function to get status badge background style based on risk level
  // 🎨 COLOR MATCHING: Using EXACT same colors as Home screen project cards
  // This ensures the status badge matches the project card colors perfectly
  const getStatusBadgeStyle = (riskStatus: string, isDarkTheme: boolean, project?: Project) => {
    // If we have project data, try to get the exact color from API (same as Home screen)
    if (project && projectCardColors) {
      const numericId = (project as any).numericId || parseInt(project.id);
      const projectColorData = projectCardColors[project.id] || projectCardColors[numericId?.toString()];

      if (projectColorData && projectColorData.projectCardColor) {
        // Use the exact same color logic as Home screen project cards
        const apiColor = projectColorData.projectCardColor;

        console.log('🎨 Using API color for status badge:', {
          projectId: project.id,
          apiColor: apiColor,
          riskStatus: riskStatus,
          availableRiskLevels: projectColorData.availableRiskLevels
        });

        // Convert gradient color to solid background color for badge
        let backgroundColor = '#F3F4F6'; // Default gray
        let borderColor = '#6B7280'; // Default gray

        if (apiColor.includes('red') || riskStatus === 'High Risk') {
          backgroundColor = isDarkTheme ? '#2D1B1B' : '#FEF2F2';
          borderColor = isDarkTheme ? '#EF5350' : '#EF4444';
        } else if (apiColor.includes('yellow') || apiColor.includes('orange') || riskStatus === 'Medium Risk') {
          backgroundColor = isDarkTheme ? '#2D2419' : '#FFFBEB';
          borderColor = isDarkTheme ? '#FF9800' : '#F59E0B';
        } else if (apiColor.includes('green') || riskStatus === 'Low Risk') {
          backgroundColor = isDarkTheme ? '#1B2D1B' : '#F0FDF4';
          borderColor = isDarkTheme ? '#66BB6A' : '#22C55E';
        }

        console.log('🎨 Final badge colors:', { backgroundColor, borderColor });
        return { backgroundColor, borderColor, borderWidth: 1 };
      }
    }

    // Fallback to standard colors based on risk status
    switch (riskStatus) {
      case 'High Risk':
        return {
          backgroundColor: isDarkTheme ? '#2D1B1B' : '#FEF2F2',
          borderColor: isDarkTheme ? '#EF5350' : '#EF4444',
          borderWidth: 1
        };
      case 'Medium Risk':
        return {
          backgroundColor: isDarkTheme ? '#2D2419' : '#FFFBEB',
          borderColor: isDarkTheme ? '#FF9800' : '#F59E0B',
          borderWidth: 1
        };
      case 'Low Risk':
        return {
          backgroundColor: isDarkTheme ? '#1B2D1B' : '#F0FDF4',
          borderColor: isDarkTheme ? '#66BB6A' : '#22C55E',
          borderWidth: 1
        };
      case 'Loading...':
        return {
          backgroundColor: isDarkTheme ? '#2D2D2D' : '#F3F4F6',
          borderColor: '#6B7280',
          borderWidth: 1
        };
      default:
        return {
          backgroundColor: isDarkTheme ? '#2D2D2D' : '#F3F4F6',
          borderColor: '#6B7280',
          borderWidth: 1
        };
    }
  };

  // Helper function to get status badge text style based on risk level
  // Using the EXACT same colors as Home page project cards
  const getStatusBadgeTextStyle = (riskStatus: string, isDarkTheme: boolean) => {
    switch (riskStatus) {
      case 'High Risk':
        // Use same color as High Risk from Home page
        return { color: isDarkTheme ? '#EF5350' : '#EF4444' };
      case 'Medium Risk':
        // Use same color as Medium Risk from Home page
        return { color: isDarkTheme ? '#FF9800' : '#F59E0B' };
      case 'Low Risk':
        // Use same color as Low Risk from Home page
        return { color: isDarkTheme ? '#66BB6A' : '#22C55E' };
      case 'Loading...':
        return { color: '#6B7280' };
      default:
        return { color: '#6B7280' };
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { perspective: 1000 }, // 3D perspective
            { translateX },
            { rotateY: rotateY.interpolate({
                inputRange: [-35, 0],
                outputRange: ['-35deg', '0deg'],
              })
            },
            { scale },
          ],
          opacity,
        }
      ]}
      {...panResponder.panHandlers}
    >
      {/* Gradient Background */}
      <View style={styles.gradientBackground}>
        <View style={styles.gradientLayer1} />
        <View style={styles.gradientLayer2} />
        <View style={styles.gradientLayer3} />
      </View>

      {/* Decorative Curved Elements */}
      <View style={styles.decorativeCurve1} />
      <View style={styles.decorativeCurve2} />

      {/* Content */}
      <SafeAreaView style={styles.safeArea}>
        {/* Header Spacer */}
        <View style={styles.headerSpacer} />

        {/* Project Selection Panel */}
        <View style={styles.projectSelectionCard}>
          {/* <Text style={styles.sectionTitle}>Project Selection</Text> */}
          <View style={styles.projectSelectionRow}>
            {/* Left Arrow */}
            <TouchableOpacity style={styles.navigationArrow}>
              <Text style={styles.arrowText}>‹</Text>
            </TouchableOpacity>

            {/* Project Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.projectTabs}>
              {isLoadingProjects ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#007AFF" />
                  <Text style={styles.loadingText}>Loading projects...</Text>
                </View>
              ) : (
                projects.map((project) => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectTab,
                      selectedProject?.id === project.id && styles.selectedProjectTab
                    ]}
                    onPress={() => setSelectedProject(project)}
                  >
                    <Text style={[
                      styles.projectTabText,
                      selectedProject?.id === project.id && styles.selectedProjectTabText
                    ]}>
                      {project.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>

            {/* Right Arrow */}
            <TouchableOpacity style={styles.navigationArrow}>
              <Text style={styles.arrowText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* API Error Display */}
          {apiError && !isLoadingProjects && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>⚠️ {apiError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={fetchProjectsFromApi}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Selected Project Information Panel - No Background */}
        {selectedProject && (
          <View style={styles.selectedProjectInfoContainer}>
            {/* <Text style={styles.sectionTitle}>Selected Project</Text> */}
            <View style={styles.projectInfo}>
              <View style={styles.projectHeader}>
                <Text style={styles.projectName}>{selectedProject.name}</Text>
                <View style={[styles.statusBadge, getStatusBadgeStyle(getProjectRiskStatus(selectedProject), isDark, selectedProject)]}>
                  <Text style={[styles.statusBadgeText, getStatusBadgeTextStyle(getProjectRiskStatus(selectedProject), isDark)]}>{getProjectRiskStatus(selectedProject)}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Dashboard Content Card */}
        <View style={styles.dashboardCard}>
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* Defect Severity Breakdown */}
        <View style={styles.breakdownContainer}>
          <Text style={styles.sectionTitle}>Defect Severity Breakdown</Text>

          <View style={styles.severityPanelsContainer}>
            {severitySummaryData && severitySummaryData.defectSummary ? (
              // Render panels from API data
              severitySummaryData.defectSummary.map((severityItem) => (
                <View key={severityItem.severity} style={[styles.severityPanel, { borderColor: getSeverityColor(severityItem.severity) }]}>
                  {/* Panel Header */}
                  <View style={styles.panelHeader}>
                    <Text style={styles.panelTitle} numberOfLines={1} ellipsizeMode="tail">
                      {severityItem.severity} Defects
                    </Text>
                  </View>

                  {/* Status List */}
                  <View style={styles.statusList}>
                    {getAvailableStatuses(severityItem.statuses).map((status) => {
                      const statusItem = severityItem.statuses[status as keyof typeof severityItem.statuses];
                      const count = statusItem?.count || 0;
                      const color = statusItem?.color || getApiStatusColor(status);

                      return (
                        <View key={status} style={styles.statusItem}>
                          <View style={[styles.statusDot, { backgroundColor: color }]} />
                          <Text style={styles.statusText} numberOfLines={1} ellipsizeMode="tail">{status}</Text>
                          <Text style={styles.statusCount}>{count}</Text>
                        </View>
                      );
                    })}
                  </View>

                  {/* Total Count */}
                  <View style={styles.totalCountContainer}>
                    <Text style={styles.totalCount}>Total: {severityItem.total}</Text>
                  </View>
                </View>
              ))
            ) : isLoadingSeveritySummary ? (
              // Loading state
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color="#007AFF" />
                <Text style={styles.loadingText}>Loading severity data...</Text>
              </View>
            ) : severitySummaryError ? (
              // Error state with retry option - no fallback data
              <View style={styles.errorContainer}>
                <Text style={styles.errorMessage}>⚠️ {severitySummaryError}</Text>
                <TouchableOpacity
                  style={styles.retryButton}
                  onPress={() => {
                    if (selectedProject) {
                      console.log('🔄 User initiated retry for severity summary');
                      const metrics = getProjectMetrics(selectedProject);
                      fetchSeveritySummaryFromApi(metrics.projectId);
                    }
                  }}
                >
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
                <Text style={styles.loadingText}>API data required for severity summary</Text>
              </View>
            ) : (
              // No data available - show message
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No severity data available</Text>
                <Text style={styles.noDataSubText}>Please check API connection</Text>
              </View>
            )}
          </View>
        </View>

        {/* Defect Density Meter */}
        <View style={styles.densityContainer}>
          {(() => {
            const metrics = getProjectMetrics(selectedProject);
            return (
              <DefectDensityMeter
                totalDefects={metrics.totalDefects}
                totalLinesOfCode={metrics.totalLinesOfCode}
                styles={styles}
                apiData={defectDensityData}
                isLoading={isLoadingDefectDensity}
                error={defectDensityError}
                isDarkTheme={isDark}
                onRetry={() => {
                  if (selectedProject) {
                    const retryMetrics = getProjectMetrics(selectedProject);
                    fetchDefectDensityFromApi(retryMetrics.projectId, retryMetrics.kloc);
                  }
                }}
              />
            );
          })()}
        </View>

        {/* Defect to Remark Ratio Panel */}
        <DefectToRemarkRatio
          styles={styles}
          apiData={defectToRemarkData}
          isLoading={isLoadingDefectToRemark}
          error={defectToRemarkError}
          isDarkTheme={isDark}
          onRetry={() => {
            if (selectedProject) {
              const metrics = getProjectMetrics(selectedProject);
              fetchDefectToRemarkFromApi(metrics.projectId);
            }
          }}
          defaultDefects={85}
          defaultRemarks={142}
        />

        {/* Defect Severity Index Panel */}
        <View style={styles.severityIndexContainer}>
          <Text style={styles.severityIndexTitle}>
            Defect Severity Index
            {dsiData && (
              <Text style={styles.apiDataIndicator}> • Live Data</Text>
            )}
            {!dsiData && (
              <Text style={styles.localDataIndicator}> • Calculated</Text>
            )}
          </Text>

          {/* Loading State */}
          {isLoadingDSI && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#007AFF" />
              <Text style={styles.loadingText}>Loading DSI data...</Text>
            </View>
          )}

          {/* Error State */}
          {dsiError && !isLoadingDSI && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorMessage}>⚠️ {dsiError}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  if (selectedProject) {
                    const metrics = getProjectMetrics(selectedProject);
                    fetchDSIFromApi(metrics.projectId);
                  }
                }}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {!isLoadingDSI && (
            <View style={styles.severityIndexContent}>
              {/* DSI Details */}
              {dsiData && (
                <View style={styles.dsiDetailsContainer}>
                  <View style={styles.dsiDetailRow}>
                    <Text style={styles.dsiDetailLabel}>Total Defects:</Text>
                    <Text style={styles.dsiDetailValue}>{dsiData.totalDefects}</Text>
                  </View>
                  <View style={styles.dsiDetailRow}>
                    <Text style={styles.dsiDetailLabel}>Actual Score:</Text>
                    <Text style={styles.dsiDetailValue}>{dsiData.actualSeverityScore}</Text>
                  </View>
                  <View style={styles.dsiDetailRow}>
                    <Text style={styles.dsiDetailLabel}>Maximum Score:</Text>
                    <Text style={styles.dsiDetailValue}>{dsiData.maximumSeverityScore}</Text>
                  </View>
                </View>
              )}

              {/* Severity Index Gauge */}
              <View style={styles.severityGaugeContainer}>
                <View style={styles.severityGauge}>
                  {/* Background Track */}
                  <View style={styles.severityGaugeTrack} />

                  {/* Progress Fill */}
                  <View style={[styles.severityGaugeFill, {
                    width: `${dsiData ? Math.min(dsiData.dsiPercentage, 100) : 68}%`,
                    backgroundColor: dsiData ? getDSIInterpretationColor(dsiData.dsiPercentage) : '#F97316',
                  }]} />
                </View>

                {/* Index Value Display - Outside the meter */}
                <View style={styles.severityIndexDisplay}>
                  <Text style={styles.severityIndexValue}>
                    {dsiData ? dsiData.dsiPercentage.toFixed(1) : '6.8'}
                  </Text>
                  <Text style={styles.severityIndexMax}>%</Text>
                </View>

                {/* Severity Level Indicator */}
                <View style={styles.severityLevelContainer}>
                  <Text style={styles.severityLevelLabel}>Risk Level</Text>
                  <View style={[styles.severityLevelBadge, {
                    backgroundColor: dsiData ? getDSIInterpretationColor(dsiData.dsiPercentage) : '#F97316'
                  }]}>
                    <Text style={styles.severityLevelText}>
                      {dsiData ? dsiData.interpretation : 'Moderate-High'}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Defect Type Distribution Pie Chart */}
        <DefectTypeDistribution
          selectedProjectId={selectedProject?.id}
          defects={defects}
          projects={projects}
          apiData={defectTypeData}
          isLoading={isLoadingDefectType}
          error={defectTypeError}
          onRetry={() => {
            if (selectedProject) {
              const metrics = getProjectMetrics(selectedProject);
              fetchDefectTypeFromApi(metrics.projectId);
            }
          }}
        />

        {/* Defects by Module Pie Chart */}
        <DefectsByModuleChart
          selectedProjectId={selectedProject?.id}
          defects={defects}
          projects={projects}
          apiData={defectModuleData}
          isLoading={isLoadingDefectModule}
          error={defectModuleError}
          onRetry={() => {
            if (selectedProject) {
              const metrics = getProjectMetrics(selectedProject);
              fetchDefectModuleFromApi(metrics.projectId);
            }
          }}
        />

          </ScrollView>
        </View>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton} onPress={() => navigation.goBack()}>
            <Image
              source={require('../assets/home.png')}
              style={styles.footerIcon}
              resizeMode="cover"
            />
            <Text style={styles.footerText}>Home</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={onNavigateToProfile}>
            <Image
              source={require('../assets/user.png')}
              style={styles.footerIcon}
              resizeMode="cover"
            />
            <Text style={styles.footerText}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerButton} onPress={onNavigateToSettings}>
            <Image
              source={require('../assets/settings.png')}
              style={styles.footerIcon}
              resizeMode="cover"
            />
            <Text style={styles.footerText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>


    </Animated.View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.grouped,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    overflow: 'hidden',
  },
  gradientLayer1: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: colors.gradient.primary[0],
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
  },
  gradientLayer2: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '70%',
    backgroundColor: colors.gradient.primary[1],
    opacity: 0.8,
    borderBottomLeftRadius: 45,
    borderBottomRightRadius: 45,
  },
  gradientLayer3: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    backgroundColor: colors.gradient.primary[2],
    opacity: 0.6,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  safeArea: {
    flex: 1,
    paddingTop: 0,
  },
  headerSpacer: {
    width: 50,
    height: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 4,
    marginTop: 8,
  },
  dashboardCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 12,
    marginTop: 4,
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    flex: 1,
  },
  content: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  projectSelectionContainer: {
    marginBottom: 24,
  },
  // Separate Project Selection Card
  projectSelectionCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 8,
    marginTop: 12,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  // Separate Selected Project Info Card
  selectedProjectInfoCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 12,
    marginBottom: 16,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  // Selected Project Info Container - No Background
  selectedProjectInfoContainer: {
    marginHorizontal: 12,
    marginBottom: 10,
    marginTop: 2,
  },
  projectSelectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navigationArrow: {
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    marginHorizontal: 4,
  },
  arrowText: {
    fontSize: 18,
    color: '#6B7280',
    fontWeight: 'bold',
  },
  projectTabs: {
    flexDirection: 'row',
    flex: 1,
  },
  projectTab: {
    backgroundColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 8,
  },
  selectedProjectTab: {
    backgroundColor: '#3B82F6',
  },
  projectTabText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  selectedProjectTabText: {
    color: '#FFFFFF',
  },
  projectInfo: {
    backgroundColor: colors.background.elevated,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    // Background color and border will be set dynamically
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    // Color will be set dynamically based on risk level
  },
  breakdownContainer: {
    marginBottom: 24,
  },
  severityPanelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  severityPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    borderWidth: 1.5,
    padding: 10,
    flex: 1,
    minHeight: 140,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0.5 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 4,
    minHeight: 20,
  },
  panelTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
  },
  totalCount: {
    fontSize: 10,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  totalCountContainer: {
    paddingTop: 8,
    paddingBottom: 4,
    paddingHorizontal: 4,
    borderTopWidth: 0.5,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  statusList: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
    paddingHorizontal: 4,
    minHeight: 16,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginRight: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#374151',
    flex: 1,
    textAlign: 'left',
    marginLeft: 2,
  },
  statusCount: {
    fontSize: 10,
    fontWeight: '600',
    color: '#1F2937',
    minWidth: 16,
    textAlign: 'right',
  },

  // Defect Density Meter Styles
  densityContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  densityMeterContainer: {
    alignItems: 'center',
  },
  densityTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
    color: colors.text.primary,
  },
  // KLOC Details Styles
  klocDetailsContainer: {
    marginTop: 16,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  klocDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  klocDetailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  klocDetailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  densityResultValue: {
    fontSize: 16,
    color: colors.system.blue,
    fontWeight: 'bold',
  },
  speedometerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  // Original speedometer styles from your provided code
  speedometerWrapperStyle: {},
  outerCircleStyle: {},
  halfCircleStyle: {},
  imageWrapperStyle: {},
  imageStyle: {},
  innerCircleStyle: {},
  labelWrapperStyle: {},
  labelStyle: {},
  labelNoteStyle: {},
  // Footer Styles
  footer: {
    flexDirection: 'row',
    backgroundColor: colors.background.secondary,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: colors.system.blue,
    shadowOffset: {
      width: 0,
      height: -6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 12,
    borderTopWidth: 4,
    borderTopColor: colors.system.blue,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderLeftColor: colors.system.blue,
    borderRightColor: colors.system.blue,
  },
  footerButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  footerIcon: {
    width: 20,
    height: 20,
    marginBottom: 2,
    tintColor: colors.text.tertiary,
  },
  footerText: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '500',
  },
  activeFooterIcon: {
    tintColor: colors.system.blue,
  },
  activeFooterText: {
    color: colors.system.blue,
    fontWeight: '600',
  },
  // Decorative Curved Elements
  decorativeCurve1: {
    position: 'absolute',
    top: '45%',
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    opacity: 0.6,
  },
  decorativeCurve2: {
    position: 'absolute',
    top: '55%',
    left: -40,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    opacity: 0.5,
  },



  // Defect to Remark Ratio Panel Styles
  ratioContainer: {
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  ratioTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  ratioContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  ratioSection: {
    flex: 1,
    alignItems: 'center',
  },
  ratioIconContainer: {
    marginBottom: 8,
  },
  ratioIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  ratioIconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  ratioLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  ratioValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  ratioSeparator: {
    paddingHorizontal: 20,
  },
  ratioSeparatorText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: colors.text.secondary,
  },
  ratioSummary: {
    backgroundColor: colors.background.secondary, // Default background, will be overridden by dynamic color
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ratioSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF', // White text for better contrast on colored background
    marginBottom: 4,
  },
  ratioValueContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Semi-transparent white background
    borderRadius: 12, // Curved rectangle
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignSelf: 'center',
    marginBottom: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  ratioSummaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF', // White text for better contrast
  },
  ratioSummaryDescription: {
    fontSize: 12,
    color: '#FFFFFF', // White text for better contrast on colored background
    textAlign: 'center',
    lineHeight: 16,
  },

  // Defect Severity Index Panel Styles
  severityIndexContainer: {
    backgroundColor: colors.background.elevated,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  severityIndexTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  severityIndexContent: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  severityGaugeContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  severityGauge: {
    height: 20,
    width: '80%',
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
    position: 'relative',
    marginBottom: 16,
    overflow: 'hidden',
  },
  severityGaugeTrack: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background.secondary,
    borderRadius: 10,
  },
  severityGaugeFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  severityIndexDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 12,
  },
  severityIndexValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  severityIndexMax: {
    fontSize: 12,
    color: colors.text.secondary,
    marginLeft: 2,
  },
  severityLevelContainer: {
    alignItems: 'center',
  },
  severityLevelLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginBottom: 6,
  },
  severityLevelBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  severityLevelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // API Loading and Error Styles
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  errorContainer: {
    backgroundColor: colors.system.red + '15', // Light red background
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorMessage: {
    flex: 1,
    fontSize: 12,
    color: colors.system.red,
    fontWeight: '500',
    marginRight: 12,
  },
  retryButton: {
    backgroundColor: colors.system.blue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  retryButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Defect Density API Integration Styles
  apiDataIndicator: {
    fontSize: 12,
    color: colors.system.green,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  localDataIndicator: {
    fontSize: 12,
    color: colors.text.tertiary,
    fontWeight: '400',
    fontStyle: 'italic',
  },

  // DSI Details Styles
  dsiDetailsContainer: {
    marginBottom: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
  },
  dsiDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dsiDetailLabel: {
    fontSize: 14,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  dsiDetailValue: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },

  // No Data Styles
  noDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  noDataText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text.secondary,
    marginBottom: 8,
  },
  noDataSubText: {
    fontSize: 14,
    color: colors.text.tertiary,
    textAlign: 'center',
  },

});

export default ProjectDashboard;
