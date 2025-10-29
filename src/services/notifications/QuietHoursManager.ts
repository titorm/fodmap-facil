/**
 * Quiet Hours Manager
 *
 * Manages quiet hours configuration and enforcement
 * Requirements: 5.2, 5.3, 5.4
 */

import { useNotificationPreferencesStore } from '../../shared/stores/notificationPreferencesStore';
import type { QuietHoursConfig, TimeOfDay, NotificationType } from './types';

/**
 * QuietHoursManager - Handles quiet hours logic
 */
export class QuietHoursManager {
  // ============================================================================
  // CONFIGURATION (Subtask 5.2)
  // ============================================================================

  /**
   * Set quiet hours configuration
   * Requirements: 5.1
   */
  async setQuietHours(start: TimeOfDay, end: TimeOfDay): Promise<void> {
    const config: QuietHoursConfig = {
      enabled: true,
      start,
      end,
      allowCritical: true, // Default to allowing critical notifications
    };

    const store = useNotificationPreferencesStore.getState();
    store.setQuietHours(config);
  }

  /**
   * Get current quiet hours configuration
   * Requirements: 5.1
   */
  async getQuietHours(): Promise<QuietHoursConfig | null> {
    const store = useNotificationPreferencesStore.getState();
    return store.quietHours;
  }

  /**
   * Disable quiet hours
   * Requirements: 5.1
   */
  async disableQuietHours(): Promise<void> {
    const store = useNotificationPreferencesStore.getState();
    store.setQuietHours(null);
  }

  // ============================================================================
  // TIME CHECKING (Subtask 5.2)
  // ============================================================================

  /**
   * Check if a given time falls within quiet hours
   * Handles midnight boundary cases
   * Requirements: 5.2
   */
  isInQuietHours(time: Date): boolean {
    const config = useNotificationPreferencesStore.getState().quietHours;

    // If quiet hours not configured or disabled, return false
    if (!config || !config.enabled) {
      return false;
    }

    const { start, end } = config;

    // Get time components
    const timeMinutes = time.getHours() * 60 + time.getMinutes();
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;

    // Handle midnight boundary case
    if (startMinutes > endMinutes) {
      // Quiet hours span midnight (e.g., 22:00 to 07:00)
      // Time is in quiet hours if it's after start OR before end
      return timeMinutes >= startMinutes || timeMinutes < endMinutes;
    } else {
      // Quiet hours within same day (e.g., 13:00 to 15:00)
      // Time is in quiet hours if it's between start and end
      return timeMinutes >= startMinutes && timeMinutes < endMinutes;
    }
  }

  /**
   * Get the next available time after quiet hours
   * Requirements: 5.2, 5.3
   */
  async getNextAvailableTime(time: Date): Promise<Date> {
    const config = await this.getQuietHours();

    // If no quiet hours configured, return original time
    if (!config || !config.enabled) {
      return time;
    }

    // If not in quiet hours, return original time
    if (!this.isInQuietHours(time)) {
      return time;
    }

    const { end } = config;

    // Create a new date for the adjusted time
    const adjustedTime = new Date(time);

    // Set to end of quiet hours
    adjustedTime.setHours(end.hour);
    adjustedTime.setMinutes(end.minute);
    adjustedTime.setSeconds(0);
    adjustedTime.setMilliseconds(0);

    // Handle midnight boundary case
    const timeMinutes = time.getHours() * 60 + time.getMinutes();
    const endMinutes = end.hour * 60 + end.minute;
    const startMinutes = config.start.hour * 60 + config.start.minute;

    // If quiet hours span midnight and current time is before midnight
    if (startMinutes > endMinutes && timeMinutes >= startMinutes) {
      // Adjust to next day at end time
      adjustedTime.setDate(adjustedTime.getDate() + 1);
    }

    // Add 15 minutes buffer after quiet hours end
    adjustedTime.setMinutes(adjustedTime.getMinutes() + 15);

    return adjustedTime;
  }

  // ============================================================================
  // CRITICAL NOTIFICATIONS (Subtask 5.2)
  // ============================================================================

  /**
   * Determine if a notification should override quiet hours
   * Critical notifications (dose reminders within 1 hour) can override
   * Requirements: 5.4
   */
  async shouldOverrideQuietHours(
    notificationType: NotificationType,
    scheduledTime: Date
  ): Promise<boolean> {
    const config = await this.getQuietHours();

    // If quiet hours not configured or disabled, no override needed
    if (!config || !config.enabled) {
      return false;
    }

    // If critical notifications are not allowed, don't override
    if (!config.allowCritical) {
      return false;
    }

    // Only dose reminders can be critical
    if (notificationType !== 'dose_reminder') {
      return false;
    }

    // Check if dose reminder is within 1 hour
    const now = new Date();
    const timeDiff = scheduledTime.getTime() - now.getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    // If dose is within 1 hour, it's critical
    return hoursDiff <= 1 && hoursDiff >= 0;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Convert TimeOfDay to minutes since midnight
   */
  private timeToMinutes(time: TimeOfDay): number {
    return time.hour * 60 + time.minute;
  }

  /**
   * Convert minutes since midnight to TimeOfDay
   */
  private minutesToTime(minutes: number): TimeOfDay {
    const hour = Math.floor(minutes / 60) % 24;
    const minute = minutes % 60;
    return { hour, minute };
  }

  /**
   * Format TimeOfDay as string (HH:MM)
   */
  formatTime(time: TimeOfDay): string {
    const hour = time.hour.toString().padStart(2, '0');
    const minute = time.minute.toString().padStart(2, '0');
    return `${hour}:${minute}`;
  }

  /**
   * Parse time string (HH:MM) to TimeOfDay
   */
  parseTime(timeString: string): TimeOfDay | null {
    const match = timeString.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;

    const hour = parseInt(match[1], 10);
    const minute = parseInt(match[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    return { hour, minute };
  }

  /**
   * Calculate duration of quiet hours in minutes
   */
  calculateQuietHoursDuration(config: QuietHoursConfig): number {
    const startMinutes = this.timeToMinutes(config.start);
    const endMinutes = this.timeToMinutes(config.end);

    if (startMinutes > endMinutes) {
      // Spans midnight
      return 24 * 60 - startMinutes + endMinutes;
    } else {
      // Same day
      return endMinutes - startMinutes;
    }
  }

  /**
   * Check if quiet hours configuration is valid
   */
  validateQuietHours(start: TimeOfDay, end: TimeOfDay): boolean {
    // Check hour ranges
    if (start.hour < 0 || start.hour > 23 || end.hour < 0 || end.hour > 23) {
      return false;
    }

    // Check minute ranges
    if (start.minute < 0 || start.minute > 59 || end.minute < 0 || end.minute > 59) {
      return false;
    }

    // Check that start and end are not the same
    if (start.hour === end.hour && start.minute === end.minute) {
      return false;
    }

    return true;
  }

  /**
   * Get a human-readable description of quiet hours
   */
  getQuietHoursDescription(config: QuietHoursConfig): string {
    const startStr = this.formatTime(config.start);
    const endStr = this.formatTime(config.end);
    const duration = this.calculateQuietHoursDuration(config);
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;

    let description = `Quiet hours from ${startStr} to ${endStr}`;

    if (hours > 0 && minutes > 0) {
      description += ` (${hours}h ${minutes}m)`;
    } else if (hours > 0) {
      description += ` (${hours}h)`;
    } else {
      description += ` (${minutes}m)`;
    }

    if (config.allowCritical) {
      description += '. Critical notifications allowed.';
    }

    return description;
  }

  /**
   * Check if a time range overlaps with quiet hours
   */
  overlapsQuietHours(start: Date, end: Date): boolean {
    const config = useNotificationPreferencesStore.getState().quietHours;

    if (!config || !config.enabled) {
      return false;
    }

    // Check if any point in the range is in quiet hours
    const current = new Date(start);
    while (current <= end) {
      if (this.isInQuietHours(current)) {
        return true;
      }
      // Check every 15 minutes
      current.setMinutes(current.getMinutes() + 15);
    }

    return false;
  }

  /**
   * Get the next quiet hours period start time
   */
  getNextQuietHoursStart(fromTime: Date = new Date()): Date | null {
    const config = useNotificationPreferencesStore.getState().quietHours;

    if (!config || !config.enabled) {
      return null;
    }

    const { start } = config;
    const nextStart = new Date(fromTime);

    nextStart.setHours(start.hour);
    nextStart.setMinutes(start.minute);
    nextStart.setSeconds(0);
    nextStart.setMilliseconds(0);

    // If the start time has passed today, move to tomorrow
    if (nextStart <= fromTime) {
      nextStart.setDate(nextStart.getDate() + 1);
    }

    return nextStart;
  }

  /**
   * Get the next quiet hours period end time
   */
  getNextQuietHoursEnd(fromTime: Date = new Date()): Date | null {
    const config = useNotificationPreferencesStore.getState().quietHours;

    if (!config || !config.enabled) {
      return null;
    }

    // If currently in quiet hours, return the end of current period
    if (this.isInQuietHours(fromTime)) {
      return this.getNextAvailableTime(fromTime);
    }

    // Otherwise, get the next start and calculate end from there
    const nextStart = this.getNextQuietHoursStart(fromTime);
    if (!nextStart) return null;

    return this.getNextAvailableTime(nextStart);
  }
}

/**
 * Singleton instance for app-wide use
 */
export const quietHoursManager = new QuietHoursManager();
