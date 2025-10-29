import React from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms';

export interface DiaryEmptyStateProps {
  onLogFirstSymptom: () => void;
}

/**
 * DiaryEmptyState Component
 *
 * Displays an encouraging empty state when no symptom entries exist.
 * Provides a clear call-to-action to log the first symptom.
 *
 * Features:
 * - Empty state illustration (emoji)
 * - Encouraging message
 * - Primary action button to log first symptom
 *
 * @param onLogFirstSymptom - Callback when "Log First Symptom" button is pressed
 *
 * @example
 * ```tsx
 * <DiaryEmptyState
 *   onLogFirstSymptom={() => setShowModal(true)}
 * />
 * ```
 */
export function DiaryEmptyState({ onLogFirstSymptom }: DiaryEmptyStateProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const containerStyle: ViewStyle = {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  };

  const illustrationStyle: TextStyle = {
    fontSize: 80,
    marginBottom: spacing.lg,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  };

  const descriptionStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * typography.lineHeight.relaxed,
    marginBottom: spacing.xl,
    maxWidth: 300,
  };

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="text"
      accessibilityLabel="No symptoms logged yet. Start tracking your symptoms to understand your body better."
    >
      {/* Illustration */}
      <Text style={illustrationStyle}>📝</Text>

      {/* Title */}
      <Text
        style={titleStyle}
        accessibilityRole="header"
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        No Symptoms Yet
      </Text>

      {/* Description */}
      <Text style={descriptionStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
        Start tracking your symptoms to understand your body better and identify food triggers.
      </Text>

      {/* Action Button */}
      <Button
        title="Log First Symptom"
        onPress={onLogFirstSymptom}
        size="large"
        accessibilityLabel="Log first symptom"
        accessibilityHint="Open symptom entry form to log your first symptom"
      />
    </View>
  );
}
