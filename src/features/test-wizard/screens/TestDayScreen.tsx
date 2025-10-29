import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { Button } from '../../../shared/components/atoms';
import { TestProgressHeader } from '../components/TestProgressHeader';
import { DoseCard } from '../components/DoseCard';
import { useTestWizard } from '../hooks';

export interface TestDayScreenProps {
  testStepId: string;
  onQuickSymptomEntry: () => void;
  onComplete: () => void;
}

export const TestDayScreen: React.FC<TestDayScreenProps> = ({
  testStepId,
  onQuickSymptomEntry,
  onComplete,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius, shadows } = theme;

  const {
    testStep,
    foodItem,
    currentDay,
    portionSize,
    canProgress,
    isLoading,
    error,
    doses,
    confirmConsumption,
    completeDay,
  } = useTestWizard(testStepId);

  const [timeSinceConsumption, setTimeSinceConsumption] = useState<string>('');

  // Update timer every minute
  useEffect(() => {
    const currentDose = doses.find((d) => d.dayNumber === currentDay);
    if (!currentDose?.consumed || !currentDose.consumedAt) {
      setTimeSinceConsumption('');
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const consumedTime = currentDose.consumedAt!.getTime();
      const diffMs = now - consumedTime;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

      if (diffHours > 0) {
        setTimeSinceConsumption(`${diffHours}h ${diffMinutes}m ago`);
      } else {
        setTimeSinceConsumption(`${diffMinutes}m ago`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [doses, currentDay]);

  const handleConfirmConsumption = async () => {
    try {
      await confirmConsumption();
    } catch (err) {
      console.error('Failed to confirm consumption:', err);
    }
  };

  const handleCompleteDay = async () => {
    try {
      // Complete day without symptoms (symptoms logged separately via quick entry)
      await completeDay([]);

      // If this was day 3, navigate to complete screen
      if (currentDay === 3) {
        onComplete();
      }
    } catch (err) {
      console.error('Failed to complete day:', err);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading test...</Text>
      </View>
    );
  }

  if (error || !testStep || !foodItem) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.error }]}>
          Failed to load test. Please try again.
        </Text>
      </View>
    );
  }

  const currentDose = doses.find((d) => d.dayNumber === currentDay);
  const completedDays = doses.filter((d) => d.consumed).map((d) => d.dayNumber);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Test Progress Header */}
      <TestProgressHeader
        currentDay={currentDay}
        completedDays={completedDays}
        foodItem={foodItem.name}
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.contentContainer, { padding: spacing.lg }]}
      >
        {/* Day-Specific Instructions */}
        <View
          style={[
            styles.instructionsCard,
            {
              backgroundColor: colors.surface,
              borderRadius: borderRadius.lg,
              padding: spacing.md,
              marginBottom: spacing.lg,
              ...shadows.sm,
            },
          ]}
        >
          <Text
            style={[
              styles.instructionsTitle,
              {
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.semibold,
                color: colors.text,
                marginBottom: spacing.sm,
              },
            ]}
            accessibilityRole="header"
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            Day {currentDay} Instructions
          </Text>
          <Text
            style={[
              styles.instructionsText,
              {
                fontSize: typography.fontSize.sm,
                color: colors.textSecondary,
                lineHeight: typography.fontSize.sm * typography.lineHeight.normal,
              },
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            {currentDose?.consumed
              ? 'Monitor your symptoms for the next 24 hours. Log any symptoms immediately when they occur.'
              : canProgress
                ? `Consume ${portionSize} of ${foodItem.name} and confirm below.`
                : 'Please wait 24 hours after your previous dose before continuing.'}
          </Text>
        </View>

        {/* Dose Card */}
        <DoseCard
          foodItem={foodItem.name}
          portionSize={portionSize}
          portionAmount={currentDay}
          dayNumber={currentDay}
          consumed={currentDose?.consumed || false}
          consumedAt={currentDose?.consumedAt}
          onConfirmConsumption={handleConfirmConsumption}
          disabled={!canProgress}
        />

        {/* Timer Display */}
        {currentDose?.consumed && timeSinceConsumption && (
          <View
            style={[
              styles.timerCard,
              {
                backgroundColor: colors.backgroundSecondary,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.lg,
                alignItems: 'center',
              },
            ]}
          >
            <Text
              style={[
                styles.timerLabel,
                {
                  fontSize: typography.fontSize.sm,
                  color: colors.textSecondary,
                  marginBottom: spacing.xs,
                },
              ]}
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              Time Since Consumption
            </Text>
            <Text
              style={[
                styles.timerValue,
                {
                  fontSize: typography.fontSize.xl,
                  fontWeight: typography.fontWeight.bold,
                  color: colors.primary700,
                },
              ]}
              accessibilityRole="timer"
              accessibilityLabel={`Time since consumption: ${timeSinceConsumption}`}
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              {timeSinceConsumption}
            </Text>
          </View>
        )}

        {/* Quick Symptom Entry Button */}
        <TouchableOpacity
          style={[
            styles.symptomButton,
            {
              backgroundColor: colors.warningLight,
              borderRadius: borderRadius.md,
              padding: spacing.md,
              marginTop: spacing.lg,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 44,
            },
          ]}
          onPress={onQuickSymptomEntry}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Log symptoms"
          accessibilityHint="Tap to quickly log any symptoms you're experiencing"
        >
          <Text
            style={[
              styles.symptomButtonIcon,
              {
                fontSize: typography.fontSize.lg,
                marginRight: spacing.sm,
              },
            ]}
          >
            📝
          </Text>
          <Text
            style={[
              styles.symptomButtonText,
              {
                fontSize: typography.fontSize.md,
                fontWeight: typography.fontWeight.medium,
                color: colors.warningDark,
              },
            ]}
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            Log Symptoms
          </Text>
        </TouchableOpacity>

        {/* Complete Day Button */}
        {currentDose?.consumed && (
          <View style={{ marginTop: spacing.lg }}>
            <Button
              title={currentDay === 3 ? 'Complete Test' : 'Complete Day & Continue'}
              onPress={handleCompleteDay}
              variant="primary"
              size="large"
              fullWidth
              accessibilityLabel={
                currentDay === 3
                  ? 'Complete the 3-day test'
                  : `Complete day ${currentDay} and continue to next day`
              }
              accessibilityHint="Tap to mark this day as complete"
            />
          </View>
        )}

        {/* Wait Message */}
        {!canProgress && !currentDose?.consumed && (
          <View
            style={[
              styles.waitCard,
              {
                backgroundColor: colors.infoLight,
                borderRadius: borderRadius.md,
                padding: spacing.md,
                marginTop: spacing.lg,
              },
            ]}
          >
            <Text
              style={[
                styles.waitText,
                {
                  fontSize: typography.fontSize.sm,
                  color: colors.infoDark,
                  textAlign: 'center',
                },
              ]}
              accessibilityRole="alert"
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              ⏰ Please wait 24 hours after your previous dose before continuing to Day {currentDay}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
  instructionsCard: {},
  instructionsTitle: {},
  instructionsText: {},
  timerCard: {},
  timerLabel: {},
  timerValue: {},
  symptomButton: {},
  symptomButtonIcon: {},
  symptomButtonText: {},
  waitCard: {},
  waitText: {},
});
