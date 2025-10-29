import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../shared/theme';

export interface ReminderBannerProps {
  message: string;
  type?: 'info' | 'warning' | 'success';
  dismissible?: boolean;
  onDismiss?: () => void;
  accessibilityLabel?: string;
  testID?: string;
}

export const ReminderBanner: React.FC<ReminderBannerProps> = ({
  message,
  type = 'info',
  dismissible = false,
  onDismiss,
  accessibilityLabel,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const getTypeColors = () => {
    switch (type) {
      case 'info':
        return {
          background: colors.infoLight,
          border: colors.info,
          text: colors.infoDark,
          icon: colors.info,
        };
      case 'warning':
        return {
          background: colors.warningLight,
          border: colors.warning,
          text: colors.warningDark,
          icon: colors.warning,
        };
      case 'success':
        return {
          background: colors.successLight,
          border: colors.success,
          text: colors.successDark,
          icon: colors.success,
        };
      default:
        return {
          background: colors.infoLight,
          border: colors.info,
          text: colors.infoDark,
          icon: colors.info,
        };
    }
  };

  const typeColors = getTypeColors();

  const containerStyle: ViewStyle = {
    backgroundColor: typeColors.background,
    borderLeftWidth: 4,
    borderLeftColor: typeColors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: spacing.sm,
  };

  const messageStyle: TextStyle = {
    flex: 1,
    color: typeColors.text,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  };

  const dismissButtonStyle: ViewStyle = {
    marginLeft: spacing.md,
    padding: spacing.sm,
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  };

  const dismissTextStyle: TextStyle = {
    color: typeColors.text,
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.fontWeight.bold,
  };

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLabel={accessibilityLabel || message}
      accessibilityLiveRegion="polite"
      testID={testID}
    >
      <Text
        style={messageStyle}
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
        testID={testID ? `${testID}-message` : undefined}
      >
        {message}
      </Text>
      {dismissible && onDismiss && (
        <TouchableOpacity
          style={dismissButtonStyle}
          onPress={onDismiss}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss reminder"
          accessibilityHint="Removes this reminder from view"
          testID={testID ? `${testID}-dismiss` : undefined}
        >
          <Text style={dismissTextStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
            ×
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};
