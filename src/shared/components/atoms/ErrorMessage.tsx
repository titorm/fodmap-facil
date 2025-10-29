import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';
import { Button } from './Button';

export interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
  fullScreen?: boolean;
}

/**
 * ErrorMessage Component
 *
 * Displays user-friendly error messages with optional retry action.
 * Can be used inline or as a full-screen error state.
 *
 * @param title - Optional error title
 * @param message - Error message to display
 * @param onRetry - Optional retry callback
 * @param retryLabel - Label for retry button
 * @param fullScreen - Whether to display as full-screen error
 *
 * @example
 * ```tsx
 * <ErrorMessage
 *   title="Connection Error"
 *   message="Unable to load data. Please check your connection."
 *   onRetry={handleRetry}
 * />
 * ```
 */
export function ErrorMessage({
  title = 'Something went wrong',
  message,
  onRetry,
  retryLabel = 'Try Again',
  fullScreen = false,
}: ErrorMessageProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const containerStyle: ViewStyle = {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    ...(fullScreen && {
      flex: 1,
      backgroundColor: colors.background,
    }),
  };

  const cardStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    maxWidth: 400,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
  };

  const iconStyle: TextStyle = {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: spacing.md,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  };

  const messageStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
    marginBottom: onRetry ? spacing.lg : 0,
  };

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <View style={cardStyle}>
        <Text style={iconStyle}>⚠️</Text>
        <Text
          style={titleStyle}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          {title}
        </Text>
        <Text style={messageStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
          {message}
        </Text>
        {onRetry && (
          <Button
            title={retryLabel}
            onPress={onRetry}
            variant="primary"
            size="medium"
            fullWidth
            accessibilityLabel={retryLabel}
            accessibilityHint="Tap to retry the failed operation"
          />
        )}
      </View>
    </View>
  );
}
