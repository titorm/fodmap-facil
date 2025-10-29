import React from 'react';
import { View, Text, TouchableOpacity, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../shared/theme';
import type { SymptomType } from '../../../db/schema';

export type ExtendedSymptomType = SymptomType | 'nausea' | 'other';

export interface SymptomTypeSelectorProps {
  selectedType?: ExtendedSymptomType;
  onSelect: (type: ExtendedSymptomType) => void;
}

interface SymptomTypeOption {
  type: ExtendedSymptomType;
  label: string;
  icon: string;
}

const symptomTypes: SymptomTypeOption[] = [
  { type: 'bloating', label: 'Bloating', icon: '🎈' },
  { type: 'pain', label: 'Pain', icon: '⚡' },
  { type: 'gas', label: 'Gas', icon: '💨' },
  { type: 'diarrhea', label: 'Diarrhea', icon: '💧' },
  { type: 'constipation', label: 'Constipation', icon: '🔒' },
  { type: 'nausea', label: 'Nausea', icon: '🤢' },
  { type: 'other', label: 'Other', icon: '📝' },
];

/**
 * SymptomTypeSelector Component
 *
 * Displays a 2-column grid of symptom type buttons with icons and labels.
 * Implements accessibility features including proper labels and minimum touch targets.
 *
 * Features:
 * - 2-column grid layout
 * - Icon and label for each symptom type
 * - Selected state with border highlight
 * - Minimum 44pt touch targets (WCAG 2.1 AA)
 * - Accessibility labels and hints
 *
 * @param selectedType - Currently selected symptom type
 * @param onSelect - Callback when a symptom type is selected
 *
 * @example
 * ```tsx
 * <SymptomTypeSelector
 *   selectedType={selectedType}
 *   onSelect={(type) => setSelectedType(type)}
 * />
 * ```
 */
export function SymptomTypeSelector({ selectedType, onSelect }: SymptomTypeSelectorProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, accessibility } = theme;

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  };

  const getButtonStyle = (type: ExtendedSymptomType): ViewStyle => ({
    width: '48%',
    minHeight: accessibility.minTouchTarget,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    borderColor: selectedType === type ? colors.primary500 : colors.border,
    padding: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  });

  const iconStyle: TextStyle = {
    fontSize: typography.fontSize.xxxl,
    marginBottom: spacing.xs,
  };

  const labelStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
  };

  return (
    <View
      style={containerStyle}
      accessible={true}
      accessibilityRole="radiogroup"
      accessibilityLabel="Select symptom type"
    >
      {symptomTypes.map((symptom) => (
        <TouchableOpacity
          key={symptom.type}
          style={getButtonStyle(symptom.type)}
          onPress={() => onSelect(symptom.type)}
          accessible={true}
          accessibilityRole="radio"
          accessibilityLabel={symptom.label}
          accessibilityHint={`Select ${symptom.label} as symptom type`}
          accessibilityState={{ checked: selectedType === symptom.type }}
        >
          <Text style={iconStyle}>{symptom.icon}</Text>
          <Text style={labelStyle}>{symptom.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}
