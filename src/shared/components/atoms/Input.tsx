import React, { useState } from 'react';
import { TextInput, View, Text, TextInputProps, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  containerStyle?: ViewStyle;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  required = false,
  containerStyle,
  accessibilityLabel,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, accessibility } = theme;
  const [isFocused, setIsFocused] = useState(false);

  const containerStyles: ViewStyle = {
    marginBottom: spacing.md,
    ...containerStyle,
  };

  const labelStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const requiredStyle: TextStyle = {
    color: colors.error,
  };

  const inputStyle: TextStyle = {
    borderWidth: isFocused ? accessibility.focusOutlineWidth : 1,
    borderColor: error ? colors.borderError : isFocused ? colors.borderFocus : colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    backgroundColor: colors.background,
    minHeight: accessibility.minTouchTarget,
  };

  const errorTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xs,
  };

  const helperTextStyle: TextStyle = {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  };

  const inputAccessibilityLabel = accessibilityLabel || label;

  return (
    <View style={containerStyles}>
      {label && (
        <Text style={labelStyle} accessibilityRole="text">
          {label}
          {required && <Text style={requiredStyle}> *</Text>}
        </Text>
      )}
      <TextInput
        {...textInputProps}
        style={inputStyle}
        onFocus={(e) => {
          setIsFocused(true);
          textInputProps.onFocus?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          textInputProps.onBlur?.(e);
        }}
        accessible={true}
        accessibilityLabel={inputAccessibilityLabel}
        placeholderTextColor={colors.textTertiary}
      />
      {error && (
        <Text style={errorTextStyle} accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      )}
      {helperText && !error && (
        <Text style={helperTextStyle} accessibilityRole="text">
          {helperText}
        </Text>
      )}
    </View>
  );
};
