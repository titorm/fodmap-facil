import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SkeletonLoader } from '../../../shared/components/atoms/SkeletonLoader';
import { lightColors, spacing, borderRadius } from '../../../shared/theme/tokens';

interface ChartSkeletonProps {
  title?: string;
  height?: number;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({ title, height = 300 }) => {
  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={`Carregando ${title || 'gráfico'}`}
      accessibilityLiveRegion="polite"
    >
      {title && <Text style={styles.title}>{title}</Text>}

      {/* Chart area skeleton */}
      <View style={[styles.chartArea, { height }]}>
        {/* Y-axis labels */}
        <View style={styles.yAxis}>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <SkeletonLoader key={`y-${i}`} width={30} height={12} style={styles.yLabel} />
          ))}
        </View>

        {/* Chart content */}
        <View style={styles.chartContent}>
          {/* Grid lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <View key={`grid-${i}`} style={styles.gridLine} />
          ))}

          {/* Bars or data points */}
          <View style={styles.dataContainer}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonLoader
                key={`bar-${i}`}
                width={40}
                height={Math.random() * 150 + 50}
                style={styles.bar}
              />
            ))}
          </View>
        </View>
      </View>

      {/* X-axis labels */}
      <View style={styles.xAxis}>
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonLoader key={`x-${i}`} width={60} height={12} style={styles.xLabel} />
        ))}
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {[0, 1, 2, 3].map((i) => (
          <View key={`legend-${i}`} style={styles.legendItem}>
            <SkeletonLoader width={16} height={16} borderRadius={4} />
            <SkeletonLoader width={60} height={12} style={styles.legendText} />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: lightColors.surface,
    borderRadius: borderRadius.md,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: lightColors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  chartArea: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  yAxis: {
    width: 40,
    justifyContent: 'space-between',
    paddingRight: spacing.xs,
  },
  yLabel: {
    alignSelf: 'flex-end',
  },
  chartContent: {
    flex: 1,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: lightColors.border,
  },
  dataContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    paddingTop: spacing.md,
  },
  bar: {
    marginHorizontal: spacing.xs,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  xLabel: {
    marginHorizontal: spacing.xs,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendText: {
    marginLeft: spacing.xs,
  },
});
