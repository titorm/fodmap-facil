import React from 'react';
import { View, ActivityIndicator, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface LoadingSpinnerProps {
  size?: 'small' | 'large';
  message?: string;
  fullScreen?: boolean;
}

/**
 * LoadingSpinner Component
 *
 * Displays a loading indicator with optional message.
 * Can be used inline or as a full-screen overlay.
 *
 * @param size - Size of the spinner ('small' | 'large')
 * @param message - Optional loading message
 * @param fullScreen - Whether to display as full-screen overlay
 *
 * @example
 * ```tsx
 * <LoadingSpinner size="large" message="Loading your data..." />
 * ```
 */
export function LoadingSpinner({
  size = 'large',
  message,
  fullScreen = false,
}: LoadingSpinnerProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const containerStyle: ViewStyle = {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    ...(fullScreen && {
      flex: 1,
      backgroundColor: colors.background,
    }),
  };

  const messageStyle: TextStyle = {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  };

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityLabel={message || 'Loading'}
      accessibilityLiveRegion="polite"
    >
      <ActivityIndicator size={size} color={colors.primary500} />
      {message && (
        <Text style={messageStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
          {message}
        </Text>
      )}
    </View>
  );
}
