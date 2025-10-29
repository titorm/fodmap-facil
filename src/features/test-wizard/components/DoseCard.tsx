import React from 'react';
import { View, Text, StyleSheet, Image, ImageSourcePropType } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms';

export interface DoseCardProps {
  foodItem: string;
  portionSize: string;
  portionAmount: number;
  dayNumber: number;
  consumed: boolean;
  consumedAt?: Date;
  onConfirmConsumption: () => void;
  foodImage?: ImageSourcePropType;
  disabled?: boolean;
}

export const DoseCard: React.FC<DoseCardProps> = ({
  foodItem,
  portionSize,
  portionAmount,
  dayNumber,
  consumed,
  consumedAt,
  onConfirmConsumption,
  foodImage,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const formatTimestamp = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.lg,
          ...shadows.md,
        },
      ]}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={`Day ${dayNumber} dose: ${portionSize} of ${foodItem}${consumed ? `, consumed at ${consumedAt ? formatTimestamp(consumedAt) : 'unknown time'}` : ''}`}
    >
      {/* Food Item Image */}
      {foodImage && (
        <View style={[styles.imageContainer, { marginBottom: spacing.md }]}>
          <Image
            source={foodImage}
            style={styles.foodImage}
            resizeMode="cover"
            accessible={true}
            accessibilityLabel={`${foodItem} image`}
          />
        </View>
      )}

      {/* Food Item Name */}
      <Text
        style={[
          styles.foodName,
          {
            fontSize: typography.fontSize.xl,
            fontWeight: typography.fontWeight.bold,
            color: colors.text,
            marginBottom: spacing.sm,
          },
        ]}
        accessibilityRole="header"
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        {foodItem}
      </Text>

      {/* Day Number */}
      <Text
        style={[
          styles.dayLabel,
          {
            fontSize: typography.fontSize.sm,
            color: colors.textSecondary,
            marginBottom: spacing.md,
          },
        ]}
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        Day {dayNumber} of 3
      </Text>

      {/* Portion Size - Prominent Display */}
      <View
        style={[
          styles.portionContainer,
          {
            backgroundColor: colors.primary50,
            borderRadius: borderRadius.md,
            padding: spacing.lg,
            marginBottom: spacing.md,
          },
        ]}
      >
        <Text
          style={[
            styles.portionLabel,
            {
              fontSize: typography.fontSize.sm,
              color: colors.textSecondary,
              marginBottom: spacing.xs,
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          Portion Size
        </Text>
        <Text
          style={[
            styles.portionSize,
            {
              fontSize: typography.fontSize.xxxl,
              fontWeight: typography.fontWeight.bold,
              color: colors.primary700,
            },
          ]}
          accessibilityRole="text"
          accessibilityLabel={`Portion size: ${portionSize}`}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          {portionSize}
        </Text>
      </View>

      {/* Visual Portion Indicator */}
      <View style={[styles.portionIndicator, { marginBottom: spacing.md }]}>
        <View style={styles.portionBar}>
          {[1, 2, 3].map((level) => (
            <View
              key={level}
              style={[
                styles.portionSegment,
                {
                  backgroundColor: level <= portionAmount ? colors.primary500 : colors.border,
                  marginRight: level < 3 ? spacing.xs : 0,
                },
              ]}
              accessible={false}
            />
          ))}
        </View>
        <Text
          style={[
            styles.portionIndicatorLabel,
            {
              fontSize: typography.fontSize.xs,
              color: colors.textTertiary,
              marginTop: spacing.xs,
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          {portionAmount === 1 ? 'Small' : portionAmount === 2 ? 'Medium' : 'Large'} portion
        </Text>
      </View>

      {/* Consumption Status Badge */}
      {consumed && (
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor: colors.successLight,
              borderRadius: borderRadius.sm,
              padding: spacing.sm,
              marginBottom: spacing.md,
            },
          ]}
        >
          <Text
            style={[
              styles.statusText,
              {
                fontSize: typography.fontSize.sm,
                fontWeight: typography.fontWeight.medium,
                color: colors.successDark,
                textAlign: 'center',
              },
            ]}
            accessibilityRole="text"
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            ✓ Consumed {consumedAt && `at ${formatTimestamp(consumedAt)}`}
          </Text>
        </View>
      )}

      {/* Confirm Consumption Button */}
      {!consumed && (
        <Button
          title="I Consumed This Portion"
          onPress={onConfirmConsumption}
          variant="primary"
          size="large"
          fullWidth
          disabled={disabled}
          accessibilityLabel="Confirm that you consumed this portion"
          accessibilityHint="Tap to record that you have consumed this food portion"
        />
      )}

      {/* Timestamp Display */}
      {consumed && consumedAt && (
        <Text
          style={[
            styles.timestamp,
            {
              fontSize: typography.fontSize.sm,
              color: colors.textTertiary,
              textAlign: 'center',
              marginTop: spacing.sm,
            },
          ]}
          accessibilityRole="text"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          Consumed on {consumedAt.toLocaleDateString()} at {formatTimestamp(consumedAt)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  imageContainer: {
    width: '100%',
    height: 200,
    overflow: 'hidden',
    borderRadius: 8,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  foodName: {
    textAlign: 'center',
  },
  dayLabel: {
    textAlign: 'center',
  },
  portionContainer: {
    alignItems: 'center',
  },
  portionLabel: {
    textAlign: 'center',
  },
  portionSize: {
    textAlign: 'center',
  },
  portionIndicator: {
    alignItems: 'center',
  },
  portionBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: '100%',
  },
  portionSegment: {
    flex: 1,
    height: 8,
    borderRadius: 4,
  },
  portionIndicatorLabel: {
    textAlign: 'center',
  },
  statusBadge: {
    width: '100%',
  },
  statusText: {},
  timestamp: {},
});
