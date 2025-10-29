/**
 * WashoutScreen Component
 *
 * Main screen for the washout period experience.
 * Displays countdown timer, educational content, and reminder messages.
 *
 * Features:
 * - Real-time countdown display
 * - Personalized educational content cards
 * - Reminder banner notifications
 * - Pull-to-refresh functionality
 * - Loading and error states
 * - Full accessibility support
 *
 * Requirements: 1.1, 2.1, 3.1, 3.2, 3.5
 */

import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../../shared/theme';
import { LoadingSpinner } from '../../../shared/components/atoms/LoadingSpinner';
import { ErrorMessage } from '../../../shared/components/atoms/ErrorMessage';
import { WashoutCountdown } from '../components/WashoutCountdown';
import { EducationalContentCard } from '../components/EducationalContentCard';
import { ReminderBanner } from '../components/ReminderBanner';
import { useWashout } from '../hooks/useWashout';
import { TelemetryService } from '../services/TelemetryService';
import { TelemetryEventStore } from '../stores/TelemetryEventStore';
import { deriveUserState } from '../utils/userStateUtils';
import { UserProfileRepository } from '../../../services/repositories/UserProfileRepository';
import { ProtocolRunRepository } from '../../../services/repositories/ProtocolRunRepository';
import { TestStepRepository } from '../../../services/repositories/TestStepRepository';
import { db } from '../../../infrastructure/database/client';

export interface WashoutScreenProps {
  washoutPeriodId: string;
  userId: string;
}

// Create service instances
const telemetryEventStore = new TelemetryEventStore();
const telemetryService = new TelemetryService(telemetryEventStore);
const userProfileRepository = new UserProfileRepository(db);
const protocolRunRepository = new ProtocolRunRepository(db);
const testStepRepository = new TestStepRepository(db);

/**
 * WashoutScreen Component
 *
 * @param washoutPeriodId - ID of the active washout period
 * @param userId - ID of the current user
 *
 * @example
 * ```tsx
 * <WashoutScreen washoutPeriodId="washout-123" userId="user-456" />
 * ```
 */
export function WashoutScreen({ washoutPeriodId, userId }: WashoutScreenProps) {
  const { theme } = useTheme();
  const { colors, spacing, typography } = theme;

  const [dismissedReminders, setDismissedReminders] = useState<Set<string>>(new Set());

  // Fetch washout data using custom hook
  const {
    washoutPeriod,
    countdown,
    educationalContent,
    reminders,
    isLoading,
    error,
    refreshContent,
  } = useWashout(washoutPeriodId, userId);

  /**
   * Handle pull-to-refresh
   * Requirement 3.5: Add pull-to-refresh functionality
   */
  const handleRefresh = useCallback(async () => {
    await refreshContent();
  }, [refreshContent]);

  /**
   * Handle content view event
   * Requirement 7.1: Track content-viewed events
   */
  const handleContentView = useCallback(
    async (contentId: string) => {
      try {
        const userState = await deriveUserState(
          userId,
          userProfileRepository,
          protocolRunRepository,
          testStepRepository,
          async (uid) => await telemetryService.getViewedContentIds(uid)
        );
        await telemetryService.trackContentViewed(contentId, userState);
      } catch (error) {
        console.error('[WashoutScreen] Failed to track content view:', error);
      }
    },
    [userId]
  );

  /**
   * Handle content expand event
   * Requirement 7.2: Track content-expanded events
   */
  const handleContentExpand = useCallback(
    async (contentId: string) => {
      try {
        const userState = await deriveUserState(
          userId,
          userProfileRepository,
          protocolRunRepository,
          testStepRepository,
          async (uid) => await telemetryService.getViewedContentIds(uid)
        );
        await telemetryService.trackContentExpanded(contentId, userState);
      } catch (error) {
        console.error('[WashoutScreen] Failed to track content expand:', error);
      }
    },
    [userId]
  );

  /**
   * Handle content completion event
   * Requirement 7.3: Track content-completed events
   */
  const handleContentComplete = useCallback(
    async (contentId: string, timeSpent: number) => {
      try {
        const userState = await deriveUserState(
          userId,
          userProfileRepository,
          protocolRunRepository,
          testStepRepository,
          async (uid) => await telemetryService.getViewedContentIds(uid)
        );
        await telemetryService.trackContentCompleted(contentId, userState, timeSpent);
      } catch (error) {
        console.error('[WashoutScreen] Failed to track content completion:', error);
      }
    },
    [userId]
  );

  /**
   * Handle reminder dismissal
   * Requirement 2.1: Display reminder messages
   */
  const handleDismissReminder = useCallback((reminderId: string) => {
    setDismissedReminders((prev) => new Set(prev).add(reminderId));
  }, []);

  /**
   * Handle countdown completion
   * Requirement 1.3: Notify when countdown reaches zero
   */
  const handleCountdownComplete = useCallback(() => {
    console.log('[WashoutScreen] Washout period completed');
    // Could trigger navigation or show completion modal here
  }, []);

  // Styles
  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.background,
  };

  const headerStyle: ViewStyle = {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  };

  const titleStyle: TextStyle = {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  };

  const subtitleStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  };

  const contentContainerStyle: ViewStyle = {
    padding: spacing.lg,
  };

  const sectionTitleStyle: TextStyle = {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  };

  const emptyStateStyle: ViewStyle = {
    padding: spacing.xl,
    alignItems: 'center',
  };

  const emptyStateTextStyle: TextStyle = {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={containerStyle}>
        <View style={headerStyle}>
          <Text
            style={titleStyle}
            accessibilityRole="header"
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            Washout Period
          </Text>
        </View>
        <LoadingSpinner size="large" message="Loading your washout period..." fullScreen={true} />
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View style={containerStyle}>
        <View style={headerStyle}>
          <Text
            style={titleStyle}
            accessibilityRole="header"
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            Washout Period
          </Text>
        </View>
        <ErrorMessage
          title="Unable to Load Washout Period"
          message={error.message || 'An error occurred while loading your washout period data.'}
          onRetry={handleRefresh}
          retryLabel="Try Again"
          fullScreen={true}
        />
      </View>
    );
  }

  // No washout period found
  if (!washoutPeriod) {
    return (
      <View style={containerStyle}>
        <View style={headerStyle}>
          <Text
            style={titleStyle}
            accessibilityRole="header"
            allowFontScaling={true}
            maxFontSizeMultiplier={2}
          >
            Washout Period
          </Text>
        </View>
        <View style={emptyStateStyle}>
          <Text style={emptyStateTextStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
            No active washout period found.
          </Text>
        </View>
      </View>
    );
  }

  // Filter out dismissed reminders
  const activeReminders = reminders.filter((reminder) => !dismissedReminders.has(reminder.id));

  return (
    <View style={containerStyle}>
      {/* Header */}
      <View style={headerStyle}>
        <Text
          style={titleStyle}
          accessibilityRole="header"
          allowFontScaling={true}
          maxFontSizeMultiplier={2}
        >
          Washout Period
        </Text>
        <Text style={subtitleStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
          Take a break and learn while you wait
        </Text>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={handleRefresh}
            tintColor={colors.primary500}
            title="Pull to refresh"
            titleColor={colors.textSecondary}
          />
        }
        accessible={true}
        accessibilityLabel="Washout period content"
      >
        {/* Countdown Timer */}
        {/* Requirement 1.1: Display countdown timer at top */}
        <WashoutCountdown
          startDate={washoutPeriod.startDate}
          endDate={washoutPeriod.endDate}
          status={washoutPeriod.status}
          onComplete={handleCountdownComplete}
        />

        {/* Reminder Banners */}
        {/* Requirement 2.1: Display reminder messages */}
        {activeReminders.length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            {activeReminders.map((reminder) => (
              <ReminderBanner
                key={reminder.id}
                message={reminder.message}
                type="info"
                dismissible={true}
                onDismiss={() => handleDismissReminder(reminder.id)}
                accessibilityLabel={`Reminder: ${reminder.message}`}
                testID={`reminder-${reminder.id}`}
              />
            ))}
          </View>
        )}

        {/* Educational Content Section */}
        {/* Requirement 3.1: Display educational content cards */}
        {educationalContent.length > 0 && (
          <>
            <Text
              style={sectionTitleStyle}
              accessibilityRole="header"
              allowFontScaling={true}
              maxFontSizeMultiplier={2}
            >
              Learn While You Wait
            </Text>

            {/* Requirement 3.2: Render scrollable list of educational content cards */}
            {educationalContent.map((content) => (
              <EducationalContentCard
                key={content.id}
                content={content}
                onView={handleContentView}
                onExpand={handleContentExpand}
                onComplete={handleContentComplete}
              />
            ))}
          </>
        )}

        {/* Empty state for content */}
        {educationalContent.length === 0 && (
          <View style={emptyStateStyle}>
            <Text style={emptyStateTextStyle} allowFontScaling={true} maxFontSizeMultiplier={2}>
              No educational content available at this time.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
