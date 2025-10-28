import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  AccessibilityRole,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, accessibility } = theme;

  const getButtonStyle = (): ViewStyle => {
    const base: ViewStyle = {
      borderRadius: borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: accessibility.minTouchTarget,
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: colors.primary500 },
      secondary: { backgroundColor: colors.secondary500 },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.interactive,
      },
      ghost: { backgroundColor: 'transparent' },
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      },
      medium: {
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.md,
      },
      large: {
        paddingHorizontal: spacing.xl,
        paddingVertical: spacing.lg,
      },
    };

    return {
      ...base,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...(fullWidth && { width: '100%' }),
      ...((disabled || loading) && { opacity: 0.5 }),
    };
  };

  const getTextStyle = (): TextStyle => {
    const base: TextStyle = {
      fontFamily: typography.fontFamily.medium,
      textAlign: 'center',
    };

    const variantStyles: Record<string, TextStyle> = {
      primary: { color: colors.textOnPrimary },
      secondary: { color: colors.textOnSecondary },
      outline: { color: colors.interactive },
      ghost: { color: colors.interactive },
    };

    const sizeStyles: Record<string, TextStyle> = {
      small: { fontSize: typography.fontSize.sm },
      medium: { fontSize: typography.fontSize.md },
      large: { fontSize: typography.fontSize.lg },
    };

    return {
      ...base,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...((disabled || loading) && { opacity: 0.7 }),
    };
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole={'button' as AccessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.textOnPrimary : colors.interactive}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};
