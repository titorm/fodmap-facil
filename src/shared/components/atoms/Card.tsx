import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { colors, spacing, borderRadius, shadows } from "../../theme";

export interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  elevation?: "sm" | "md" | "lg";
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  elevation = "md",
  accessibilityLabel,
  accessibilityHint,
  testID,
}) => {
  const cardStyle = [styles.card, shadows[elevation], style];

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        testID={testID}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={cardStyle}
      accessible={true}
      accessibilityRole="none"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral0,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
});
