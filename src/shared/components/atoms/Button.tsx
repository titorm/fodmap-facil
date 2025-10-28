import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  AccessibilityRole,
  ViewStyle,
  TextStyle,
} from "react-native";
import {
  colors,
  spacing,
  typography,
  borderRadius,
  accessibility,
} from "../../theme";

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
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
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const buttonStyle: ViewStyle[] = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    fullWidth && styles.fullWidth,
    (disabled || loading) && styles.disabled,
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    (disabled || loading) && styles.textDisabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole={"button" as AccessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? colors.neutral0 : colors.primary500}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    minHeight: accessibility.minTouchTarget,
  },
  primary: {
    backgroundColor: colors.primary500,
  },
  secondary: {
    backgroundColor: colors.secondary500,
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: colors.primary500,
  },
  ghost: {
    backgroundColor: "transparent",
  },
  size_small: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  size_medium: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  size_large: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.fontFamily.medium,
    textAlign: "center",
  },
  text_primary: {
    color: colors.neutral0,
  },
  text_secondary: {
    color: colors.neutral0,
  },
  text_outline: {
    color: colors.primary500,
  },
  text_ghost: {
    color: colors.primary500,
  },
  textSize_small: {
    fontSize: typography.fontSize.sm,
  },
  textSize_medium: {
    fontSize: typography.fontSize.md,
  },
  textSize_large: {
    fontSize: typography.fontSize.lg,
  },
  textDisabled: {
    opacity: 0.7,
  },
});
