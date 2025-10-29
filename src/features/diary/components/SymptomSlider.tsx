import React, { useEffect, useRef } from 'react';
import { View, Text, ViewStyle, TextStyle } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../../../shared/theme';
import { selectionHaptic } from '../../../shared/utils/haptics';

export interface SymptomSliderProps {
  value: number; // 0-3 (none, mild, moderate, severe)
  onChange: (value: number) => void;
  disabled?: boolean;
}

const severityLevels = [
  { value: 0, label: 'None', color: '#4CAF50' }, // green
  { value: 1, label: 'Mild', color: '#FFC107' }, // yellow
  { value: 2, label: 'Moderate', color: '#FF9800' }, // orange
  { value: 3, label: 'Severe', color: '#F44336' }, // red
];

/**
 * SymptomSlider Component
 *
 * Interactive slider for rating symptom severity with 4 discrete steps.
 * Provides haptic feedback and accessibility support.
 *
 * Features:
 * - 4 discrete steps (none, mild, moderate, severe)
 * - Color-coded segments (green, yellow, orange, red)
 * - Haptic feedback on value change
 * - Minimum 44pt touch target height
 * - Visual labels for each severity level
 * - Accessibility announcements for severity changes
 *
 * @param value - Current severity value (0-3)
 * @param onChange - Callback when value changes
 * @param disabled - Whether the slider is disabled
 *
 * @example
 * ```tsx
 * <SymptomSlider
 *   value={severity}
 *   onChange={(value) => setSeverity(value)}
 * />
 * ```
 */
export function SymptomSlider({ value, onChange, disabled = false }: SymptomSliderProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, accessibility } = theme;
  const previousValue = useRef(value);

  // Trigger haptic feedback when value changes
  useEffect(() => {
    if (value !== previousValue.current && !disabled) {
      selectionHaptic();
      previousValue.current = value;
    }
  }, [value, disabled]);

  const currentLevel = severityLevels[value];

  const containerStyle: ViewStyle = {
    width: '100%',
  };

  const sliderContainerStyle: ViewStyle = {
    minHeight: accessibility.minTouchTarget,
    justifyContent: 'center',
    marginBottom: spacing.md,
  };

  const labelsContainerStyle: ViewStyle = {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  };

  const labelStyle: TextStyle = {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    flex: 1,
  };

  const selectedLabelStyle: TextStyle = {
    ...labelStyle,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  };

  const currentValueStyle: ViewStyle = {
    backgroundColor: currentLevel.color,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  };

  const currentValueTextStyle: TextStyle = {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textOnPrimary,
  };

  const handleValueChange = (newValue: number) => {
    // Round to nearest integer to ensure discrete steps
    const roundedValue = Math.round(newValue);
    if (roundedValue !== value) {
      onChange(roundedValue);
    }
  };

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="adjustable"
      accessibilityLabel="Symptom severity"
      accessibilityValue={{
        min: 0,
        max: 3,
        now: value,
        text: currentLevel.label,
      }}
      accessibilityHint="Swipe up or down to adjust severity level"
    >
      {/* Current Value Display */}
      <View style={currentValueStyle}>
        <Text style={currentValueTextStyle}>{currentLevel.label}</Text>
      </View>

      {/* Slider */}
      <View style={sliderContainerStyle}>
        <Slider
          value={value}
          onValueChange={handleValueChange}
          minimumValue={0}
          maximumValue={3}
          step={1}
          minimumTrackTintColor={currentLevel.color}
          maximumTrackTintColor={colors.border}
          thumbTintColor={currentLevel.color}
          disabled={disabled}
          accessible={false} // Parent View handles accessibility
        />
      </View>

      {/* Labels */}
      <View style={labelsContainerStyle}>
        {severityLevels.map((level) => (
          <Text key={level.value} style={value === level.value ? selectedLabelStyle : labelStyle}>
            {level.label}
          </Text>
        ))}
      </View>
    </View>
  );
}
