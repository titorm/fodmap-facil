import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms';
import { useTestWizard } from '../hooks';
import { calculateToleranceStatus } from '../../../engine/fodmapEngine/tolerance';
import type { SymptomRecord, ToleranceStatus } from '../../../engine/fodmapEngine/types';

export interface TestCompleteScreenProps {
  testStepId: string;
  onNavigateToDashboard: () => void;
}

export const TestCompleteScreen: React.FC<TestCompleteScreenProps> = ({
  testStepId,
  onNavigateToDashboard,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const { testStep, foodItem, doses, isLoading } = useTestWizard(testStepId);

  // Calculate tolerance status from symptoms
  const toleranceStatus: ToleranceStatus = useMemo(() => {
    if (!doses || doses.length === 0) return 'untested';

    // Convert symptoms to engine format
    const symptomRecords: SymptomRecord[] = doses.flatMap((dose) =>
      dose.symptoms.map((symptom) => ({
        timestamp: symptom.timestamp.toISOString(),
        severity: mapSeverityNumberToString(symptom.severity),
        type: symptom.symptomType,
        notes: symptom.notes || undefined,
      }))
    );

    // Use engine to calculate tolerance
    try {
      return calculateToleranceStatus(symptomRecords);
    } catch (error) {
      console.error('Failed to calculate tolerance:', error);
      return 'untested';
    }
  }, [doses]);

  // Get tolerance message and color
  const getToleranceInfo = (
    status: ToleranceStatus
  ): { message: string; color: string; icon: string } => {
    switch (status) {
      case 'tolerated':
        return {
          message: 'Well Tolerated',
          color: colors.success,
          icon: '✓',
        };
      case 'sensitive':
        return {
          message: 'Mild Sensitivity',
          color: colors.warning,
          icon: '⚠',
        };
      case 'trigger':
        return {
          message: 'Trigger Food',
          color: colors.error,
          icon: '✗',
        };
      default:
        return {
          message: 'Not Tested',
          color: colors.textSecondary,
          icon: '?',
        };
    }
  };

  const toleranceInfo = getToleranceInfo(toleranceStatus);

  // Calculate symptom summary
  const symptomSummary = useMemo(() => {
    const summary: Record<number, { count: number; maxSeverity: number }> = {
      1: { count: 0, maxSeverity: 0 },
      2: { count: 0, maxSeverity: 0 },
      3: { count: 0, maxSeverity: 0 },
    };

    doses.forEach((dose) => {
      if (dose.symptoms.length > 0) {
        summary[dose.dayNumber].count = dose.symptoms.length;
        summary[dose.dayNumber].maxSeverity = Math.max(...dose.symptoms.map((s) => s.severity));
      }
    });

    return summary;
  }, [doses]);

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Calculating results...
        </Text>
      </View>
    );
  }

  if (!testStep || !foodItem) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load test results.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.contentContainer, { padding: spacing.lg }]}
    >
      {/* Completion Message */}
      <View style={[styles.headerSection, { marginBottom: spacing.xl }]}>
        <Text
          style={[
            styles.completionIcon,
            {
              fontSize: 64,
              textAlign: 'center',
              marginBottom: spacing.md,
            },
          ]}
        >
          🎉
        </Text>
        <Text
          style={[
            styles.completionTitle,
            {
              fontSize: typography.fontSize.xxxl,
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              textAlign: 'center',
              marginBottom: spacing.sm,
            },
          ]}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          Test Complete!
        </Text>
        <Text
          style={[
            styles.completionSubtitle,
            {
              fontSize: typography.fontSize.lg,
              color: colors.textSecondary,
              textAlign: 'center',
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          You've completed the 3-day test for {foodItem.name}
        </Text>
      </View>

      {/* Tolerance Status Card */}
      <View
        style={[
          styles.toleranceCard,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.lg,
            ...shadows.md,
            borderLeftWidth: 4,
            borderLeftColor: toleranceInfo.color,
          },
        ]}
      >
        <View style={[styles.toleranceHeader, { marginBottom: spacing.md }]}>
          <Text
            style={[
              styles.toleranceIcon,
              {
                fontSize: typography.fontSize.xxxl,
                color: toleranceInfo.color,
                marginRight: spacing.md,
              },
            ]}
          >
            {toleranceInfo.icon}
          </Text>
          <View style={styles.toleranceTextContainer}>
            <Text
              style={[
                styles.toleranceLabel,
                {
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                },
              ]}
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              Tolerance Status
            </Text>
            <Text
              style={[
                styles.toleranceStatus,
                {
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: toleranceInfo.color,
                },
              ]}
              accessibilityRole="text"
              accessibilityLabel={`Tolerance status: ${toleranceInfo.message}`}
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              {toleranceInfo.message}
            </Text>
          </View>
        </View>

        <Text
          style={[
            styles.toleranceDescription,
            {
              fontSize: typography.fontSize.md,
              color: colors.textSecondary,
              lineHeight: typography.fontSize.md * typography.lineHeight.normal,
            },
          ]}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          {toleranceStatus === 'tolerated' &&
            'Great news! You tolerated this food well with minimal or no symptoms.'}
          {toleranceStatus === 'sensitive' &&
            'You experienced some mild symptoms. Consider consuming smaller portions.'}
          {toleranceStatus === 'trigger' &&
            'This food triggered significant symptoms. Consider avoiding or limiting it.'}
          {toleranceStatus === 'untested' && 'Unable to determine tolerance status.'}
        </Text>
      </View>

      {/* Symptom Summary */}
      <View
        style={[
          styles.summaryCard,
          {
            backgroundColor: colors.surface,
            borderRadius: borderRadius.lg,
            padding: spacing.lg,
            marginBottom: spacing.xl,
            ...shadows.md,
          },
        ]}
      >
        <Text
          style={[
            styles.summaryTitle,
            {
              fontSize: typography.fontSize.lg,
              fontWeight: typography.fontWeight.bold,
              color: colors.text,
              marginBottom: spacing.md,
            },
          ]}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          Symptom Summary
        </Text>

        {[1, 2, 3].map((day) => {
          const daySummary = symptomSummary[day];
          const severityColor =
            daySummary.maxSeverity >= 7
              ? colors.error
              : daySummary.maxSeverity >= 4
                ? colors.warning
                : colors.success;

          return (
            <View
              key={day}
              style={[
                styles.daySummaryRow,
                {
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: spacing.sm,
                  borderBottomWidth: day < 3 ? 1 : 0,
                  borderBottomColor: colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.dayLabel,
                  {
                    fontSize: typography.fontSize.md,
                    fontWeight: typography.fontWeight.medium,
                    color: colors.text,
                  },
                ]}
                allowFontScaling={true}
                maxFontSizeMultiplier={2}
              >
                Day {day}
              </Text>

              <View style={styles.symptomInfo}>
                {daySummary.count > 0 ? (
                  <>
                    <Text
                      style={[
                        styles.symptomCount,
                        {
                          fontSize: typography.fontSize.sm,
                          color: colors.textSecondary,
                          marginRight: spacing.sm,
                        },
                      ]}
                      allowFontScaling={true}
                      maxFontSizeMultiplier={2}
                    >
                      {daySummary.count} symptom{daySummary.count !== 1 ? 's' : ''}
                    </Text>
                    <View
                      style={[
                        styles.severityBadge,
                        {
                          backgroundColor: severityColor,
                          borderRadius: borderRadius.sm,
                          paddingHorizontal: spacing.sm,
                          paddingVertical: spacing.xs,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.severityText,
                          {
                            fontSize: typography.fontSize.xs,
                            fontWeight: typography.fontWeight.medium,
                            color: colors.textOnPrimary,
                          },
                        ]}
                        allowFontScaling={true}
                        maxFontSizeMultiplier={1.5}
                      >
                        {daySummary.maxSeverity >= 7
                          ? 'Severe'
                          : daySummary.maxSeverity >= 4
                            ? 'Moderate'
                            : 'Mild'}
                      </Text>
                    </View>
                  </>
                ) : (
                  <Text
                    style={[
                      styles.noSymptoms,
                      {
                        fontSize: typography.fontSize.sm,
                        color: colors.textTertiary,
                      },
                    ]}
                    allowFontScaling={true}
                    maxFontSizeMultiplier={2}
                  >
                    No symptoms
                  </Text>
                )}
              </View>
            </View>
          );
        })}
      </View>

      {/* Return to Dashboard Button */}
      <Button
        title="Return to Dashboard"
        onPress={onNavigateToDashboard}
        variant="primary"
        size="large"
        fullWidth
        accessibilityLabel="Return to journey dashboard"
        accessibilityHint="Tap to go back to your journey dashboard"
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {},
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    textAlign: 'center',
  },
  headerSection: {},
  completionIcon: {},
  completionTitle: {},
  completionSubtitle: {},
  toleranceCard: {},
  toleranceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toleranceIcon: {},
  toleranceTextContainer: {
    flex: 1,
  },
  toleranceLabel: {},
  toleranceStatus: {},
  toleranceDescription: {},
  summaryCard: {},
  summaryTitle: {},
  daySummaryRow: {},
  dayLabel: {},
  symptomInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  symptomCount: {},
  severityBadge: {},
  severityText: {},
  noSymptoms: {},
});

/**
 * Map severity number (1-10) to string
 */
function mapSeverityNumberToString(severity: number): 'none' | 'mild' | 'moderate' | 'severe' {
  if (severity === 0) return 'none';
  if (severity <= 3) return 'mild';
  if (severity <= 6) return 'moderate';
  return 'severe';
}
