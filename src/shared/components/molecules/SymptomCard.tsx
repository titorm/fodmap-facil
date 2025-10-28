import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Card } from '../atoms';
import { useTheme } from '../../theme';
import { Symptom, SymptomSeverity } from '../../../core/domain/entities/ReintroductionTest';

interface SymptomCardProps {
  symptom: Symptom;
  onPress?: () => void;
}

export const SymptomCard: React.FC<SymptomCardProps> = ({ symptom, onPress }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

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
        return colors.textTertiary;
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

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  };

  const typeStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textTransform: 'capitalize',
  };

  const badgeStyle: ViewStyle = {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 12,
    backgroundColor: severityColor,
  };

  const badgeTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.textOnPrimary,
  };

  const notesStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  };

  const timestampStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  };

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`${symptom.type} symptom, severity ${severityLabel}`}
      accessibilityHint={onPress ? 'Tap to view details' : undefined}
    >
      <View style={headerStyle}>
        <Text style={typeStyle}>{symptom.type}</Text>
        <View style={badgeStyle}>
          <Text style={badgeTextStyle}>{severityLabel}</Text>
        </View>
      </View>

      {symptom.notes && <Text style={notesStyle}>{symptom.notes}</Text>}

      <Text
        style={timestampStyle}
        accessibilityLabel={`Recorded at ${symptom.timestamp.toLocaleString()}`}
      >
        {symptom.timestamp.toLocaleTimeString()}
      </Text>
    </Card>
  );
};
