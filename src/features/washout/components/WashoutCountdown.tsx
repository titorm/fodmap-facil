import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../shared/theme';
import type { WashoutPeriodStatus } from '../../../shared/types/entities';

export interface WashoutCountdownProps {
  startDate: Date;
  endDate: Date;
  status: WashoutPeriodStatus;
  onComplete?: () => void;
}

interface CountdownValues {
  days: number;
  hours: number;
  minutes: number;
  isComplete: boolean;
  percentComplete: number;
}

/**
 * WashoutCountdown Component
 *
 * Displays a countdown timer for washout periods with:
 * - Real-time countdown (days, hours, minutes)
 * - Progress bar visualization
 * - Completion notification
 * - Full accessibility support
 * - Theme-aware styling
 *
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export const WashoutCountdown: React.FC<WashoutCountdownProps> = ({
  startDate,
  endDate,
  status,
  onComplete,
}) => {
  const { theme } = useTheme();
  const { colors, spacing, typography, borderRadius } = theme;

  const [countdown, setCountdown] = useState<CountdownValues>(() =>
    calculateCountdown(startDate, endDate)
  );

  // Update countdown every minute
  useEffect(() => {
    // Initial calculation
    const newCountdown = calculateCountdown(startDate, endDate);
    setCountdown(newCountdown);

    // Check if already complete
    if (newCountdown.isComplete && onComplete) {
      onComplete();
    }

    // Set up interval for updates (every minute)
    const interval = setInterval(() => {
      const updated = calculateCountdown(startDate, endDate);
      setCountdown(updated);

      // Trigger completion callback when countdown reaches zero
      if (updated.isComplete && !newCountdown.isComplete && onComplete) {
        onComplete();
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [startDate, endDate, onComplete]);

  const styles = createStyles(theme, colors, spacing, typography, borderRadius);

  // Format accessibility label
  const getAccessibilityLabel = (): string => {
    if (countdown.isComplete || status === 'completed') {
      return 'Washout period complete';
    }

    const parts: string[] = [];
    if (countdown.days > 0) {
      parts.push(`${countdown.days} ${countdown.days === 1 ? 'day' : 'days'}`);
    }
    if (countdown.hours > 0) {
      parts.push(`${countdown.hours} ${countdown.hours === 1 ? 'hour' : 'hours'}`);
    }
    if (countdown.minutes > 0 && countdown.days === 0) {
      parts.push(`${countdown.minutes} ${countdown.minutes === 1 ? 'minute' : 'minutes'}`);
    }

    return `Washout period: ${parts.join(', ')} remaining`;
  };

  // Format accessibility hint
  const getAccessibilityHint = (): string => {
    const startDateStr = startDate.toLocaleDateString();
    const endDateStr = endDate.toLocaleDateString();
    return `Started ${startDateStr}, ends ${endDateStr}`;
  };

  return (
    <View
      style={styles.container}
      accessible={true}
      accessibilityRole="timer"
      accessibilityLabel={getAccessibilityLabel()}
      accessibilityHint={getAccessibilityHint()}
      accessibilityLiveRegion="polite"
    >
      {/* Header */}
      <View style={styles.header}>
        <Text
          style={styles.title}
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
          accessibilityRole="header"
        >
          Washout Period
        </Text>
        <Text style={styles.subtitle} allowFontScaling={true} maxFontSizeMultiplier={2}>
          {formatDateRange(startDate, endDate)}
        </Text>
      </View>

      {/* Countdown Display */}
      {countdown.isComplete || status === 'completed' ? (
        <View
          style={styles.completionContainer}
          accessible={true}
          accessibilityRole="alert"
          accessibilityLabel="Washout period complete. You can now proceed to the next test."
        >
          <Text
            style={[styles.completionText, { color: colors.success }]}
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            ✓ Complete
          </Text>
          <Text style={styles.completionSubtext} allowFontScaling={true} maxFontSizeMultiplier={2}>
            You can now proceed to the next test
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.countdownContainer}>
            {/* Days */}
            {countdown.days > 0 && (
              <View
                style={styles.timeUnit}
                accessible={true}
                accessibilityLabel={`${countdown.days} ${countdown.days === 1 ? 'day' : 'days'}`}
              >
                <Text style={styles.timeValue} allowFontScaling={true} maxFontSizeMultiplier={2}>
                  {countdown.days}
                </Text>
                <Text style={styles.timeLabel} allowFontScaling={true} maxFontSizeMultiplier={2}>
                  {countdown.days === 1 ? 'Day' : 'Days'}
                </Text>
              </View>
            )}

            {/* Hours */}
            <View
              style={styles.timeUnit}
              accessible={true}
              accessibilityLabel={`${countdown.hours} ${countdown.hours === 1 ? 'hour' : 'hours'}`}
            >
              <Text style={styles.timeValue} allowFontScaling={true} maxFontSizeMultiplier={2}>
                {countdown.hours}
              </Text>
              <Text style={styles.timeLabel} allowFontScaling={true} maxFontSizeMultiplier={2}>
                {countdown.hours === 1 ? 'Hour' : 'Hours'}
              </Text>
            </View>

            {/* Minutes (only show if less than 1 day remaining) */}
            {countdown.days === 0 && (
              <View
                style={styles.timeUnit}
                accessible={true}
                accessibilityLabel={`${countdown.minutes} ${countdown.minutes === 1 ? 'minute' : 'minutes'}`}
              >
                <Text style={styles.timeValue} allowFontScaling={true} maxFontSizeMultiplier={2}>
                  {countdown.minutes}
                </Text>
                <Text style={styles.timeLabel} allowFontScaling={true} maxFontSizeMultiplier={2}>
                  {countdown.minutes === 1 ? 'Min' : 'Mins'}
                </Text>
              </View>
            )}
          </View>

          {/* Progress Bar */}
          <View
            style={styles.progressBarContainer}
            accessible={true}
            accessibilityRole="progressbar"
            accessibilityLabel={`Progress: ${Math.round(countdown.percentComplete)}% complete`}
            accessibilityValue={{
              min: 0,
              max: 100,
              now: countdown.percentComplete,
            }}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${countdown.percentComplete}%`,
                  backgroundColor: colors.primary500,
                },
              ]}
            />
          </View>

          {/* Progress Percentage */}
          <Text style={styles.progressText} allowFontScaling={true} maxFontSizeMultiplier={2}>
            {Math.round(countdown.percentComplete)}% Complete
          </Text>
        </>
      )}
    </View>
  );
};

/**
 * Calculate countdown values from start and end dates
 */
function calculateCountdown(startDate: Date, endDate: Date): CountdownValues {
  const now = new Date();
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Calculate remaining time
  const remaining = end.getTime() - now.getTime();

  // Handle completion
  if (remaining <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      isComplete: true,
      percentComplete: 100,
    };
  }

  // Calculate time units
  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  // Calculate progress percentage
  const totalDuration = end.getTime() - start.getTime();
  const elapsed = now.getTime() - start.getTime();
  const percentComplete = Math.max(0, Math.min(100, (elapsed / totalDuration) * 100));

  return {
    days,
    hours,
    minutes,
    isComplete: false,
    percentComplete,
  };
}

/**
 * Format date range for display
 */
function formatDateRange(startDate: Date, endDate: Date): string {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
  };

  const startStr = start.toLocaleDateString(undefined, formatOptions);
  const endStr = end.toLocaleDateString(undefined, formatOptions);

  return `${startStr} - ${endStr}`;
}

/**
 * Create styles with theme support
 */
function createStyles(theme: any, colors: any, spacing: any, typography: any, borderRadius: any) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      ...theme.shadows.md,
    } as ViewStyle,

    header: {
      marginBottom: spacing.lg,
    } as ViewStyle,

    title: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
      marginBottom: spacing.xs,
    } as TextStyle,

    subtitle: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
    } as TextStyle,

    countdownContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing.lg,
    } as ViewStyle,

    timeUnit: {
      alignItems: 'center',
      minWidth: 80,
    } as ViewStyle,

    timeValue: {
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.primary500,
      marginBottom: spacing.xs,
    } as TextStyle,

    timeLabel: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      textTransform: 'uppercase',
    } as TextStyle,

    progressBarContainer: {
      height: 8,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: borderRadius.full,
      overflow: 'hidden',
      marginBottom: spacing.sm,
    } as ViewStyle,

    progressBarFill: {
      height: '100%',
      borderRadius: borderRadius.full,
    } as ViewStyle,

    progressText: {
      fontSize: typography.fontSize.sm,
      color: colors.textSecondary,
      textAlign: 'center',
    } as TextStyle,

    completionContainer: {
      alignItems: 'center',
      paddingVertical: spacing.xl,
    } as ViewStyle,

    completionText: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      marginBottom: spacing.sm,
    } as TextStyle,

    completionSubtext: {
      fontSize: typography.fontSize.md,
      color: colors.textSecondary,
      textAlign: 'center',
    } as TextStyle,
  });
}
