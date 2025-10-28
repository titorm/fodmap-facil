import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../atoms';
import { colors, spacing, typography } from '../../theme';
import { Symptom, SymptomSeverity } from '../../../core/domain/entities/ReintroductionTest';

interface SymptomCardProps {
  symptom: Symptom;
  onPress?: () => void;
}

export const SymptomCard: React.FC<SymptomCardProps> = ({ symptom, onPress }) => {
  const getSeverityColor = (severity: SymptomSeverity) => {
    switch (severity) {
      case SymptomSeverity.NONE:
        return colors.success;
      case SymptomSeverity.MILD:
        return colors.warning;
      case SymptomSeverity.MODERATE:
        return colors.error;
      case SymptomSeverity.SEVERE:
        return colors.error;
      default:
        return colors.neutral500;
    }
  };

  const getSeverityLabel = (severity: SymptomSeverity) => {
    switch (severity) {
      case SymptomSeverity.NONE:
        return 'None';
      case SymptomSeverity.MILD:
        return 'Mild';
      case SymptomSeverity.MODERATE:
        return 'Moderate';
      case SymptomSeverity.SEVERE:
        return 'Severe';
      default:
        return 'Unknown';
    }
  };

  const severityColor = getSeverityColor(symptom.severity);
  const severityLabel = getSeverityLabel(symptom.severity);

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${symptom.type} symptom, severity ${severityLabel}`}
      accessibilityHint={onPress ? 'Tap to view details' : undefined}
    >
      <View style={styles.header}>
        <Text style={styles.type}>{symptom.type}</Text>
        <View style={[styles.badge, { backgroundColor: severityColor }]}>
          <Text style={styles.badgeText}>{severityLabel}</Text>
        </View>
      </View>

      {symptom.notes && <Text style={styles.notes}>{symptom.notes}</Text>}

      <Text
        style={styles.timestamp}
        accessibilityLabel={`Recorded at ${symptom.timestamp.toLocaleString()}`}
      >
        {symptom.timestamp.toLocaleTimeString()}
      </Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  type: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.neutral900,
    textTransform: 'capitalize',
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.neutral0,
  },
  notes: {
    fontSize: typography.fontSize.sm,
    color: colors.neutral700,
    marginBottom: spacing.sm,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.neutral500,
  },
});
