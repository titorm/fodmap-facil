import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../shared/theme';

export interface TestProgressHeaderProps {
  currentDay: number;
  completedDays: number[];
  foodItem: string;
}

export const TestProgressHeader: React.FC<TestProgressHeaderProps> = ({
  currentDay,
  completedDays,
  foodItem,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const isDayCompleted = (day: number): boolean => {
    return completedDays.includes(day);
  };

  const isDayCurrent = (day: number): boolean => {
    return day === currentDay;
  };

  const getDayStatus = (day: number): 'completed' | 'current' | 'upcoming' => {
    if (isDayCompleted(day)) return 'completed';
    if (isDayCurrent(day)) return 'current';
    return 'upcoming';
  };

  const getCircleColor = (status: 'completed' | 'current' | 'upcoming'): string => {
    switch (status) {
      case 'completed':
        return colors.success;
      case 'current':
        return colors.primary500;
      case 'upcoming':
        return colors.border;
    }
  };

  const getTextColor = (status: 'completed' | 'current' | 'upcoming'): string => {
    switch (status) {
      case 'completed':
      case 'current':
        return colors.textOnPrimary;
      case 'upcoming':
        return colors.textTertiary;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          paddingVertical: spacing.lg,
          paddingHorizontal: spacing.md,
        },
      ]}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={`Testing ${foodItem}, day ${currentDay} of 3`}
    >
      {/* Food Item Name */}
      <Text
        style={[
          styles.foodItemName,
          {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            textAlign: 'center',
            marginBottom: spacing.md,
          },
        ]}
        accessibilityRole="header"
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        {foodItem}
      </Text>

      {/* Progress Circles */}
      <View
        style={styles.progressContainer}
        accessible={true}
        accessibilityLabel={`Progress: ${completedDays.length} of 3 days completed`}
      >
        {[1, 2, 3].map((day, index) => {
          const status = getDayStatus(day);
          const circleColor = getCircleColor(status);
          const textColor = getTextColor(status);

          return (
            <React.Fragment key={day}>
              {/* Day Circle */}
              <View
                style={[
                  styles.dayCircle,
                  {
                    backgroundColor: circleColor,
                    borderRadius: borderRadius.full,
                    width: 48,
                    height: 48,
                    borderWidth: status === 'current' ? 3 : 0,
                    borderColor: colors.primary700,
                  },
                ]}
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`Day ${day}${status === 'completed' ? ', completed' : status === 'current' ? ', in progress' : ', upcoming'}`}
              >
                {status === 'completed' ? (
                  <Text
                    style={[
                      styles.checkmark,
                      {
                        fontSize: typography.fontSize.xl,
                        color: textColor,
                      },
                    ]}
                  >
                    ✓
                  </Text>
                ) : (
                  <Text
                    style={[
                      styles.dayNumber,
                      {
                        fontSize: typography.fontSize.lg,
                        fontWeight: typography.fontWeight.bold,
                        color: textColor,
                      },
                    ]}
                  >
                    {day}
                  </Text>
                )}
              </View>

              {/* Connector Line */}
              {index < 2 && (
                <View
                  style={[
                    styles.connector,
                    {
                      backgroundColor: status === 'completed' ? colors.success : colors.border,
                      height: 2,
                      flex: 1,
                      marginHorizontal: spacing.xs,
                    },
                  ]}
                  accessible={false}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Day Labels */}
      <View style={[styles.labelsContainer, { marginTop: spacing.sm }]}>
        {[1, 2, 3].map((day) => {
          const status = getDayStatus(day);
          return (
            <View key={day} style={styles.labelWrapper}>
              <Text
                style={[
                  styles.dayLabel,
                  {
                    fontSize: typography.fontSize.xs,
                    color: status === 'upcoming' ? colors.textTertiary : colors.textSecondary,
                    fontWeight:
                      status === 'current'
                        ? typography.fontWeight.bold
                        : typography.fontWeight.regular,
                  },
                ]}
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
              >
                Day {day}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  foodItemName: {},
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCircle: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    textAlign: 'center',
  },
  dayNumber: {
    textAlign: 'center',
  },
  connector: {},
  labelsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  labelWrapper: {
    width: 48,
    alignItems: 'center',
  },
  dayLabel: {
    textAlign: 'center',
  },
});
