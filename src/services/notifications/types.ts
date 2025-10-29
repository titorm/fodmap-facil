/**
 * Notification Types and Interfaces
 *
 * Core type definitions for the notification system
 */

export type NotificationType =
  | 'daily_reminder'
  | 'dose_reminder'
  | 'washout_start'
  | 'washout_warning'
  | 'washout_end'
  | 'test_start';

export type NotificationAction =
  | 'opened'
  | 'dismissed'
  | 'dose_marked_taken'
  | 'symptom_logged'
  | 'snoozed';

export type PermissionStatus = 'undetermined' | 'granted' | 'denied';

export type NotificationFrequency = 'full' | 'reduced' | 'minimal';

export interface TimeOfDay {
  hour: number; // 0-23
  minute: number; // 0-59
}

export interface NotificationTrigger {
  type: 'date' | 'daily' | 'weekly';
  date?: Date;
  hour?: number;
  minute?: number;
  weekday?: number;
  repeats?: boolean;
}

export interface ScheduleNotificationInput {
  title: string;
  body: string;
  data: Record<string, any>;
  trigger: NotificationTrigger;
  categoryIdentifier?: string;
  sound?: boolean;
  badge?: number;
}

export interface ScheduledNotification {
  id: string; // Expo notification identifier
  localId: string; // Our internal ID
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  scheduledTime: Date;
  trigger: NotificationTrigger;
  data: {
    type: NotificationType;
    relatedEntityId?: string;
    relatedEntityType?: string;
    actionButtons?: NotificationActionButton[];
  };
  createdAt: Date;
}

export interface NotificationActionButton {
  id: string;
  title: string;
  action: string;
}

export interface NotificationHistoryEntry {
  id: string;
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  scheduledTime: Date;
  deliveredTime: Date | null;
  actionedTime: Date | null;
  action: NotificationAction | null;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  createdAt: Date;
}

export interface QuietHoursConfig {
  enabled: boolean;
  start: TimeOfDay;
  end: TimeOfDay;
  allowCritical: boolean;
}

export enum NotificationErrorCode {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_UNDETERMINED = 'PERMISSION_UNDETERMINED',
  SCHEDULING_FAILED = 'SCHEDULING_FAILED',
  CANCELLATION_FAILED = 'CANCELLATION_FAILED',
  INVALID_TIME = 'INVALID_TIME',
  QUIET_HOURS_CONFLICT = 'QUIET_HOURS_CONFLICT',
  STORAGE_ERROR = 'STORAGE_ERROR',
  SYNC_ERROR = 'SYNC_ERROR',
}

export class NotificationError extends Error {
  public timestamp: Date;
  public logged: boolean = false;

  constructor(
    public code: NotificationErrorCode,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'NotificationError';
    this.timestamp = new Date();

    // Automatically log the error
    this.logError();
  }

  /**
   * Log error to console and storage for debugging
   * Requirements: 9.1, 9.2
   */
  private logError(): void {
    if (this.logged) return;

    // Log to console with full details
    console.error(`[NotificationError] ${this.code}: ${this.message}`, {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp.toISOString(),
      stack: this.stack,
    });

    // Store error log in AsyncStorage for debugging
    this.storeErrorLog().catch((err) => {
      console.error('Failed to store error log:', err);
    });

    this.logged = true;
  }

  /**
   * Store error log in AsyncStorage
   */
  private async storeErrorLog(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const ERROR_LOG_KEY = '@notifications:error_log';
      const MAX_LOGS = 50;

      // Get existing logs
      const logsJson = await AsyncStorage.getItem(ERROR_LOG_KEY);
      const logs = logsJson ? JSON.parse(logsJson) : [];

      // Add new log
      logs.push({
        code: this.code,
        message: this.message,
        details: this.details ? JSON.stringify(this.details) : undefined,
        timestamp: this.timestamp.toISOString(),
        stack: this.stack,
      });

      // Keep only the most recent logs
      const trimmed = logs.slice(-MAX_LOGS);

      // Save back to storage
      await AsyncStorage.setItem(ERROR_LOG_KEY, JSON.stringify(trimmed));
    } catch (error) {
      // Silently fail - don't want error logging to cause more errors
      console.warn('Failed to store error log:', error);
    }
  }

  /**
   * Get all stored error logs
   */
  static async getErrorLogs(): Promise<any[]> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const ERROR_LOG_KEY = '@notifications:error_log';
      const logsJson = await AsyncStorage.getItem(ERROR_LOG_KEY);
      return logsJson ? JSON.parse(logsJson) : [];
    } catch (error) {
      console.error('Failed to get error logs:', error);
      return [];
    }
  }

  /**
   * Clear all stored error logs
   */
  static async clearErrorLogs(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const ERROR_LOG_KEY = '@notifications:error_log';
      await AsyncStorage.removeItem(ERROR_LOG_KEY);
    } catch (error) {
      console.error('Failed to clear error logs:', error);
    }
  }
}
