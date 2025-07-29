import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import { useThemedStyles } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import DefectTypeDistribution from '../components/DefectTypeDistribution';
import DefectsReopenedChart from '../components/DefectsReopenedChart';
import DefectsByModuleChart from '../components/DefectsByModuleChart';
import { getProjects, transformProjectsForApp, ProjectData, ProjectApiError, testNetworkConnectivity, checkApiHealth } from '../api/GetProject';
import { getDefectDensity, DefectDensityData, DefectDensityError, mapDefectDensityToUI } from '../api/GetDefectDensity';
import { getDefectToRemarkRatio, DefectToRemarkData, DefectToRemarkError, mapDefectToRemarkRatioToUI } from '../api/GetDefectToRemark';

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
}

// DefectDensityMeter Component with KLOC calculation logic and API integration
const DefectDensityMeter: React.FC<DefectDensityMeterProps> = ({
  totalDefects,
  totalLinesOfCode,
  styles,
  apiData,
  isLoading,
  error,
  onRetry
}) => {
  // Calculate defect density per KLOC (thousand lines of code) - fallback calculation
  const calculateDefectDensity = (defects: number, loc: number): number => {
    if (loc === 0) return 0;
    return (defects / loc) * 1000; // Defects per 1000 lines of code
  };

  // Use API data if available, otherwise use local calculation
  const defectDensity = apiData ? apiData.defectDensity : calculateDefectDensity(totalDefects, totalLinesOfCode);
  const densityMeaning = apiData ? apiData.meaning : 'Calculated locally';
  // Enhanced speedometer labels with old UI color mapping
  const speedometerLabels = [
    {
      name: '0',
      labelColor: '#00ff6b', // Old Light Green
      activeBarColor: '#00ff6b',
    },
    {
      name: '3.5',
      labelColor: '#14eb6e', // Old Dark Green
      activeBarColor: '#14eb6e',
    },
    {
      name: '7',
      labelColor: '#FFFF00', // Yellow
      activeBarColor: '#FFFF00',
    },
    {
      name: '8.5',
      labelColor: '#FFA500', // Orange
      activeBarColor: '#FFA500',
    },
    {
      name: '10',
      labelColor: '#FF0000', // Red
      activeBarColor: '#FF0000',
    },
    {
      name: '15',
      labelColor: '#8B0000', // Dark Red
      activeBarColor: '#8B0000',
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
          maxValue={15}
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
            { color: apiData ? mapDefectDensityToUI(defectDensity).uiColor : '#1F2937' }
          ]}>
            {defectDensity.toFixed(1)}
          </Text>
        </View>

        <View style={styles.klocDetailRow}>
          <Text style={styles.klocDetailLabel}>Status:</Text>
          <Text style={[
            styles.klocDetailValue,
            { color: apiData ? mapDefectDensityToUI(defectDensity).uiColor : '#6B7280' }
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
  defaultRemarks = 142
}) => {
  // Use API data if available, otherwise use default values
  const defects = apiData ? apiData.defects : defaultDefects;
  const remarks = apiData ? apiData.remarks : defaultRemarks;
  const ratio = apiData ? apiData.ratio : `${((remarks / defects) * 100).toFixed(2)}%`;
  const category = apiData ? apiData.category : 'Medium';
  const color = apiData ? apiData.color : 'Yellow';

  // Calculate ratio for display
  const ratioValue = defects > 0 ? (remarks / defects).toFixed(2) : '0.00';

  // Get UI color based on category
  const getCategoryColor = (cat: string) => {
    switch (cat.toLowerCase()) {
      case 'low':
        return '#00ff6b'; // Green
      case 'medium':
        return '#FFFF00'; // Yellow
      case 'high':
        return '#FF0000'; // Red
      default:
        return '#FFFF00'; // Default to yellow
    }
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
      <View style={styles.ratioSummary}>
        <Text style={styles.ratioSummaryLabel}>Ratio</Text>

        {/* Curved Rectangle with Color Background */}
        <View style={[
          styles.ratioValueContainer,
          { backgroundColor: getCategoryColor(category) }
        ]}>
          <Text style={styles.ratioSummaryValue}>
            {ratio}
          </Text>
        </View>

        <Text style={[
          styles.ratioSummaryDescription,
          { color: getCategoryColor(category) }
        ]}>
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

      // Fall back to mock data if API fails
      console.log('📱 Falling back to mock data...');
      const mockProjects = [
        { id: 'proj-1', name: 'Defect Tracker', description: 'Main defect tracking system' },
        { id: 'proj-2', name: 'QA Testing', description: 'Quality assurance testing' },
        { id: 'proj-3', name: 'project 1', description: 'First project' },
        { id: 'proj-4', name: 'project 2', description: 'Second project' },
        { id: 'proj-5', name: 'project 3', description: 'Third project' },
      ];
      setProjects(mockProjects);
      if (!selectedProject && mockProjects.length > 0) {
        setSelectedProject(mockProjects[0]);
      }
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

  // Mock data
  const mockProjects = [
    { id: 'proj-1', name: 'Defect Tracker', description: 'Main defect tracking system' },
    { id: 'proj-2', name: 'QA Testing', description: 'Quality assurance testing' },
    { id: 'proj-3', name: 'project 1', description: 'First project' },
    { id: 'proj-4', name: 'Heart', description: 'Heart monitoring system' },
    { id: 'proj-5', name: 'Dashboard testing', description: 'Dashboard testing project' },
    { id: 'proj-6', name: 'JALI', description: 'JALI project' },
    { id: 'proj-7', name: 'Hello world', description: 'Hello world project' },
    { id: 'proj-8', name: 'dashboard test', description: 'Dashboard test project' },
  ];

  const mockDefects = [
    // FUNCTIONALITY DEFECTS (Business Logic, Core Features)
    { id: '1', projectId: 'proj-1', title: 'Login function not working', description: 'User authentication function fails to validate credentials properly', severity: 'high' as const, status: 'OPEN' as const, assignedTo: 'dev1', createdAt: '2024-01-01', reopenCount: 2, module: 'employee' },
    { id: '2', projectId: 'proj-1', title: 'Business logic error in payment', description: 'Payment calculation function returns incorrect amounts', severity: 'critical' as const, status: 'NEW' as const, assignedTo: 'dev2', createdAt: '2024-01-02', reopenCount: 4, module: 'project' },
    { id: '3', projectId: 'proj-1', title: 'Data processing function crash', description: 'Core data processing logic throws exceptions', severity: 'high' as const, status: 'REOPEN' as const, assignedTo: 'dev3', createdAt: '2024-01-03', reopenCount: 3, module: 'project' },
    { id: '4', projectId: 'proj-1', title: 'Search functionality broken', description: 'Search function returns no results even with valid queries', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev1', createdAt: '2024-01-04', reopenCount: 2, module: 'project' },
    { id: '5', projectId: 'proj-1', title: 'Report generation logic error', description: 'Business report generation function produces incorrect data', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-01-05', reopenCount: 5, module: 'dashboard' },
    { id: '6', projectId: 'proj-1', title: 'Workflow function incomplete', description: 'Business workflow logic missing critical steps', severity: 'low' as const, status: 'NEW' as const, assignedTo: 'dev3', createdAt: '2024-01-06', module: 'projectManagement' },
    { id: '7', projectId: 'proj-1', title: 'API function timeout', description: 'Core API function times out under normal load', severity: 'high' as const, status: 'OPEN' as const, assignedTo: 'dev1', createdAt: '2024-01-07', reopenCount: 3, module: 'project' },
    { id: '8', projectId: 'proj-1', title: 'Database function error', description: 'Database connection function fails intermittently', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev2', createdAt: '2024-01-08' },

    // UI DEFECTS (Interface, Display, Layout)
    { id: '9', projectId: 'proj-1', title: 'Button UI alignment issue', description: 'Submit button UI is misaligned on mobile interface', severity: 'low' as const, status: 'NEW' as const, assignedTo: 'dev3', createdAt: '2024-01-09', reopenCount: 2, module: 'mainTemplate' },
    { id: '10', projectId: 'proj-1', title: 'Interface display problem', description: 'User interface elements overlap on smaller screens', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev1', createdAt: '2024-01-10', reopenCount: 4, module: 'mainTemplate' },
    { id: '11', projectId: 'proj-1', title: 'Layout broken on tablet', description: 'UI layout completely broken on tablet interface', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev2', createdAt: '2024-01-11', reopenCount: 6, module: 'mainTemplate' },
    { id: '12', projectId: 'proj-1', title: 'Display rendering issue', description: 'Chart display renders incorrectly in dark mode UI', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev3', createdAt: '2024-01-12', module: 'dashboard' },
    { id: '13', projectId: 'proj-1', title: 'Interface color scheme bug', description: 'UI color scheme inconsistent across different pages', severity: 'low' as const, status: 'OPEN' as const, assignedTo: 'dev1', createdAt: '2024-01-13', module: 'configurations' },
    { id: '14', projectId: 'proj-1', title: 'UI navigation menu broken', description: 'Interface navigation menu does not respond to clicks', severity: 'high' as const, status: 'REOPEN' as const, assignedTo: 'dev2', createdAt: '2024-01-14', module: 'mainTemplate' },

    // USABILITY DEFECTS (User Experience, UX)
    { id: '15', projectId: 'proj-1', title: 'Poor user experience flow', description: 'User experience is confusing during checkout process', severity: 'medium' as const, status: 'NEW' as const, assignedTo: 'dev3', createdAt: '2024-01-15', module: 'employee' },
    { id: '16', projectId: 'proj-1', title: 'UX navigation confusing', description: 'User experience navigation is not intuitive for new users', severity: 'low' as const, status: 'OPEN' as const, assignedTo: 'dev1', createdAt: '2024-01-16', module: 'mainTemplate' },
    { id: '17', projectId: 'proj-1', title: 'Usability issue with forms', description: 'Form usability is poor, users cannot complete tasks easily', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev2', createdAt: '2024-01-17', module: 'employee' },
    { id: '18', projectId: 'proj-1', title: 'User experience accessibility', description: 'UX lacks proper accessibility features for disabled users', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev3', createdAt: '2024-01-18', module: 'configurations' },

    // VALIDATION DEFECTS (Input, Form, Data Validation)
    { id: '19', projectId: 'proj-1', title: 'Input validation missing', description: 'Form input validation allows invalid email addresses', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev1', createdAt: '2024-01-19', module: 'employee' },
    { id: '20', projectId: 'proj-1', title: 'Form validation error', description: 'Registration form validation accepts empty required fields', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev2', createdAt: '2024-01-20', module: 'employee' },
    { id: '21', projectId: 'proj-1', title: 'Data validation bypass', description: 'Input validation can be bypassed allowing malicious data', severity: 'critical' as const, status: 'REOPEN' as const, assignedTo: 'dev3', createdAt: '2024-01-21', module: 'defects' },
    { id: '22', projectId: 'proj-1', title: 'Input field validation bug', description: 'Phone number input validation accepts invalid formats', severity: 'low' as const, status: 'FIXED' as const, assignedTo: 'dev1', createdAt: '2024-01-22', module: 'employee' },
    { id: '23', projectId: 'proj-1', title: 'Form validation inconsistent', description: 'Validation rules inconsistent across different forms', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-01-23', module: 'configurations' },

    // PERFORMANCE DEFECTS (Speed, Loading, Optimization)
    { id: '24', projectId: 'proj-1', title: 'Slow loading performance', description: 'Page loading performance is extremely slow on mobile devices', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev3', createdAt: '2024-01-24', module: 'project' },
    { id: '25', projectId: 'proj-1', title: 'Performance degradation', description: 'Application performance degrades significantly after extended use', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev1', createdAt: '2024-01-25', module: 'project' },
    { id: '26', projectId: 'proj-1', title: 'Speed optimization needed', description: 'Database query speed is unacceptably slow for large datasets', severity: 'high' as const, status: 'FIXED' as const, assignedTo: 'dev2', createdAt: '2024-01-26' },
    { id: '27', projectId: 'proj-1', title: 'Performance memory leak', description: 'Memory usage increases over time causing performance issues', severity: 'critical' as const, status: 'REOPEN' as const, assignedTo: 'dev3', createdAt: '2024-01-27' },

    // SECURITY DEFECTS (Authentication, Authorization, Permissions)
    { id: '28', projectId: 'proj-1', title: 'Security authentication flaw', description: 'Authentication system has security vulnerability allowing bypass', severity: 'critical' as const, status: 'NEW' as const, assignedTo: 'dev1', createdAt: '2024-01-28' },
    { id: '29', projectId: 'proj-1', title: 'Permission security issue', description: 'User permission system allows unauthorized access to admin features', severity: 'high' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-01-29' },
    { id: '30', projectId: 'proj-1', title: 'Auth token security bug', description: 'Security tokens do not expire properly leaving system vulnerable', severity: 'high' as const, status: 'FIXED' as const, assignedTo: 'dev3', createdAt: '2024-01-30' },

    // OTHER DEFECTS (Miscellaneous)
    { id: '31', projectId: 'proj-1', title: 'Configuration file missing', description: 'Application configuration file not found in production environment', severity: 'medium' as const, status: 'NEW' as const, assignedTo: 'dev1', createdAt: '2024-01-31' },
    { id: '32', projectId: 'proj-1', title: 'Documentation outdated', description: 'Technical documentation does not match current implementation', severity: 'low' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-02-01' },
    { id: '33', projectId: 'proj-1', title: 'Logging system error', description: 'Application logging system fails to write error logs properly', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev3', createdAt: '2024-02-02' },
    { id: '34', projectId: 'proj-1', title: 'Backup process failure', description: 'Automated backup process fails silently without notification', severity: 'high' as const, status: 'REOPEN' as const, assignedTo: 'dev1', createdAt: '2024-02-03' },

    // PROJECT 2 DEFECTS - Different distribution pattern
    { id: '35', projectId: 'proj-2', title: 'UI responsive design broken', description: 'Interface layout breaks on mobile devices', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev2', createdAt: '2024-02-04', reopenCount: 3, module: 'mainTemplate' },
    { id: '36', projectId: 'proj-2', title: 'Display rendering glitch', description: 'UI elements flicker during page transitions', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev3', createdAt: '2024-02-05', reopenCount: 2, module: 'mainTemplate' },
    { id: '37', projectId: 'proj-2', title: 'Interface color bug', description: 'UI color scheme changes unexpectedly', severity: 'low' as const, status: 'FIXED' as const, assignedTo: 'dev1', createdAt: '2024-02-06', reopenCount: 4, module: 'configurations' },
    { id: '38', projectId: 'proj-2', title: 'Layout alignment issue', description: 'UI layout misaligned on different screen sizes', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-02-07' },
    { id: '39', projectId: 'proj-2', title: 'Form validation error', description: 'Input validation fails for special characters', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev3', createdAt: '2024-02-08' },
    { id: '40', projectId: 'proj-2', title: 'Input field validation', description: 'Form validation allows invalid data entry', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev1', createdAt: '2024-02-09' },
    { id: '41', projectId: 'proj-2', title: 'Performance slow loading', description: 'Page loading speed is unacceptably slow', severity: 'high' as const, status: 'REOPEN' as const, assignedTo: 'dev2', createdAt: '2024-02-10' },
    { id: '42', projectId: 'proj-2', title: 'Speed optimization issue', description: 'Application performance degrades over time', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev3', createdAt: '2024-02-11' },

    // PROJECT 3 DEFECTS - Security-heavy distribution
    { id: '43', projectId: 'proj-3', title: 'Security authentication bypass', description: 'Auth system vulnerability allows unauthorized access', severity: 'critical' as const, status: 'NEW' as const, assignedTo: 'dev1', createdAt: '2024-02-12', reopenCount: 5, module: 'employee' },
    { id: '44', projectId: 'proj-3', title: 'Permission security flaw', description: 'User permissions can be escalated illegally', severity: 'critical' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-02-13', reopenCount: 2, module: 'employee' },
    { id: '45', projectId: 'proj-3', title: 'Auth token vulnerability', description: 'Security tokens exposed in client-side code', severity: 'high' as const, status: 'REOPEN' as const, assignedTo: 'dev3', createdAt: '2024-02-14' },
    { id: '46', projectId: 'proj-3', title: 'Security encryption weak', description: 'Data encryption algorithm is outdated and vulnerable', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev1', createdAt: '2024-02-15' },
    { id: '47', projectId: 'proj-3', title: 'Function logic error', description: 'Core business function returns incorrect results', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev2', createdAt: '2024-02-16' },
    { id: '48', projectId: 'proj-3', title: 'Business logic flaw', description: 'Payment processing function has calculation errors', severity: 'high' as const, status: 'OPEN' as const, assignedTo: 'dev3', createdAt: '2024-02-17' },

    // PROJECT 4 DEFECTS - Performance-focused distribution
    { id: '49', projectId: 'proj-4', title: 'Performance memory leak', description: 'Application memory usage grows continuously', severity: 'critical' as const, status: 'NEW' as const, assignedTo: 'dev1', createdAt: '2024-02-18' },
    { id: '50', projectId: 'proj-4', title: 'Slow database performance', description: 'Database queries take excessive time to complete', severity: 'high' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-02-19' },
    { id: '51', projectId: 'proj-4', title: 'Speed optimization needed', description: 'API response times are unacceptably slow', severity: 'high' as const, status: 'REOPEN' as const, assignedTo: 'dev3', createdAt: '2024-02-20' },
    { id: '52', projectId: 'proj-4', title: 'Performance bottleneck', description: 'System performance degrades under normal load', severity: 'medium' as const, status: 'FIXED' as const, assignedTo: 'dev1', createdAt: '2024-02-21' },
    { id: '53', projectId: 'proj-4', title: 'Function timeout error', description: 'Core business function times out frequently', severity: 'medium' as const, status: 'NEW' as const, assignedTo: 'dev2', createdAt: '2024-02-22' },
    { id: '54', projectId: 'proj-4', title: 'Logic processing slow', description: 'Business logic processing is inefficient', severity: 'low' as const, status: 'OPEN' as const, assignedTo: 'dev3', createdAt: '2024-02-23' },

    // PROJECT 5 DEFECTS - Usability-focused distribution
    { id: '55', projectId: 'proj-5', title: 'User experience confusing', description: 'UX flow is not intuitive for end users', severity: 'high' as const, status: 'NEW' as const, assignedTo: 'dev1', createdAt: '2024-02-24' },
    { id: '56', projectId: 'proj-5', title: 'Usability navigation poor', description: 'User navigation experience is frustrating', severity: 'medium' as const, status: 'OPEN' as const, assignedTo: 'dev2', createdAt: '2024-02-25' },
    { id: '57', projectId: 'proj-5', title: 'UX accessibility missing', description: 'User experience lacks accessibility features', severity: 'high' as const, status: 'FIXED' as const, assignedTo: 'dev3', createdAt: '2024-02-26' },
    { id: '58', projectId: 'proj-5', title: 'Usability form design', description: 'Form usability is poor, users struggle to complete', severity: 'medium' as const, status: 'REOPEN' as const, assignedTo: 'dev1', createdAt: '2024-02-27' },
    { id: '59', projectId: 'proj-5', title: 'User experience workflow', description: 'UX workflow has too many unnecessary steps', severity: 'low' as const, status: 'NEW' as const, assignedTo: 'dev2', createdAt: '2024-02-28' },
    { id: '60', projectId: 'proj-5', title: 'Function calculation bug', description: 'Mathematical function returns wrong calculations', severity: 'high' as const, status: 'OPEN' as const, assignedTo: 'dev3', createdAt: '2024-03-01' },
  ];

  useEffect(() => {
    // Initialize defects with mock data
    setDefects(mockDefects);

    // Fetch projects from API
    fetchProjectsFromApi();
  }, []);

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
    const projectDefects = defects.filter(d => d.projectId === project.id);
    const highCount = projectDefects.filter(d => d.severity === 'high' || d.severity === 'critical').length;
    const mediumCount = projectDefects.filter(d => d.severity === 'medium').length;
    
    if (highCount > 0) return 'High Risk';
    if (mediumCount > 0) return 'Medium Risk';
    return 'Low Risk';
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
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{getProjectRiskStatus(selectedProject)}</Text>
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
            {renderSeverityPanel('high', 'High Defects', '#EF4444')}
            {renderSeverityPanel('medium', 'Medium Defects', '#F59E0B')}
            {renderSeverityPanel('low', 'Low Defects', '#10B981')}
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
          <Text style={styles.severityIndexTitle}>Defect Severity Index</Text>

          <View style={styles.severityIndexContent}>
            {/* Severity Index Gauge */}
            <View style={styles.severityGaugeContainer}>
              <View style={styles.severityGauge}>
                {/* Background Track */}
                <View style={styles.severityGaugeTrack} />

                {/* Progress Fill */}
                <View style={[styles.severityGaugeFill, {
                  width: '68%', // 68% represents severity index of 6.8/10
                  backgroundColor: '#F97316', // Orange for moderate-high severity
                }]} />
              </View>

              {/* Index Value Display - Outside the meter */}
              <View style={styles.severityIndexDisplay}>
                <Text style={styles.severityIndexValue}>6.8</Text>
                <Text style={styles.severityIndexMax}>/ 10</Text>
              </View>

              {/* Severity Level Indicator */}
              <View style={styles.severityLevelContainer}>
                <Text style={styles.severityLevelLabel}>Severity Level</Text>
                <View style={[styles.severityLevelBadge, { backgroundColor: '#F97316' }]}>
                  <Text style={styles.severityLevelText}>Moderate-High</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Defect Type Distribution Pie Chart */}
        <DefectTypeDistribution
          selectedProjectId={selectedProject?.id}
          defects={defects}
          projects={projects}
        />

        {/* Defects Reopened Multiple Times Pie Chart */}
        <DefectsReopenedChart
          selectedProjectId={selectedProject?.id}
          defects={defects}
          projects={projects}
        />

        {/* Defects by Module Pie Chart */}
        <DefectsByModuleChart
          selectedProjectId={selectedProject?.id}
          defects={defects}
          projects={projects}
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
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    color: colors.system.red,
    fontWeight: '600',
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
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  ratioSummaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
  },
  ratioValueContainer: {
    backgroundColor: '#FFFF00', // Default yellow, will be overridden by dynamic color
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
    color: '#FFFFFF', // White text for better contrast on colored background
  },
  ratioSummaryDescription: {
    fontSize: 12,
    color: colors.text.secondary,
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

});

export default ProjectDashboard;
