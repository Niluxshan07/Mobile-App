import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';

const { height } = Dimensions.get('window');
import { useThemedStyles, useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { getProjects, transformProjectsForApp, ProjectData, ProjectApiError } from '../api/GetProject';
import { getProjectCardColor, ProjectCardColorData, ProjectCardColorApiError, convertGradientToRNStyle } from '../api/GetProjectCardColor';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface HomeProps {
  user: User | null;
  onNavigateToProfile: () => void;
  onNavigateToProjectDashboard: (projectId: string) => void;
  onNavigateToSettings: () => void;
}

const { width } = Dimensions.get('window');

const Home: React.FC<HomeProps> = ({ user, onNavigateToProfile, onNavigateToProjectDashboard, onNavigateToSettings }) => {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // API state management
  const [projects, setProjects] = useState<any[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState<boolean>(true);
  const [projectsError, setProjectsError] = useState<string | null>(null);

  // Project Card Color API state
  const [projectCardColors, setProjectCardColors] = useState<{ [key: string]: ProjectCardColorData }>({});
  const [isLoadingCardColors, setIsLoadingCardColors] = useState<boolean>(false);
  const [cardColorsError, setCardColorsError] = useState<string | null>(null);
  const [colorUpdateTrigger, setColorUpdateTrigger] = useState<number>(0); // Force re-render when colors update

  // Fetch projects from API
  const fetchProjects = async () => {
    try {
      setIsLoadingProjects(true);
      setProjectsError(null);
      console.log('🏠 Fetching projects for Home page...');

      const apiProjects = await getProjects();
      const transformedProjects = transformProjectsForApp(apiProjects);

      console.log('✅ Projects loaded successfully:', transformedProjects.length);
      setProjects(transformedProjects);
    } catch (error) {
      console.error('❌ Failed to fetch projects:', error);

      if (error instanceof ProjectApiError) {
        setProjectsError(`API Error: ${error.message}`);
      } else {
        setProjectsError('Failed to load projects. Please check your connection.');
      }

      // No fallback - show error state instead
      setProjects([]);
    } finally {
      setIsLoadingProjects(false);
    }
  };

  // Fetch project card colors from API
  const fetchProjectCardColors = async (projectIds: number[]) => {
    if (projectIds.length === 0) return;

    try {
      setIsLoadingCardColors(true);
      setCardColorsError(null);
      console.log('🎨 Fetching project card colors for projects:', projectIds);

      const colorPromises = projectIds.map(async (projectId) => {
        try {
          const colorData = await getProjectCardColor(projectId);
          return { projectId: projectId.toString(), colorData };
        } catch (error) {
          console.warn(`⚠️ Failed to fetch color for project ${projectId}:`, error);
          return null;
        }
      });

      const colorResults = await Promise.allSettled(colorPromises);
      const newCardColors: { [key: string]: ProjectCardColorData } = {};

      colorResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          const { projectId, colorData } = result.value;
          newCardColors[projectId] = colorData;
        }
      });

      console.log('✅ Project card colors loaded:', Object.keys(newCardColors).length);
      console.log('🎨 Card colors data:', JSON.stringify(newCardColors, null, 2));
      setProjectCardColors(newCardColors);

      // Test color conversion for debugging
      Object.entries(newCardColors).forEach(([projectId, colorData]) => {
        const convertedColor = convertGradientToRNStyle(colorData.projectCardColor);
        console.log(`🎨 Color conversion test - Project ${projectId}: ${colorData.projectCardColor} -> ${convertedColor}`);
      });

      // Force re-render of project cards
      setColorUpdateTrigger(prev => prev + 1);

    } catch (error) {
      console.error('❌ Error fetching project card colors:', error);
      if (error instanceof ProjectCardColorApiError) {
        setCardColorsError(`${error.apiStatus}: ${error.message}`);
      } else {
        setCardColorsError('Failed to load project card colors');
      }
    } finally {
      setIsLoadingCardColors(false);
    }
  };

  // Load projects on component mount
  useEffect(() => {
    console.log('🏠 Home component mounted, fetching projects...');
    fetchProjects();
  }, []);

  // Fetch card colors when projects are loaded
  useEffect(() => {
    if (projects.length > 0) {
      console.log('🎨 Projects loaded, preparing to fetch card colors:', projects.map(p => ({ id: p.id, name: p.name, numericId: (p as any).numericId })));

      const projectIds = projects
        .map(project => {
          // Use numericId if available, otherwise try to parse the id
          const numericId = (project as any).numericId || parseInt(project.id);
          console.log(`🎨 Project ${project.name}: id=${project.id}, numericId=${(project as any).numericId}, parsed=${numericId}`);
          return numericId;
        })
        .filter(id => !isNaN(id) && id > 0);

      console.log('🎨 Valid project IDs for color fetching:', projectIds);

      if (projectIds.length > 0) {
        fetchProjectCardColors(projectIds);
      } else {
        console.warn('⚠️ No valid numeric project IDs found for color fetching');
      }
    }
  }, [projects]);

  // Calculate risk counts based on API data from projectCardColors
  const riskCounts = useMemo(() => {
    if (projects.length === 0) {
      return { high: 0, medium: 0, low: 0 };
    }

    // If no project card colors data, show all projects as low risk
    if (!projectCardColors) {
      console.log('⚠️ No project card colors data available, showing all projects as low risk');
      return { high: 0, medium: 0, low: projects.length };
    }

    let high = 0;
    let medium = 0;
    let low = 0;

    projects.forEach(project => {
      // Get the numeric ID for API lookup
      const numericId = (project as any).numericId || parseInt(project.id);
      const projectColorData = projectCardColors[project.id] || projectCardColors[numericId?.toString()];

      if (projectColorData && projectColorData.availableRiskLevels) {
        const riskLevels = projectColorData.availableRiskLevels;

        // Determine the highest risk level for this project
        if (riskLevels.includes('High')) {
          high++;
        } else if (riskLevels.includes('Medium')) {
          medium++;
        } else if (riskLevels.includes('Low')) {
          low++;
        } else {
          // If no specific risk level, default to low
          low++;
        }
      } else {
        // If no API data available, default to low risk
        console.log(`   Project ${project.id} (${project.projectName}): No API data, defaulting to LOW risk`);
        low++;
      }
    });

    console.log('📊 Risk calculation results:', { high, medium, low, totalProjects: projects.length });
    console.log('📊 Project card colors available:', projectCardColors ? Object.keys(projectCardColors).length : 0, 'projects');
    return { high, medium, low };
  }, [projects, projectCardColors]);

  const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  // Helper function to adjust color brightness
  const adjustColorBrightness = (hexColor: string, percent: number): string => {
    // Remove # if present
    const hex = hexColor.replace('#', '');

    // Parse RGB values
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    // Adjust brightness
    const adjustedR = Math.max(0, Math.min(255, r + (r * percent / 100)));
    const adjustedG = Math.max(0, Math.min(255, g + (g * percent / 100)));
    const adjustedB = Math.max(0, Math.min(255, b + (b * percent / 100)));

    // Convert back to hex
    const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0');
    return `#${toHex(adjustedR)}${toHex(adjustedG)}${toHex(adjustedB)}`;
  };

  const ProjectCard = ({
    project,
    risk,
    projectCardColors
  }: {
    project: any;
    risk: 'high' | 'medium' | 'low';
    projectCardColors?: { [key: string]: ProjectCardColorData };
  }) => {
    const getGradientColors = () => {
      // Check if we have API color data for this project
      // Try both string ID and numeric ID as keys
      const numericId = (project as any).numericId || parseInt(project.id);
      const projectColorData = projectCardColors ?
        (projectCardColors[project.id] || projectCardColors[numericId?.toString()]) :
        undefined;

      console.log(`🎨 Project ${project.id} (${project.name}):`, {
        stringId: project.id,
        numericId: numericId,
        hasApiData: !!projectColorData,
        apiColor: projectColorData?.projectCardColor,
        riskLevel: risk,
        availableRiskLevels: projectColorData?.availableRiskLevels,
        availableKeys: projectCardColors ? Object.keys(projectCardColors) : []
      });

      if (projectColorData && projectColorData.projectCardColor) {
        // Use API color data
        const apiColor = convertGradientToRNStyle(projectColorData.projectCardColor);
        // Create a gradient effect by using slightly different shades
        const baseColor = apiColor;
        const darkerColor = adjustColorBrightness(apiColor, -20); // Darker shade

        console.log(`🎨 Using API colors for ${project.name}:`, [baseColor, darkerColor]);
        return [baseColor, darkerColor];
      }

      // Use default neutral colors if no API data
      const defaultColors = ['#6B7280', '#4B5563']; // Gray gradient
      console.log(`🎨 Using default colors for ${project.name} (no API data):`, defaultColors);
      return defaultColors;
    };

    const getRiskLabel = () => {
      // Check if we have API color data for this project
      const numericId = (project as any).numericId || parseInt(project.id);
      const projectColorData = projectCardColors ?
        (projectCardColors[project.id] || projectCardColors[numericId?.toString()]) :
        undefined;

      if (projectColorData && projectColorData.availableRiskLevels) {
        // Use the highest risk level from API data
        const riskLevels = projectColorData.availableRiskLevels;
        if (riskLevels.includes('High')) return 'High Risk';
        if (riskLevels.includes('Medium')) return 'Medium Risk';
        if (riskLevels.includes('Low')) return 'Low Risk';
      }

      // No fallback - show unknown if no API data
      return 'Risk Level Unknown';
    };

    const [startColor, endColor] = getGradientColors();

    return (
      <TouchableOpacity
        style={styles.circularProjectCard}
        onPress={() => onNavigateToProjectDashboard(project.id)}
      >
        {/* Gradient Background Simulation */}
        <View style={[styles.gradientLayer, { backgroundColor: startColor }]} />
        <View style={[styles.gradientOverlay, { backgroundColor: endColor }]} />

        {/* Content */}
        <View style={styles.cardContent}>
          {/* Check Icon */}
          <View style={styles.checkIcon}>
            <Text style={styles.checkIconText}>✓</Text>
          </View>

          {/* Project Name */}
          <Text style={styles.circularProjectName}>{project.name}</Text>

          {/* Risk Status */}
          <Text style={styles.circularRiskStatus}>{getRiskLabel()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const RiskSummaryCard = ({
    title,
    count,
    color,
    bgColor
  }: {
    title: string;
    count: number;
    color: string;
    bgColor: string;
  }) => (
    <View style={[styles.riskCard, { backgroundColor: bgColor, borderColor: color }]}>
      {/* Header Section */}
      <View style={styles.riskCardHeader}>
        <Text style={styles.riskCardTitle} numberOfLines={2} ellipsizeMode="tail">{title}</Text>
        <View style={[styles.riskIndicator, { backgroundColor: color }]} />
      </View>

      {/* Count Section */}
      <View style={styles.riskCardCountContainer}>
        <Text style={[styles.riskCardCount, { color }]}>{count}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.appTitleSection}>
            <View style={styles.titleContainer}>
              <Text style={styles.appTitle}>ZEROBUG</Text>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationButton}>
              <Image
                source={require('../assets/notification.png')}
                style={styles.notificationIcon}
                resizeMode="cover"
              />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isLoadingProjects}
              onRefresh={fetchProjects}
              colors={['#007AFF']}
              tintColor="#007AFF"
            />
          }
        >
          {!selectedProjectId ? (
            <>
              {/* Project Status Insights */}
              <View style={styles.dashboardCard}>
                <Text style={styles.cardTitle}>Project Status Insights</Text>
                <View style={styles.riskSummaryGrid}>
                  <RiskSummaryCard
                    title="High Risk Projects"
                    count={riskCounts.high}
                    color={isDark ? "#EF5350" : "#EF4444"}
                    bgColor={isDark ? "#2D1B1B" : "#FEF2F2"}
                  />
                  <RiskSummaryCard
                    title="Medium Risk Projects"
                    count={riskCounts.medium}
                    color={isDark ? "#FF9800" : "#F59E0B"}
                    bgColor={isDark ? "#2D2419" : "#FFFBEB"}
                  />
                  <RiskSummaryCard
                    title="Low Risk Projects"
                    count={riskCounts.low}
                    color={isDark ? "#66BB6A" : "#22C55E"}
                    bgColor={isDark ? "#1B2D1B" : "#F0FDF4"}
                  />
                </View>
              </View>

              {/* All Projects */}
              <View style={styles.projectsCard}>
                <View style={styles.projectsHeader}>
                  <Text style={styles.cardTitle}>All Projects</Text>
                  <View style={styles.inlineFilterButtons}>
                    <TouchableOpacity
                      style={[styles.inlineFilterButton, riskFilter === 'all' && styles.inlineFilterButtonActive]}
                      onPress={() => setRiskFilter('all')}
                    >
                      <Text style={[styles.inlineFilterButtonText, riskFilter === 'all' && styles.inlineFilterButtonTextActive]}>
                        All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inlineFilterButton, styles.inlineFilterButtonHigh, riskFilter === 'high' && styles.inlineFilterButtonHighActive]}
                      onPress={() => setRiskFilter('high')}
                    >
                      <Text style={[styles.inlineFilterButtonText, riskFilter === 'high' && styles.inlineFilterButtonTextActive]}>
                        High Risk
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inlineFilterButton, styles.inlineFilterButtonMedium, riskFilter === 'medium' && styles.inlineFilterButtonMediumActive]}
                      onPress={() => setRiskFilter('medium')}
                    >
                      <Text style={[styles.inlineFilterButtonText, riskFilter === 'medium' && styles.inlineFilterButtonTextActive]}>
                        Medium Risk
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.inlineFilterButton, styles.inlineFilterButtonLow, riskFilter === 'low' && styles.inlineFilterButtonLowActive]}
                      onPress={() => setRiskFilter('low')}
                    >
                      <Text style={[styles.inlineFilterButtonText, riskFilter === 'low' && styles.inlineFilterButtonTextActive]}>
                        Low Risk
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {isLoadingProjects ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading projects...</Text>
                  </View>
                ) : isLoadingCardColors ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#007AFF" />
                    <Text style={styles.loadingText}>Loading project colors...</Text>
                  </View>
                ) : projectsError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{projectsError}</Text>
                    <TouchableOpacity style={styles.retryButton} onPress={fetchProjects}>
                      <Text style={styles.retryButtonText}>Retry</Text>
                    </TouchableOpacity>
                  </View>
                ) : projects.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No projects found</Text>
                  </View>
                ) : (
                  <View style={styles.projectsGrid}>
                    {projects.map((project) => {
                      // Get risk level from API data
                      const numericId = (project as any).numericId || parseInt(project.id);
                      const projectColorData = projectCardColors ?
                        (projectCardColors[project.id] || projectCardColors[numericId?.toString()]) :
                        undefined;

                      let risk: 'high' | 'medium' | 'low' = 'low';

                      if (projectColorData && projectColorData.availableRiskLevels && projectColorData.availableRiskLevels.length > 0) {
                        const riskLevels = projectColorData.availableRiskLevels;

                        // Determine the highest risk level for this project
                        if (riskLevels.includes('High')) {
                          risk = 'high';
                        } else if (riskLevels.includes('Medium')) {
                          risk = 'medium';
                        } else if (riskLevels.includes('Low')) {
                          risk = 'low';
                        }
                      } else {
                        // If no API data or empty risk levels, default to low risk
                        risk = 'low';
                      }

                      if (riskFilter !== 'all' && risk !== riskFilter) return null;

                      return (
                        <ProjectCard
                          key={`${project.id}-${colorUpdateTrigger}`}
                          project={project}
                          risk={risk}
                          projectCardColors={projectCardColors}
                        />
                      );
                    })}
                  </View>
                )}
              </View>
            </>
          ) : (
            // Project Dashboard View
            <View style={styles.projectDashboard}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => setSelectedProjectId(null)}
              >
                <Text style={styles.backButtonText}>Back to Projects</Text>
              </TouchableOpacity>

              <View style={styles.dashboardCard}>
                <Text style={styles.cardTitle}>
                  {projects.find(p => p.id === selectedProjectId)?.name} Dashboard
                </Text>
                <Text style={styles.projectDashboardText}>
                  Project dashboard view coming soon...
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={styles.footer}>
          <TouchableOpacity style={styles.footerButton}>
            <Image
              source={require('../assets/home.png')}
              style={[styles.footerIcon, styles.activeFooterIcon]}
              resizeMode="cover"
            />
            <Text style={[styles.footerText, styles.activeFooterText]}>Home</Text>
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
    </View>
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
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 20,
    marginBottom: 20,
  },
  appTitleSection: {
    flex: 1,
  },
  titleContainer: {
    alignSelf: 'flex-start',
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },


  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    fontFamily: 'System',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  notificationIcon: {
    width: 24,
    height: 24,
    tintColor: '#FFFFFF',
  },

  content: {
    flex: 1,
    paddingHorizontal: 12,
  },
  dashboardCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  defectsCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  actionsCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 80) / 2,
    backgroundColor: isDark ? colors.background.secondary : '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 11,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  defectCard: {
    backgroundColor: isDark ? colors.background.secondary : '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: colors.system.blue,
  },
  defectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  defectId: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.system.blue,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  defectTitle: {
    fontSize: 15,
    color: colors.text.primary,
    marginBottom: 8,
    fontWeight: '500',
  },
  defectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  defectAssignee: {
    fontSize: 12,
    color: colors.text.secondary,
  },
  defectDate: {
    fontSize: 12,
    color: colors.text.tertiary,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: isDark ? colors.background.secondary : '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#E2E8F0',
  },
  actionIcon: {
    fontSize: 14,
    marginBottom: 8,
    color: colors.system.blue,
    fontWeight: 'bold',
  },
  actionText: {
    fontSize: 12,
    color: colors.text.secondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  // Risk Summary Styles
  riskSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  riskCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    minHeight: 100,
    justifyContent: 'space-between',
  },
  riskCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    minHeight: 24,
  },
  riskCardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text.primary,
    flex: 1,
    textAlign: 'left',
    lineHeight: 16,
  },
  riskIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  riskCardCount: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 28,
  },
  riskCardCountContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 40,
  },

  // Inline Filter Styles
  projectsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 8,
  },
  inlineFilterButtons: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  inlineFilterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: isDark ? colors.background.secondary : '#F8FAFC',
    borderWidth: 1,
    borderColor: isDark ? colors.border : '#E2E8F0',
  },
  inlineFilterButtonActive: {
    backgroundColor: colors.system.blue,
    borderColor: colors.system.blue,
  },
  inlineFilterButtonHigh: {
    backgroundColor: isDark ? '#2D1B1B' : '#FEF2F2',
    borderColor: isDark ? '#4A2626' : '#FECACA',
  },
  inlineFilterButtonHighActive: {
    backgroundColor: isDark ? colors.system.red : '#EF4444',
    borderColor: isDark ? colors.system.red : '#EF4444',
  },
  inlineFilterButtonMedium: {
    backgroundColor: isDark ? '#2D2419' : '#FFFBEB',
    borderColor: isDark ? '#4A3D26' : '#FED7AA',
  },
  inlineFilterButtonMediumActive: {
    backgroundColor: isDark ? colors.system.orange : '#F59E0B',
    borderColor: isDark ? colors.system.orange : '#F59E0B',
  },
  inlineFilterButtonLow: {
    backgroundColor: isDark ? '#1B2D1B' : '#F0FDF4',
    borderColor: isDark ? '#264A26' : '#BBF7D0',
  },
  inlineFilterButtonLowActive: {
    backgroundColor: isDark ? colors.system.green : '#22C55E',
    borderColor: isDark ? colors.system.green : '#22C55E',
  },
  inlineFilterButtonText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.text.primary,
  },
  inlineFilterButtonTextActive: {
    color: '#FFFFFF',
  },
  // Project Card Styles
  projectsCard: {
    backgroundColor: colors.background.elevated,
    borderRadius: 20,
    padding: 12,
    marginBottom: 20,
    shadowColor: isDark ? colors.system.gray6 : '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: isDark ? 0.3 : 0.1,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: isDark ? 1 : 0,
    borderColor: colors.border,
  },
  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 12,
    paddingVertical: 4,
  },
  // Circular Project Card Styles
  circularProjectCard: {
    width: 140,
    height: 140,
    borderRadius: 70,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradientLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 70,
    opacity: 0.7,
  },
  cardContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  circularProjectName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  circularRiskStatus: {
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 1,
    fontWeight: '600',
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  // Project Dashboard Styles
  projectDashboard: {
    flex: 1,
  },
  backButton: {
    backgroundColor: isDark ? colors.background.secondary : '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    color: colors.text.primary,
    fontWeight: '600',
  },
  projectDashboardText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: 20,
  },
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
  // Loading, Error, and Empty States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 16,
    color: colors.text.secondary,
    marginTop: 12,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorText: {
    fontSize: 16,
    color: colors.system.red,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: colors.system.blue,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
  },
});

export default Home;