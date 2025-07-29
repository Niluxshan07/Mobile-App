import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { useThemedStyles, useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';

interface Defect {
  id: string;
  projectId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'REOPEN' | 'NEW' | 'OPEN' | 'FIXED' | 'CLOSED' | 'REJECTED' | 'DUPLICATE';
  assignedTo: string;
  createdAt: string;
  module?: string; // Track which module the defect belongs to
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface DefectsByModuleChartProps {
  selectedProjectId?: string;
  defects: Defect[];
  projects: Project[];
}

/**
 * Dynamic Defects by Module Pie Chart
 * 
 * This component automatically updates when:
 * - Defects are added, updated, or deleted
 * - A different project is selected
 * - Defect module assignments change
 * 
 * Modules are determined by analyzing defect titles and descriptions:
 * - Configurations: config, setting, configuration
 * - Project Management: project, management, planning
 * - Bench: bench, testing, test environment
 * - Defects: defect, bug, issue tracking
 * - Test Cases: test, case, testing, qa
 * - Employee: employee, user, staff, hr
 * - Releases: release, deployment, version
 * - Project: project core, main project
 * - Main Template: template, layout, design
 * - Dashboard: dashboard, reporting, analytics
 */
const DefectsByModuleChart: React.FC<DefectsByModuleChartProps> = ({ 
  selectedProjectId, 
  defects, 
  projects 
}) => {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const widthAndHeight = 200;

  // Get defects for the selected project or all defects if no project selected
  const projectDefects = useMemo(() => {
    return selectedProjectId 
      ? defects.filter(defect => defect.projectId === selectedProjectId)
      : defects;
  }, [defects, selectedProjectId]);

  // Calculate dynamic module counts (memoized for performance)
  const moduleCounts = useMemo(() => {
    const counts = {
      configurations: 0,
      projectManagement: 0,
      bench: 0,
      defects: 0,
      testCases: 0,
      employee: 0,
      releases: 0,
      project: 0,
      mainTemplate: 0,
      dashboard: 0
    };

    projectDefects.forEach(defect => {
      // Use actual module if available, otherwise categorize by keywords
      let module = defect.module;
      
      if (!module) {
        // Categorize based on title and description keywords
        const title = defect.title.toLowerCase();
        const description = defect.description?.toLowerCase() || '';
        const content = `${title} ${description}`;
        
        if (content.includes('config') || content.includes('setting') || content.includes('configuration')) {
          module = 'configurations';
        } else if (content.includes('project management') || content.includes('planning') || content.includes('workflow')) {
          module = 'projectManagement';
        } else if (content.includes('bench') || content.includes('test environment') || content.includes('testing environment')) {
          module = 'bench';
        } else if (content.includes('defect') || content.includes('bug') || content.includes('issue tracking')) {
          module = 'defects';
        } else if (content.includes('test case') || content.includes('testing') || content.includes('qa') || content.includes('quality')) {
          module = 'testCases';
        } else if (content.includes('employee') || content.includes('user') || content.includes('staff') || content.includes('hr')) {
          module = 'employee';
        } else if (content.includes('release') || content.includes('deployment') || content.includes('version')) {
          module = 'releases';
        } else if (content.includes('template') || content.includes('layout') || content.includes('design')) {
          module = 'mainTemplate';
        } else if (content.includes('dashboard') || content.includes('reporting') || content.includes('analytics')) {
          module = 'dashboard';
        } else {
          module = 'project'; // Default to main project module
        }
      }
      
      // Increment the appropriate counter
      if (counts.hasOwnProperty(module)) {
        counts[module as keyof typeof counts]++;
      } else {
        counts.project++; // Default fallback
      }
    });

    return counts;
  }, [projectDefects]);

  // Create dynamic module data based on actual counts (memoized)
  const moduleData = useMemo(() => {
    return [
      { value: moduleCounts.configurations, color: '#4285F4', label: 'Configurations' },
      { value: moduleCounts.projectManagement, color: '#ea4335', label: 'Project Management' },
      { value: moduleCounts.bench, color: '#fbbc05', label: 'Bench' },
      { value: moduleCounts.defects, color: '#ea4335', label: 'Defects' },
      { value: moduleCounts.testCases, color: '#9c27b0', label: 'Test Cases' },
      { value: moduleCounts.employee, color: '#00bcd4', label: 'Employee' },
      { value: moduleCounts.releases, color: '#ff5722', label: 'Releases' },
      { value: moduleCounts.project, color: '#4caf50', label: 'Project' },
      { value: moduleCounts.mainTemplate, color: '#00bfae', label: 'Main Template' },
      { value: moduleCounts.dashboard, color: '#ff9800', label: 'Dashboard' },
    ].filter(item => item.value > 0); // Only show modules with defects
  }, [moduleCounts]);

  // Prepare data for PieChart component
  const series = moduleData.map(item => item.value);
  const sliceColor = moduleData.map(item => item.color);

  const totalDefects = moduleData.reduce((sum, item) => sum + item.value, 0);
  const mostCommonModule = moduleData.length > 0 ? moduleData.reduce((prev, current) => 
    prev.value > current.value ? prev : current
  ) : null;

  const calculatePercentage = (value: number) => {
    return totalDefects > 0 ? ((value / totalDefects) * 100).toFixed(1) : '0.0';
  };

  // Show message if no defects
  if (totalDefects === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Defects by Module</Text>
        <View style={styles.noDataContainer}>
          <Text style={styles.noDataText}>No defects found</Text>
          <Text style={styles.noDataSubText}>
            {selectedProjectId ? 'for this project' : 'in the system'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        Defects by Module
        {selectedProjectId && (
          <Text style={styles.projectInfo}>
            {'\n'}({projects.find(p => p.id === selectedProjectId)?.name || 'Selected Project'})
          </Text>
        )}
      </Text>
      
      <View style={styles.chartContainer}>
        <PieChart 
          widthAndHeight={widthAndHeight} 
          series={series}
          sliceColor={sliceColor}
        />
      </View>

      <View style={styles.legendContainer}>
        {moduleData.map((item, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={styles.legendText}>
              {item.label}: {item.value} ({calculatePercentage(item.value)}%)
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNumber}>{totalDefects}</Text>
          <Text style={styles.summaryLabel}>Total Defects</Text>
        </View>
        {mostCommonModule && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{mostCommonModule.value}</Text>
            <Text style={styles.summaryLabel}>Most Common</Text>
            <Text style={styles.summarySubLabel}>{mostCommonModule.label}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const createStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: {
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
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'center',
    marginBottom: 20,
  },
  projectInfo: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
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
  chartContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  legendContainer: {
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 10,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  legendText: {
    fontSize: 14,
    color: colors.text.primary,
    flex: 1,
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text.primary,
  },
  summaryLabel: {
    fontSize: 12,
    color: colors.text.secondary,
    marginTop: 4,
  },
  summarySubLabel: {
    fontSize: 11,
    color: colors.text.secondary,
    fontStyle: 'italic',
    marginTop: 2,
  },
});

export default DefectsByModuleChart;
