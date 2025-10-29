import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '../../../shared/components/atoms/SkeletonLoader';
import { lightColors, spacing, borderRadius, shadows } from '../../../shared/theme/tokens';

export const MetricsSkeleton: React.FC = () => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando resumo de métricas"
      accessibilityLiveRegion="polite"
    >
      {/* Section title */}
      <SkeletonLoader width={150} height={20} style={styles.sectionTitle} />

      {/* Metrics grid */}
      <View style={styles.metricsGrid}>
        {[0, 1, 2, 3].map((i) => (
          <View key={`metric-${i}`} style={styles.metricCard}>
            <SkeletonLoader width={100} height={12} style={styles.metricTitle} />
            <SkeletonLoader width={60} height={32} style={styles.metricValue} />
            <SkeletonLoader width={80} height={10} style={styles.metricSubtitle} />
          </View>
        ))}
      </View>

      {/* Tolerance section */}
      <View style={styles.toleranceSection}>
        <SkeletonLoader width={180} height={16} style={styles.subsectionTitle} />

        <View style={styles.toleranceGrid}>
          {[0, 1, 2].map((i) => (
            <View key={`tolerance-${i}`} style={styles.toleranceCard}>
              <SkeletonLoader width={4} height={40} borderRadius={2} />
              <View style={styles.toleranceContent}>
                <SkeletonLoader width={40} height={24} style={styles.toleranceValue} />
                <SkeletonLoader width={60} height={12} />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.totalRow}>
          <SkeletonLoader width={180} height={14} />
          <SkeletonLoader width={40} height={20} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: lightColors.backgroundSecondary,
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metricCard: {
    flex: 1,
    minWidth: 150,
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  metricTitle: {
    marginBottom: spacing.xs,
  },
  metricValue: {
    marginBottom: spacing.xs,
  },
  metricSubtitle: {
    marginTop: spacing.xs,
  },
  toleranceSection: {
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...shadows.sm,
  },
  subsectionTitle: {
    marginBottom: spacing.md,
  },
  toleranceGrid: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  toleranceCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: lightColors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
  },
  toleranceContent: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  toleranceValue: {
    marginBottom: spacing.xs,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
  },
});
