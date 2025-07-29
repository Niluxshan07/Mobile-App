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
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface DefectTypeDistributionProps {
  selectedProjectId?: string;
  defects: Defect[];
  projects: Project[];
}

/**
 * Dynamic Defect Type Distribution Pie Chart
 *
 * This component automatically updates when:
 * - Defects are added, updated, or deleted
 * - A different project is selected
 * - Defect titles/descriptions change (affects categorization)
 *
 * Categories are determined by analyzing defect titles and descriptions:
 * - Functionality: function, logic, business
 * - UI: ui, interface, display, layout
 * - Usability: usability, user experience, ux
 * - Validation: validation, input, form
 * - Performance: performance, slow, speed
 * - Security: security, auth, permission
 * - Other: everything else
 */
const DefectTypeDistribution: React.FC<DefectTypeDistributionProps> = ({
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

  // Calculate dynamic defect counts by type (memoized for performance)
  const defectCounts = useMemo(() => {
    const counts = {
      functionality: 0,
      ui: 0,
      usability: 0,
      validation: 0,
      performance: 0,
      security: 0,
      other: 0
    };

    projectDefects.forEach(defect => {
      // Categorize defects based on title, description, or type field
      const title = defect.title.toLowerCase();
      const description = defect.description?.toLowerCase() || '';

      if (title.includes('function') || title.includes('logic') || title.includes('business') ||
          description.includes('function') || description.includes('logic')) {
        counts.functionality++;
      } else if (title.includes('ui') || title.includes('interface') || title.includes('display') ||
                 title.includes('layout') || description.includes('ui') || description.includes('interface')) {
        counts.ui++;
      } else if (title.includes('usability') || title.includes('user experience') || title.includes('ux') ||
                 description.includes('usability') || description.includes('user experience')) {
        counts.usability++;
      } else if (title.includes('validation') || title.includes('input') || title.includes('form') ||
                 description.includes('validation') || description.includes('input')) {
        counts.validation++;
      } else if (title.includes('performance') || title.includes('slow') || title.includes('speed') ||
                 description.includes('performance') || description.includes('slow')) {
        counts.performance++;
      } else if (title.includes('security') || title.includes('auth') || title.includes('permission') ||
                 description.includes('security') || description.includes('auth')) {
        counts.security++;
      } else {
        counts.other++;
      }
    });

    return counts;
  }, [projectDefects]);

  // Create dynamic type data based on actual defect counts (memoized)
  const typeData = useMemo(() => {
    return [
      { value: defectCounts.functionality, color: '#4285F4', label: 'Functionality' },
      { value: defectCounts.ui, color: '#00bfae', label: 'UI' },
      { value: defectCounts.usability, color: '#fbbc05', label: 'Usability' },
      { value: defectCounts.validation, color: '#ea4335', label: 'Validation' },
      { value: defectCounts.performance, color: '#9c27b0', label: 'Performance' },
      { value: defectCounts.security, color: '#ff5722', label: 'Security' },
      { value: defectCounts.other, color: '#607d8b', label: 'Other' },
    ].filter(item => item.value > 0); // Only show categories with defects
  }, [defectCounts]);

  // Prepare data for PieChart component
  const series = typeData.map(item => item.value);
  const sliceColor = typeData.map(item => item.color);

  const totalDefects = typeData.reduce((sum, item) => sum + item.value, 0);
  const mostCommonType = typeData.length > 0 ? typeData.reduce((prev, current) =>
    prev.value > current.value ? prev : current
  ) : null;

  const calculatePercentage = (value: number) => {
    return totalDefects > 0 ? ((value / totalDefects) * 100).toFixed(1) : '0.0';
  };

  // Show message if no defects
  if (totalDefects === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Defect Distribution by Type</Text>
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
        Defect Distribution by Type
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
        {typeData.map((item, index) => (
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
        {mostCommonType && (
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{mostCommonType.value}</Text>
            <Text style={styles.summaryLabel}>Most Common</Text>
            <Text style={styles.summarySubLabel}>{mostCommonType.label}</Text>
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

export default DefectTypeDistribution;
