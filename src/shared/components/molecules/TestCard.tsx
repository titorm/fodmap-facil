import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { Card } from '../atoms';
import { useTheme } from '../../theme';
import { ReintroductionTest } from '../../../core/domain/entities/ReintroductionTest';
import { ReintroductionEngine } from '../../../core/engine/ReintroductionEngine';

interface TestCardProps {
  test: ReintroductionTest;
  onPress?: () => void;
}

export const TestCard: React.FC<TestCardProps> = ({ test, onPress }) => {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const maxSeverity = ReintroductionEngine.getMaxSymptomSeverity(test);
  const canProgress = ReintroductionEngine.canProgressToNextGroup(test);

  const getStatusColor = () => {
    if (maxSeverity === 0) return colors.success;
    if (canProgress) return colors.warning;
    return colors.error;
  };

  const headerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  };

  const headerLeftStyle: ViewStyle = {
    flex: 1,
  };

  const foodItemStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const portionStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  };

  const statusDotStyle: ViewStyle = {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginTop: spacing.xs,
    backgroundColor: getStatusColor(),
  };

  const detailsStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  };

  const detailTextStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  };

  const notesStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  };

  const dateStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
  };

  return (
    <Card
      onPress={onPress}
      accessibilityLabel={`Test for ${test.foodItem}, day ${test.dayNumber}`}
      accessibilityHint={onPress ? 'Tap to view details' : undefined}
    >
      <View style={headerStyle}>
        <View style={headerLeftStyle}>
          <Text style={foodItemStyle}>{test.foodItem}</Text>
          <Text style={portionStyle}>{test.portionSize}</Text>
        </View>
        <View style={statusDotStyle} />
      </View>

      <View style={detailsStyle}>
        <Text style={detailTextStyle}>
          Day {test.dayNumber} • {test.fodmapGroup}
        </Text>
        <Text style={detailTextStyle}>
          {test.symptoms.length} symptom{test.symptoms.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {test.notes && <Text style={notesStyle}>{test.notes}</Text>}

      <Text
        style={dateStyle}
        accessibilityLabel={`Started on ${test.startDate.toLocaleDateString()}`}
      >
        {test.startDate.toLocaleDateString()}
      </Text>
    </Card>
  );
};
