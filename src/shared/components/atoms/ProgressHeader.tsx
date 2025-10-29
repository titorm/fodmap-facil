import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export const ProgressHeader: React.FC<ProgressHeaderProps> = ({
  currentStep,
  totalSteps,
  title,
  onBack,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, accessibility } = theme;

  const progress = currentStep / totalSteps;

  const containerStyle: ViewStyle = {
    backgroundColor: colors.surface,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const headerRowStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  };

  const backButtonStyle: ViewStyle = {
    minHeight: accessibility.minTouchTarget,
    minWidth: accessibility.minTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -spacing.sm,
  };

  const backButtonTextStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    color: colors.interactive,
    fontWeight: typography.fontWeight.medium,
  };

  const titleContainerStyle: ViewStyle = {
    flex: 1,
    alignItems: 'center',
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  };

  const stepIndicatorStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  };

  const progressBarContainerStyle: ViewStyle = {
    height: 4,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginTop: spacing.sm,
  };

  const progressBarFillStyle: ViewStyle = {
    height: '100%',
    backgroundColor: colors.primary500,
    width: `${progress * 100}%`,
    borderRadius: borderRadius.full,
  };

  const spacerStyle: ViewStyle = {
    width: accessibility.minTouchTarget,
  };

  const progressPercentage = Math.round(progress * 100);
  const headerAccessibilityLabel =
    accessibilityLabel ||
    `${title}. Step ${currentStep} of ${totalSteps}. ${progressPercentage} percent complete.`;

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="header"
      accessibilityLabel={headerAccessibilityLabel}
      testID={testID}
    >
      <View style={headerRowStyle}>
        {onBack ? (
          <TouchableOpacity
            style={backButtonStyle}
            onPress={onBack}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            accessibilityHint="Returns to the previous screen"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={backButtonTextStyle}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={spacerStyle} />
        )}

        <View style={titleContainerStyle}>
          <Text
            style={titleStyle}
            accessibilityRole="text"
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            {title}
          </Text>
          <Text
            style={stepIndicatorStyle}
            accessibilityRole="text"
            accessibilityLabel={`Step ${currentStep} of ${totalSteps}`}
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            {currentStep} of {totalSteps}
          </Text>
        </View>

        <View style={spacerStyle} />
      </View>

      <View
        style={progressBarContainerStyle}
        accessible={true}
        accessibilityRole="progressbar"
        accessibilityValue={{
          min: 0,
          max: totalSteps,
          now: currentStep,
        }}
        accessibilityLabel={`Progress: ${progressPercentage} percent`}
      >
        <View style={progressBarFillStyle} />
      </View>
    </View>
  );
};
