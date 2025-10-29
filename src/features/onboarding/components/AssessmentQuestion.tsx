import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, AccessibilityRole } from 'react-native';
import { useTheme } from '../../../shared/theme';

export type QuestionType = 'boolean' | 'single-choice' | 'multiple-choice';

export interface AssessmentQuestionProps {
  question: string;
  type: QuestionType;
  options?: string[];
  value?: string | boolean | string[];
  onChange: (value: string | boolean | string[]) => void;
  error?: string;
}

export function AssessmentQuestion({
  question,
  type,
  options = [],
  value,
  onChange,
  error,
}: AssessmentQuestionProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, accessibility } = theme;

  const handleBooleanChange = (boolValue: boolean) => {
    onChange(boolValue);
  };

  const handleSingleChoiceChange = (option: string) => {
    onChange(option);
  };

  const handleMultipleChoiceChange = (option: string) => {
    const currentValues = (value as string[]) || [];
    const newValues = currentValues.includes(option)
      ? currentValues.filter((v) => v !== option)
      : [...currentValues, option];
    onChange(newValues);
  };

  const isSelected = (option: string): boolean => {
    if (type === 'single-choice') {
      return value === option;
    }
    if (type === 'multiple-choice') {
      return ((value as string[]) || []).includes(option);
    }
    return false;
  };

  const renderBooleanOptions = () => (
    <View style={styles.optionsContainer}>
      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            minHeight: accessibility.minTouchTarget,
            minWidth: accessibility.minTouchTarget,
            borderRadius: borderRadius.md,
            borderWidth: 2,
            borderColor: value === true ? colors.primary500 : colors.border,
            backgroundColor: value === true ? colors.primary50 : colors.background,
            marginRight: spacing.md,
            flex: 1,
          },
        ]}
        onPress={() => handleBooleanChange(true)}
        accessible={true}
        accessibilityRole={'radio' as AccessibilityRole}
        accessibilityLabel="Yes"
        accessibilityHint={`Select yes for: ${question}`}
        accessibilityState={{ selected: value === true }}
      >
        <Text
          style={[
            styles.optionText,
            {
              fontSize: typography.fontSize.md,
              color: value === true ? colors.primary700 : colors.text,
              fontWeight:
                value === true ? typography.fontWeight.semibold : typography.fontWeight.regular,
            },
          ]}
        >
          Yes
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            minHeight: accessibility.minTouchTarget,
            minWidth: accessibility.minTouchTarget,
            borderRadius: borderRadius.md,
            borderWidth: 2,
            borderColor: value === false ? colors.primary500 : colors.border,
            backgroundColor: value === false ? colors.primary50 : colors.background,
            flex: 1,
          },
        ]}
        onPress={() => handleBooleanChange(false)}
        accessible={true}
        accessibilityRole={'radio' as AccessibilityRole}
        accessibilityLabel="No"
        accessibilityHint={`Select no for: ${question}`}
        accessibilityState={{ selected: value === false }}
      >
        <Text
          style={[
            styles.optionText,
            {
              fontSize: typography.fontSize.md,
              color: value === false ? colors.primary700 : colors.text,
              fontWeight:
                value === false ? typography.fontWeight.semibold : typography.fontWeight.regular,
            },
          ]}
        >
          No
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderChoiceOptions = () => (
    <View style={styles.choiceOptionsContainer}>
      {options.map((option, index) => {
        const selected = isSelected(option);
        return (
          <TouchableOpacity
            key={`${option}-${index}`}
            style={[
              styles.choiceOption,
              {
                minHeight: accessibility.minTouchTarget,
                borderRadius: borderRadius.md,
                borderWidth: 2,
                borderColor: selected ? colors.primary500 : colors.border,
                backgroundColor: selected ? colors.primary50 : colors.background,
                marginBottom: spacing.sm,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.md,
              },
            ]}
            onPress={() =>
              type === 'single-choice'
                ? handleSingleChoiceChange(option)
                : handleMultipleChoiceChange(option)
            }
            accessible={true}
            accessibilityRole={
              (type === 'single-choice' ? 'radio' : 'checkbox') as AccessibilityRole
            }
            accessibilityLabel={option}
            accessibilityHint={
              type === 'single-choice'
                ? `Select ${option} for: ${question}`
                : `Toggle ${option} for: ${question}`
            }
            accessibilityState={type === 'single-choice' ? { selected } : { checked: selected }}
          >
            <Text
              style={[
                styles.choiceOptionText,
                {
                  fontSize: typography.fontSize.md,
                  color: selected ? colors.primary700 : colors.text,
                  fontWeight: selected
                    ? typography.fontWeight.semibold
                    : typography.fontWeight.regular,
                  lineHeight: typography.fontSize.md * typography.lineHeight.normal,
                },
              ]}
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              {option}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text
        style={[
          styles.question,
          {
            fontSize: typography.fontSize.lg,
            fontWeight: typography.fontWeight.semibold,
            color: colors.text,
            marginBottom: spacing.lg,
            lineHeight: typography.fontSize.lg * typography.lineHeight.normal,
          },
        ]}
        accessibilityRole="header"
        allowFontScaling={true}
        maxFontSizeMultiplier={2}
      >
        {question}
      </Text>

      {type === 'boolean' && renderBooleanOptions()}
      {(type === 'single-choice' || type === 'multiple-choice') && renderChoiceOptions()}

      {error && (
        <Text
          style={[
            styles.errorText,
            {
              fontSize: typography.fontSize.sm,
              color: colors.error,
              marginTop: spacing.sm,
            },
          ]}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  question: {
    fontWeight: '600',
  },
  optionsContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  optionButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    textAlign: 'center',
  },
  choiceOptionsContainer: {
    width: '100%',
  },
  choiceOption: {
    justifyContent: 'center',
  },
  choiceOptionText: {
    fontWeight: '400',
  },
  errorText: {
    fontWeight: '400',
  },
});
