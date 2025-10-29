/**
 * useWashout Hook
 *
 * Custom React hook for managing washout period experience.
 * Provides countdown tracking, personalized educational content,
 * and reminder management for active washout periods.
 *
 * Requirements: 1.1, 1.2, 2.1, 3.1, 3.2
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryClient';
import { WashoutPeriodRepository } from '../../../services/repositories/WashoutPeriodRepository';
import { UserProfileRepository } from '../../../services/repositories/UserProfileRepository';
import { ProtocolRunRepository } from '../../../services/repositories/ProtocolRunRepository';
import { TestStepRepository } from '../../../services/repositories/TestStepRepository';
import { NotificationScheduleRepository } from '../../../services/repositories/NotificationScheduleRepository';
import { db } from '../../../infrastructure/database/client';
import { ContentSurfacingEngine } from '../services/ContentSurfacingEngine';
import { TelemetryService } from '../services/TelemetryService';
import { NotificationService } from '../services/NotificationService';
import { LocalJsonContentRepository } from '../repositories/LocalJsonContentRepository';
import { TelemetryEventStore } from '../stores/TelemetryEventStore';
import { deriveUserState } from '../utils/userStateUtils';
import type { WashoutPeriod } from '../../../db/schema';
import type { EducationalContent } from '../../../content/education/types';

/**
 * Countdown state
 */
export interface Countdown {
  /** Days remaining in washout period */
  days: number;

  /** Hours remaining (0-23) */
  hours: number;

  /** Minutes remaining (0-59) */
  minutes: number;

  /** Whether the washout period is complete */
  isComplete: boolean;
}

/**
 * Reminder message structure
 */
export interface ReminderMessage {
  /** Unique identifier */
  id: string;

  /** Message text */
  message: string;

  /** Scheduled time for the reminder */
  scheduledTime: Date;

  /** Whether the reminder has been sent */
  sent: boolean;
}

/**
 * Return type for useWashout hook
 */
export interface UseWashoutReturn {
  /** Current washout period data */
  washoutPeriod: WashoutPeriod | null;

  /** Countdown timer values */
  countdown: Countdown;

  /** Personalized educational content items */
  educationalContent: EducationalContent[];

  /** Scheduled reminder messages */
  reminders: ReminderMessage[];

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Refresh educational content */
  refreshContent: () => Promise<void>;

  /** Update reminder frequency */
  updateReminderFrequency: (hours: number) => Promise<void>;
}

// Create repository instances
const washoutPeriodRepository = new WashoutPeriodRepository(db);
const userProfileRepository = new UserProfileRepository(db);
const protocolRunRepository = new ProtocolRunRepository(db);
const testStepRepository = new TestStepRepository(db);
const notificationRepository = new NotificationScheduleRepository(db);

// Create service instances
const contentRepository = new LocalJsonContentRepository();
const contentSurfacingEngine = new ContentSurfacingEngine(contentRepository);
const telemetryEventStore = new TelemetryEventStore();
const telemetryService = new TelemetryService(telemetryEventStore);
const notificationService = new NotificationService(notificationRepository);

/**
 * Calculate countdown values from washout period dates
 *
 * Requirement 1.1: Display countdown showing days and hours remaining
 * Requirement 1.2: Update countdown display regularly
 *
 * @param startDate - Washout period start date
 * @param endDate - Washout period end date
 * @returns Countdown object with days, hours, minutes, and completion status
 */
function calculateCountdown(startDate: Date, endDate: Date): Countdown {
  const now = new Date();
  const remaining = endDate.getTime() - now.getTime();

  // Requirement 1.3: Notify when countdown reaches zero
  if (remaining <= 0) {
    return { days: 0, hours: 0, minutes: 0, isComplete: true };
  }

  const days = Math.floor(remaining / (1000 * 60 * 60 * 24));
  const hours = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isComplete: false };
}

/**
 * useWashout Hook
 *
 * Manages washout period experience including countdown, content, and reminders.
 *
 * @param washoutPeriodId - ID of the washout period to manage
 * @param userId - ID of the current user
 * @returns Washout period data and management functions
 *
 * @example
 * ```tsx
 * const {
 *   washoutPeriod,
 *   countdown,
 *   educationalContent,
 *   reminders,
 *   isLoading,
 *   error,
 *   refreshContent,
 *   updateReminderFrequency
 * } = useWashout(washoutPeriodId, userId);
 * ```
 */
export function useWashout(washoutPeriodId: string, userId: string): UseWashoutReturn {
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState<Countdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    isComplete: false,
  });

  // Fetch washout period data
  const {
    data: washoutPeriod,
    isLoading: isLoadingWashout,
    error: washoutError,
  } = useQuery({
    queryKey: queryKeys.washoutPeriods.byId(washoutPeriodId),
    queryFn: async (): Promise<WashoutPeriod | null> => {
      return await washoutPeriodRepository.findById(washoutPeriodId);
    },
    enabled: !!washoutPeriodId,
  });

  // Fetch personalized educational content
  const {
    data: educationalContent = [],
    isLoading: isLoadingContent,
    error: contentError,
    refetch: refetchContent,
  } = useQuery({
    queryKey: ['washout', 'content', washoutPeriodId, userId],
    queryFn: async (): Promise<EducationalContent[]> => {
      // Requirement 3.1: Request personalized content based on user state
      const userState = await deriveUserState(
        userId,
        userProfileRepository,
        protocolRunRepository,
        testStepRepository,
        async (uid) => await telemetryService.getViewedContentIds(uid)
      );

      // Requirement 3.1: Select between 2 and 5 educational content items
      const content = await contentSurfacingEngine.selectContent(userState, 5);
      return content;
    },
    enabled: !!washoutPeriodId && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch reminder messages
  const {
    data: reminders = [],
    isLoading: isLoadingReminders,
    error: remindersError,
  } = useQuery({
    queryKey: ['washout', 'reminders', washoutPeriodId],
    queryFn: async (): Promise<ReminderMessage[]> => {
      // Requirement 2.1: Fetch reminder messages from NotificationService
      const pendingNotifications = await notificationRepository.findPending();

      // Filter to only this washout period's notifications
      // Note: Using washoutPeriodId as testStepId due to schema limitation
      const washoutNotifications = pendingNotifications.filter(
        (notification) => notification.testStepId === washoutPeriodId
      );

      return washoutNotifications.map((notification) => ({
        id: notification.id,
        message: notification.message,
        scheduledTime: notification.scheduledTime,
        sent: notification.sentStatus,
      }));
    },
    enabled: !!washoutPeriodId,
  });

  // Calculate and update countdown
  useEffect(() => {
    if (!washoutPeriod) return;

    // Initial calculation
    const updateCountdown = () => {
      const newCountdown = calculateCountdown(washoutPeriod.startDate, washoutPeriod.endDate);
      setCountdown(newCountdown);

      // Requirement 1.3: Notify when countdown reaches zero
      if (newCountdown.isComplete && !countdown.isComplete) {
        console.log('[useWashout] Washout period completed');
        // Invalidate queries to refresh data
        queryClient.invalidateQueries({
          queryKey: queryKeys.washoutPeriods.byId(washoutPeriodId),
        });
      }
    };

    updateCountdown();

    // Requirement 1.2: Update countdown every minute
    const interval = setInterval(updateCountdown, 60000); // 1 minute

    return () => clearInterval(interval);
  }, [washoutPeriod, washoutPeriodId, countdown.isComplete, queryClient]);

  /**
   * Refresh educational content
   *
   * Requirement 3.2: Allow users to refresh content dynamically
   */
  const refreshContent = useCallback(async () => {
    await refetchContent();
  }, [refetchContent]);

  /**
   * Update reminder frequency
   *
   * Requirement 2.4: Allow users to customize reminder frequency
   */
  const updateReminderFrequency = useCallback(
    async (hours: number) => {
      if (!washoutPeriod) {
        throw new Error('No active washout period');
      }

      // Cancel existing reminders and reschedule with new frequency
      await notificationService.cancelWashoutReminders(washoutPeriodId);

      // Note: We need anxiety level to reschedule properly
      // For now, we'll use 'medium' as default
      // In a real implementation, this should be fetched from user state
      await notificationService.scheduleWashoutReminders(washoutPeriod, hours, 'medium');

      // Invalidate reminders query to refresh
      queryClient.invalidateQueries({
        queryKey: ['washout', 'reminders', washoutPeriodId],
      });
    },
    [washoutPeriod, washoutPeriodId, queryClient]
  );

  // Combine loading states
  const isLoading = isLoadingWashout || isLoadingContent || isLoadingReminders;

  // Combine errors
  const error = washoutError || contentError || remindersError || null;

  return {
    washoutPeriod: washoutPeriod || null,
    countdown,
    educationalContent,
    reminders,
    isLoading,
    error,
    refreshContent,
    updateReminderFrequency,
  };
}
