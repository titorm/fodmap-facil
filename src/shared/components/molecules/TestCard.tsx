import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../atoms';
import { colors, spacing, typography } from '../../theme';
import { ReintroductionTest } from '../../../core/domain/entities/ReintroductionTest';
import { ReintroductionEngine } from '../../../core/engine/ReintroductionEngine';

interface TestCardProps {
  test: ReintroductionTest;
  onPress?: () => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onPress }) => {
  const maxSeverity = ReintroductionEngine.getMaxSymptomSeverity(test);
  const canProgress = ReintroductionEngine.canProgressToNextGroup(test);

  const getStatusColor = () => {
    if (maxSeverity === 0) return colors.success;
    if (canProgress) return colors.warning;
    return colors.error;
  };

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Test for ${test.foodItem}, day ${test.dayNumber}`}
      accessibilityHint={onPress ? 'Tap to view details' : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.foodItem}>{test.foodItem}</Text>
          <Text style={styles.portion}>{test.portionSize}</Text>
        </View>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>
          Day {test.dayNumber} • {test.fodmapGroup}
        </Text>
        <Text style={styles.detailText}>
          {test.symptoms.length} symptom{test.symptoms.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {test.notes && <Text style={styles.notes}>{test.notes}</Text>}

      <Text
        style={styles.date}
        accessibilityLabel={`Started on ${test.startDate.toLocaleDateString()}`}
      >
        {test.startDate.toLocaleDateString()}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  headerLeft: {
    flex: 1,
  },
  foodItem: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral900,
    marginBottom: spacing.xs,
  },
  portion: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral600,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  detailText: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral600,
    textTransform: 'capitalize',
  },
  notes: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral700,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  date: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral500,
  },
});
