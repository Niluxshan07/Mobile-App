import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');
import { useThemedStyles, useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

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

  // Mock projects data
  const projects = [
    {
      id: 'proj-1',
      name: 'E-Commerce Platform',
      description: 'Main shopping platform',
    },
    {
      id: 'proj-2',
      name: 'Mobile Banking App',
      description: 'iOS and Android banking application',
    },
    {
      id: 'proj-3',
      name: 'Customer Portal',
      description: 'Self-service customer portal',
    },
    {
      id: 'proj-4',
      name: 'Analytics Dashboard',
      description: 'Business intelligence dashboard',
    },
    {
      id: 'proj-5',
      name: 'Payment Gateway',
      description: 'Secure payment processing system',
    },
    {
      id: 'proj-6',
      name: 'Inventory Management',
      description: 'Stock and inventory tracking',
    },
  ];

  // Mock defects data with project associations
  const defects = [
    { id: 'DEF-001', projectId: 'proj-1', severity: 'high', title: 'Login page not responsive' },
    { id: 'DEF-002', projectId: 'proj-1', severity: 'critical', title: 'Database connection timeout' },
    { id: 'DEF-003', projectId: 'proj-1', severity: 'medium', title: 'UI alignment issues' },
    { id: 'DEF-004', projectId: 'proj-2', severity: 'high', title: 'App crashes on startup' },
    { id: 'DEF-005', projectId: 'proj-2', severity: 'low', title: 'Minor text alignment' },
    { id: 'DEF-006', projectId: 'proj-3', severity: 'medium', title: 'Slow loading times' },
    { id: 'DEF-007', projectId: 'proj-4', severity: 'low', title: 'Chart rendering issue' },
    { id: 'DEF-008', projectId: 'proj-5', severity: 'critical', title: 'Payment processing error' },
    { id: 'DEF-009', projectId: 'proj-5', severity: 'high', title: 'Security vulnerability' },
    { id: 'DEF-010', projectId: 'proj-6', severity: 'low', title: 'Export functionality' },
  ];

  // Calculate risk counts
  const riskCounts = {
    high: projects.filter(project => {
      const projectDefects = defects.filter(d => d.projectId === project.id);
      return projectDefects.some(d => d.severity === 'high' || d.severity === 'critical');
    }).length,
    medium: projects.filter(project => {
      const projectDefects = defects.filter(d => d.projectId === project.id);
      return projectDefects.some(d => d.severity === 'medium') &&
             !projectDefects.some(d => d.severity === 'high' || d.severity === 'critical');
    }).length,
    low: projects.filter(project => {
      const projectDefects = defects.filter(d => d.projectId === project.id);
      return !projectDefects.some(d => d.severity === 'high' || d.severity === 'critical' || d.severity === 'medium');
    }).length,
  };

  const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );

  const ProjectCard = ({
    project,
    risk
  }: {
    project: any;
    risk: 'high' | 'medium' | 'low';
  }) => {
    const getGradientColors = () => {
      switch (risk) {
        case 'high':
          return ['#DC2626', '#B91C1C']; // from-red-600 to-red-700 (more vibrant red)
        case 'medium':
          return ['#FBBF24', '#F59E0B']; // from-yellow-400 to-yellow-500 (proper yellow gradient)
        case 'low':
          return ['#22C55E', '#16A34A']; // from-green-500 to-green-600 (brighter green)
        default:
          return ['#6B7280', '#4B5563'];
      }
    };

    const getRiskLabel = () => {
      switch (risk) {
        case 'high': return 'High Risk';
        case 'medium': return 'Medium Risk';
        case 'low': return 'Low Risk';
        default: return 'Unknown';
      }
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
            <View style={styles.glassBackground}>
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

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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
                <View style={styles.projectsGrid}>
                  {projects.map((project) => {
                    const projectDefects = defects.filter(d => d.projectId === project.id);
                    const highCount = projectDefects.filter(d => d.severity === 'high' || d.severity === 'critical').length;
                    const mediumCount = projectDefects.filter(d => d.severity === 'medium').length;
                    const lowCount = projectDefects.filter(d => d.severity === 'low').length;

                    let risk: 'high' | 'medium' | 'low' = 'low';
                    if (highCount > 0) risk = 'high';
                    else if (mediumCount > 0) risk = 'medium';

                    if (riskFilter !== 'all' && risk !== riskFilter) return null;

                    return (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        risk={risk}
                      />
                    );
                  })}
                </View>
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
  glassBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
    alignSelf: 'flex-start',
    maxWidth: 180,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },

  appTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.text.primary,
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
});

export default Home;