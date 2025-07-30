import React, { useMemo } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, TouchableOpacity } from 'react-native';
import PieChart from 'react-native-pie-chart';
import { useThemedStyles, useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/colors';
import { DefectModuleItem, formatDefectModuleForPieChart, getDefectModuleSummary } from '../api/GetDefectModulePieChart';

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

interface ModuleDataItem {
  value: number;
  color: string;
  label: string;
  percentage?: number;
  moduleId?: number;
}

interface DefectsByModuleChartProps {
  selectedProjectId?: string;
  defects: Defect[];
  projects: Project[];
  apiData?: DefectModuleItem[] | null;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
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
  projects,
  apiData,
  isLoading = false,
  error,
  onRetry
}) => {
  const { isDark } = useTheme();
  const styles = useThemedStyles(createStyles);
  const widthAndHeight = 200;

  // Create dynamic module data based on API data only (memoized)
  const moduleData: ModuleDataItem[] = useMemo(() => {
    if (apiData && apiData.length > 0) {
      // Use API data
      return formatDefectModuleForPieChart(apiData).map(item => ({
        value: item.population,
        color: item.color,
        label: item.name,
        percentage: item.percentage,
        moduleId: item.moduleId
      }));
    } else {
      // No fallback data - return empty array
      return [];
    }
  }, [apiData]);

  // Prepare data for PieChart component
  const series = moduleData.map(item => item.value);
  const sliceColor = moduleData.map(item => item.color);

  const totalDefects = apiData
    ? apiData.reduce((sum, item) => sum + item.value, 0)
    : moduleData.reduce((sum, item) => sum + item.value, 0);
  const mostCommonModule = apiData && apiData.length > 0
    ? apiData.reduce((prev, current) => prev.value > current.value ? prev : current)
    : moduleData.length > 0 ? moduleData.reduce((prev, current) =>
        prev.value > current.value ? prev : current
      ) : null;

  const calculatePercentage = (value: number) => {
    return totalDefects > 0 ? ((value / totalDefects) * 100).toFixed(1) : '0.0';
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Defects by Module</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading module data...</Text>
        </View>
      </View>
    );
  }

  // Show error state
  if (error && !apiData) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Defects by Module</Text>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>⚠️ {error}</Text>
          {onRetry && (
            <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

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
        {apiData && (
          <Text style={styles.apiDataIndicator}> • Live Data</Text>
        )}
        {!apiData && (
          <Text style={styles.localDataIndicator}> • Calculated</Text>
        )}
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
              {item.label}: {item.value} ({item.percentage ? item.percentage.toFixed(1) : calculatePercentage(item.value)}%)
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
            <Text style={styles.summarySubLabel}>
              {'name' in mostCommonModule ? mostCommonModule.name : mostCommonModule.label}
            </Text>
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

  // Loading and Error States
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: colors.text.secondary,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    color: colors.system.red,
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: colors.system.blue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },

  // API Data Indicators
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

export default DefectsByModuleChart;
