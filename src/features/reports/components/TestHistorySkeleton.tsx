import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonLoader } from '../../../shared/components/atoms/SkeletonLoader';
import { lightColors, spacing, borderRadius, shadows } from '../../../shared/theme/tokens';

export const TestHistorySkeleton: React.FC = () => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel="Carregando histórico de testes"
      accessibilityLiveRegion="polite"
    >
      {[0, 1, 2, 3].map((i) => (
        <View key={`card-${i}`} style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <SkeletonLoader width={120} height={18} style={styles.foodName} />
              <SkeletonLoader width={100} height={14} />
            </View>
            <SkeletonLoader width={80} height={24} borderRadius={12} />
          </View>

          {/* Date info */}
          <View style={styles.dateRow}>
            <SkeletonLoader width={200} height={14} />
          </View>

          {/* Tolerance outcome */}
          <View style={styles.toleranceRow}>
            <SkeletonLoader width={70} height={14} style={styles.toleranceLabel} />
            <SkeletonLoader width={80} height={24} borderRadius={12} />
          </View>

          {/* Symptom info */}
          <View style={styles.symptomRow}>
            <View style={styles.symptomItem}>
              <SkeletonLoader width={60} height={12} style={styles.symptomLabel} />
              <SkeletonLoader width={30} height={16} />
            </View>
            <View style={styles.symptomItem}>
              <SkeletonLoader width={100} height={12} style={styles.symptomLabel} />
              <SkeletonLoader width={40} height={16} />
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: lightColors.backgroundSecondary,
    padding: spacing.md,
  },
  card: {
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  foodName: {
    marginBottom: 4,
  },
  dateRow: {
    marginBottom: spacing.xs,
  },
  toleranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  toleranceLabel: {
    marginRight: spacing.sm,
  },
  symptomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: lightColors.border,
  },
  symptomItem: {
    flex: 1,
  },
  symptomLabel: {
    marginBottom: 4,
  },
});
