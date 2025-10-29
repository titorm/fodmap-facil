/**
 * Notification Scheduler
 *
 * Handles low-level scheduling logic with quiet hours enforcement
 * Requirements: 1.1, 2.1, 2.2, 5.2, 5.3
 */

import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  NotificationError,
  NotificationErrorCode,
  type ScheduleNotificationInput,
  type ScheduledNotification,
  type NotificationType,
  type NotificationTrigger,
} from './types';
import { QuietHoursManager } from './QuietHoursManager';

const SCHEDULED_NOTIFICATIONS_KEY = '@notifications:scheduled';

/**
 * NotificationScheduler - Low-level scheduling with quiet hours support
 */
export class NotificationScheduler {
  private quietHoursManager: QuietHoursManager;

  constructor() {
    this.quietHoursManager = new QuietHoursManager();
  }

  // ============================================================================
  // CORE SCHEDULING (Subtask 5.1)
  // ============================================================================

  /**
   * Schedule a single notification with quiet hours enforcement
   * Requirements: 1.1, 2.1, 5.2, 5.3
   */
  async schedule(input: ScheduleNotificationInput): Promise<string> {
    try {
      // Validate trigger times
      this.validateTrigger(input.trigger);

      // Calculate the scheduled time
      const scheduledTime = this.calculateScheduledTime(input.trigger);

      // Check and adjust for quiet hours
      const { adjustedTime, wasAdjusted } = await this.adjustForQuietHours(
        scheduledTime,
        input.data.type as NotificationType
      );

      // Create adjusted trigger if time was changed
      const finalTrigger = wasAdjusted
        ? this.createTriggerFromDate(adjustedTime, input.trigger.repeats)
        : input.trigger;

      // Convert to Expo trigger format
      const expoTrigger = this.convertToExpoTrigger(finalTrigger);

      // Schedule with Expo
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: input.title,
          body: input.body,
          data: {
            ...input.data,
            originalTime: scheduledTime.toISOString(),
            adjustedTime: adjustedTime.toISOString(),
            wasAdjusted,
          },
          sound: input.sound !== false,
          badge: input.badge,
          categoryIdentifier: input.categoryIdentifier,
        },
        trigger: expoTrigger,
      });

      // Track the scheduled notification
      await this.trackScheduledNotification(notificationId, input, adjustedTime);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);

      if (error instanceof NotificationError) {
        throw error;
      }

      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to schedule notification',
        error
      );
    }
  }

  /**
   * Reschedule an existing notification to a new time
   * Requirements: 5.3
   */
  async reschedule(id: string, newTime: Date): Promise<void> {
    try {
      // Get the existing notification
      const tracked = await this.getTrackedNotifications();
      const existing = tracked.find((n) => n.id === id);

      if (!existing) {
        throw new NotificationError(
          NotificationErrorCode.SCHEDULING_FAILED,
          'Notification not found for rescheduling'
        );
      }

      // Cancel the existing notification
      await this.cancel(id);

      // Create new trigger with the new time
      const newTrigger: NotificationTrigger = {
        type: 'date',
        date: newTime,
        repeats: false,
      };

      // Schedule with the new time
      const input: ScheduleNotificationInput = {
        title: existing.title,
        body: existing.body,
        data: existing.data,
        trigger: newTrigger,
      };

      await this.schedule(input);
    } catch (error) {
      console.error('Error rescheduling notification:', error);
      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to reschedule notification',
        error
      );
    }
  }

  /**
   * Cancel a specific notification by ID
   * Requirements: 9.2
   */
  async cancel(id: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
      await this.removeTrackedNotification(id);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw new NotificationError(
        NotificationErrorCode.CANCELLATION_FAILED,
        'Failed to cancel notification',
        error
      );
    }
  }

  // ============================================================================
  // BATCH OPERATIONS (Subtask 5.1)
  // ============================================================================

  /**
   * Schedule multiple notifications at once
   * Requirements: 1.1, 2.1
   */
  async scheduleMultiple(notifications: ScheduleNotificationInput[]): Promise<string[]> {
    const ids: string[] = [];
    const errors: Error[] = [];

    for (const notification of notifications) {
      try {
        const id = await this.schedule(notification);
        ids.push(id);
      } catch (error) {
        console.error('Error in batch scheduling:', error);
        errors.push(error as Error);
      }
    }

    // If all failed, throw error
    if (errors.length === notifications.length) {
      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'All notifications failed to schedule',
        errors
      );
    }

    // If some failed, log but continue
    if (errors.length > 0) {
      console.warn(`${errors.length} of ${notifications.length} notifications failed to schedule`);
    }

    return ids;
  }

  /**
   * Cancel multiple notifications at once
   * Requirements: 9.2
   */
  async cancelMultiple(ids: string[]): Promise<void> {
    const errors: Error[] = [];

    for (const id of ids) {
      try {
        await this.cancel(id);
      } catch (error) {
        console.error('Error in batch cancellation:', error);
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      console.warn(`${errors.length} of ${ids.length} notifications failed to cancel`);
    }
  }

  // ============================================================================
  // QUERY METHODS
  // ============================================================================

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      return await this.getTrackedNotifications();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  }

  /**
   * Get scheduled notifications by type
   */
  async getScheduledNotificationsByType(type: NotificationType): Promise<ScheduledNotification[]> {
    try {
      const all = await this.getTrackedNotifications();
      return all.filter((n) => n.notificationType === type);
    } catch (error) {
      console.error('Error getting scheduled notifications by type:', error);
      return [];
    }
  }

  // ============================================================================
  // QUIET HOURS INTEGRATION (Subtask 5.3)
  // ============================================================================

  /**
   * Check if a time falls within quiet hours
   * Requirements: 5.2
   */
  async isInQuietHours(time: Date): Promise<boolean> {
    return this.quietHoursManager.isInQuietHours(time);
  }

  /**
   * Adjust notification time for quiet hours
   * Returns the adjusted time and whether it was changed
   * Requirements: 5.2, 5.3
   */
  async adjustForQuietHours(
    time: Date,
    notificationType: NotificationType
  ): Promise<{ adjustedTime: Date; wasAdjusted: boolean }> {
    // Check if this notification should override quiet hours
    const shouldOverride = await this.quietHoursManager.shouldOverrideQuietHours(
      notificationType,
      time
    );

    if (shouldOverride) {
      return { adjustedTime: time, wasAdjusted: false };
    }

    // Check if time is in quiet hours
    const inQuietHours = await this.isInQuietHours(time);

    if (!inQuietHours) {
      return { adjustedTime: time, wasAdjusted: false };
    }

    // Adjust to next available time after quiet hours
    const adjustedTime = await this.quietHoursManager.getNextAvailableTime(time);

    return { adjustedTime, wasAdjusted: true };
  }

  // ============================================================================
  // TRIGGER CALCULATION (Subtask 5.1)
  // ============================================================================

  /**
   * Calculate the scheduled time from a trigger
   * Requirements: 1.1, 2.1, 2.2
   */
  private calculateScheduledTime(trigger: NotificationTrigger): Date {
    if (trigger.type === 'date' && trigger.date) {
      return trigger.date;
    }

    if (trigger.type === 'daily') {
      return this.calculateDailyTriggerTime(trigger);
    }

    if (trigger.type === 'weekly') {
      return this.calculateWeeklyTriggerTime(trigger);
    }

    // Default to now
    return new Date();
  }

  /**
   * Calculate time for daily trigger
   * Requirements: 1.1
   */
  private calculateDailyTriggerTime(trigger: NotificationTrigger): Date {
    const now = new Date();
    const scheduled = new Date();

    scheduled.setHours(trigger.hour ?? 0);
    scheduled.setMinutes(trigger.minute ?? 0);
    scheduled.setSeconds(0);
    scheduled.setMilliseconds(0);

    // If the time has passed today, schedule for tomorrow
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1);
    }

    return scheduled;
  }

  /**
   * Calculate time for weekly trigger
   * Requirements: 2.1
   */
  private calculateWeeklyTriggerTime(trigger: NotificationTrigger): Date {
    const now = new Date();
    const scheduled = new Date();

    scheduled.setHours(trigger.hour ?? 0);
    scheduled.setMinutes(trigger.minute ?? 0);
    scheduled.setSeconds(0);
    scheduled.setMilliseconds(0);

    // Calculate days until target weekday
    const currentWeekday = scheduled.getDay();
    const targetWeekday = trigger.weekday ?? 0;

    let daysUntilTarget = targetWeekday - currentWeekday;

    // If target day has passed this week, or it's today but time has passed
    if (daysUntilTarget < 0 || (daysUntilTarget === 0 && scheduled <= now)) {
      daysUntilTarget += 7;
    }

    scheduled.setDate(scheduled.getDate() + daysUntilTarget);

    return scheduled;
  }

  /**
   * Create a date trigger from a Date object
   */
  private createTriggerFromDate(date: Date, repeats: boolean = false): NotificationTrigger {
    return {
      type: 'date',
      date,
      repeats,
    };
  }

  // ============================================================================
  // TRIGGER VALIDATION (Subtask 5.1)
  // ============================================================================

  /**
   * Validate trigger configuration
   * Requirements: 2.2
   */
  private validateTrigger(trigger: NotificationTrigger): void {
    if (trigger.type === 'date') {
      if (!trigger.date) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Date trigger requires a date'
        );
      }

      // Check if date is in the past
      if (trigger.date < new Date()) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Cannot schedule notification in the past'
        );
      }
    }

    if (trigger.type === 'daily') {
      if (trigger.hour === undefined || trigger.minute === undefined) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Daily trigger requires hour and minute'
        );
      }

      if (trigger.hour < 0 || trigger.hour > 23) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Hour must be between 0 and 23'
        );
      }

      if (trigger.minute < 0 || trigger.minute > 59) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Minute must be between 0 and 59'
        );
      }
    }

    if (trigger.type === 'weekly') {
      if (trigger.weekday === undefined) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Weekly trigger requires weekday'
        );
      }

      if (trigger.weekday < 0 || trigger.weekday > 6) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Weekday must be between 0 (Sunday) and 6 (Saturday)'
        );
      }

      if (trigger.hour === undefined || trigger.minute === undefined) {
        throw new NotificationError(
          NotificationErrorCode.INVALID_TIME,
          'Weekly trigger requires hour and minute'
        );
      }
    }
  }

  // ============================================================================
  // EXPO TRIGGER CONVERSION
  // ============================================================================

  /**
   * Convert our trigger format to Expo's trigger format
   */
  private convertToExpoTrigger(
    trigger: NotificationTrigger
  ): Notifications.NotificationTriggerInput {
    if (trigger.type === 'date' && trigger.date) {
      return {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: trigger.date,
      };
    }

    if (trigger.type === 'daily') {
      return {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: trigger.hour ?? 0,
        minute: trigger.minute ?? 0,
        repeats: trigger.repeats ?? true,
      };
    }

    if (trigger.type === 'weekly' && trigger.weekday !== undefined) {
      return {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: trigger.weekday,
        hour: trigger.hour ?? 0,
        minute: trigger.minute ?? 0,
        repeats: trigger.repeats ?? true,
      };
    }

    // Default to immediate trigger
    return null;
  }

  // ============================================================================
  // NOTIFICATION TRACKING
  // ============================================================================

  /**
   * Track a scheduled notification in AsyncStorage
   */
  private async trackScheduledNotification(
    notificationId: string,
    input: ScheduleNotificationInput,
    scheduledTime: Date
  ): Promise<void> {
    try {
      const tracked = await this.getTrackedNotifications();

      const notification: ScheduledNotification = {
        id: notificationId,
        localId: `local_${Date.now()}`,
        userId: 'current_user', // TODO: Get from auth context
        notificationType: input.data.type as NotificationType,
        title: input.title,
        body: input.body,
        scheduledTime,
        trigger: input.trigger,
        data: input.data,
        createdAt: new Date(),
      };

      tracked.push(notification);
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(tracked));
    } catch (error) {
      console.error('Error tracking scheduled notification:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to track scheduled notification',
        error
      );
    }
  }

  /**
   * Remove a tracked notification from AsyncStorage
   */
  private async removeTrackedNotification(notificationId: string): Promise<void> {
    try {
      const tracked = await this.getTrackedNotifications();
      const filtered = tracked.filter((n) => n.id !== notificationId);
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error removing tracked notification:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to remove tracked notification',
        error
      );
    }
  }

  /**
   * Get all tracked notifications from AsyncStorage
   */
  private async getTrackedNotifications(): Promise<ScheduledNotification[]> {
    try {
      const data = await AsyncStorage.getItem(SCHEDULED_NOTIFICATIONS_KEY);
      if (!data) return [];

      const parsed = JSON.parse(data);

      // Convert date strings back to Date objects
      return parsed.map((n: any) => ({
        ...n,
        scheduledTime: new Date(n.scheduledTime),
        createdAt: new Date(n.createdAt),
        trigger: {
          ...n.trigger,
          date: n.trigger.date ? new Date(n.trigger.date) : undefined,
        },
      }));
    } catch (error) {
      console.error('Error getting tracked notifications:', error);
      return [];
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationScheduler = new NotificationScheduler();
