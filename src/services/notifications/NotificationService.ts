/**
 * Notification Service
 *
 * Core service for managing all notification operations including
 * permissions, scheduling, cancellation, and response handling
 */

import * as Notifications from 'expo-notifications';
import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationPreferencesStore } from '../../shared/stores/notificationPreferencesStore';
import {
  NotificationError,
  NotificationErrorCode,
  type PermissionStatus,
  type ScheduleNotificationInput,
  type ScheduledNotification,
  type NotificationType,
  type NotificationAction,
} from './types';
import { NotificationScheduler } from './NotificationScheduler';
import { AdherenceAnalyzer } from './AdherenceAnalyzer';
import type { AdherenceScore, AdherencePattern } from './AdherenceAnalyzer';
import { NotificationHistoryRepository } from './NotificationHistoryRepository';
import { NotificationRetryQueue } from './NotificationRetryQueue';
import { useAuth } from '../../shared/hooks/useAuth';

const SCHEDULED_NOTIFICATIONS_KEY = '@notifications:scheduled';

/**
 * NotificationService - Manages all notification operations
 */
export class NotificationService {
  private static instance: NotificationService;
  private scheduler: NotificationScheduler;
  private adherenceAnalyzer: AdherenceAnalyzer;
  private historyRepository: NotificationHistoryRepository;
  private retryQueue: NotificationRetryQueue;

  private constructor() {
    this.scheduler = new NotificationScheduler();
    this.adherenceAnalyzer = AdherenceAnalyzer.getInstance();
    this.historyRepository = NotificationHistoryRepository.getInstance();
    this.retryQueue = NotificationRetryQueue.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Get current user ID from auth context
   * Helper method for tracking notifications
   */
  private async getCurrentUserId(): Promise<string | null> {
    try {
      // Try to get from AsyncStorage first (cached user ID)
      const cachedUserId = await AsyncStorage.getItem('@auth:userId');
      if (cachedUserId) {
        return cachedUserId;
      }

      // If not cached, return null (user not authenticated)
      return null;
    } catch (error) {
      console.error('Error getting current user ID:', error);
      return null;
    }
  }

  // ============================================================================
  // PERMISSION MANAGEMENT (Subtask 4.1)
  // ============================================================================

  /**
   * Request notification permission from the user
   * Requirements: 7.1, 7.2
   */
  async requestPermission(): Promise<PermissionStatus> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      let finalStatus = existingStatus;

      // If permission is undetermined, request it
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      // Map Expo permission status to our PermissionStatus type
      const permissionStatus = this.mapPermissionStatus(finalStatus);

      // Update store with permission status and timestamp
      const store = useNotificationPreferencesStore.getState();
      store.setPermissionStatus(permissionStatus);
      store.setPermissionAskedAt(new Date());

      return permissionStatus;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw new NotificationError(
        NotificationErrorCode.PERMISSION_DENIED,
        'Failed to request notification permission',
        error
      );
    }
  }

  /**
   * Check current notification permission status
   * Requirements: 7.2, 7.4
   */
  async checkPermission(): Promise<PermissionStatus> {
    try {
      const { status } = await Notifications.getPermissionsAsync();
      const permissionStatus = this.mapPermissionStatus(status);

      // Update store with current status
      const store = useNotificationPreferencesStore.getState();

      // Only update if status has changed
      if (store.permissionStatus !== permissionStatus) {
        store.setPermissionStatus(permissionStatus);
      }

      return permissionStatus;
    } catch (error) {
      console.error('Error checking notification permission:', error);
      throw new NotificationError(
        NotificationErrorCode.PERMISSION_DENIED,
        'Failed to check notification permission',
        error
      );
    }
  }

  /**
   * Open device settings to allow user to grant notification permission
   * Requirements: 7.3, 7.5
   */
  async openSettings(): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await Linking.openURL('app-settings:');
      } else if (Platform.OS === 'android') {
        await Linking.openSettings();
      }
    } catch (error) {
      console.error('Error opening settings:', error);
      throw new NotificationError(
        NotificationErrorCode.PERMISSION_DENIED,
        'Failed to open device settings',
        error
      );
    }
  }

  /**
   * Map Expo permission status to our PermissionStatus type
   */
  private mapPermissionStatus(
    status: Notifications.PermissionStatus | Notifications.PermissionResponse['status']
  ): PermissionStatus {
    if (status === 'granted') return 'granted';
    if (status === 'denied') return 'denied';
    return 'undetermined';
  }

  // ============================================================================
  // BASIC NOTIFICATION SCHEDULING (Subtask 4.2)
  // ============================================================================

  /**
   * Schedule a notification with the given configuration
   * Now uses NotificationScheduler with quiet hours support
   * Includes retry logic for failed operations
   * Requirements: 1.1, 9.1, 9.2, 5.2, 5.3
   */
  async schedule(input: ScheduleNotificationInput): Promise<string> {
    try {
      // Check permission first
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        throw new NotificationError(
          NotificationErrorCode.PERMISSION_DENIED,
          'Notification permission not granted'
        );
      }

      // Use the scheduler which handles quiet hours automatically
      const notificationId = await this.scheduler.schedule(input);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);

      // Add to retry queue for failed operations
      if (
        error instanceof NotificationError &&
        error.code === NotificationErrorCode.SCHEDULING_FAILED
      ) {
        await this.retryQueue.enqueue('schedule', input, error);
      }

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
   * Cancel a specific notification by ID
   * Includes retry logic for failed operations
   * Requirements: 9.2
   */
  async cancel(notificationId: string): Promise<void> {
    try {
      await this.scheduler.cancel(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);

      // Add to retry queue for failed operations
      if (
        error instanceof NotificationError &&
        error.code === NotificationErrorCode.CANCELLATION_FAILED
      ) {
        await this.retryQueue.enqueue('cancel', { notificationId }, error);
      }

      throw new NotificationError(
        NotificationErrorCode.CANCELLATION_FAILED,
        'Failed to cancel notification',
        error
      );
    }
  }

  /**
   * Cancel all scheduled notifications
   * Requirements: 9.2
   */
  async cancelAll(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      await AsyncStorage.setItem(SCHEDULED_NOTIFICATIONS_KEY, JSON.stringify([]));
    } catch (error) {
      console.error('Error canceling all notifications:', error);
      throw new NotificationError(
        NotificationErrorCode.CANCELLATION_FAILED,
        'Failed to cancel all notifications',
        error
      );
    }
  }

  /**
   * Cancel all notifications of a specific type
   */
  async cancelNotificationsByType(type: NotificationType): Promise<void> {
    try {
      const tracked = await this.scheduler.getScheduledNotifications();
      const toCancel = tracked.filter((n) => n.notificationType === type);

      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }
    } catch (error) {
      console.error('Error canceling notifications by type:', error);
      throw new NotificationError(
        NotificationErrorCode.CANCELLATION_FAILED,
        `Failed to cancel notifications of type ${type}`,
        error
      );
    }
  }

  /**
   * Get all scheduled notifications
   */
  async getScheduledNotifications(): Promise<ScheduledNotification[]> {
    try {
      return await this.scheduler.getScheduledNotifications();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to get scheduled notifications',
        error
      );
    }
  }

  /**
   * Schedule multiple notifications at once
   * Requirements: 1.1, 2.1
   */
  async scheduleMultiple(notifications: ScheduleNotificationInput[]): Promise<string[]> {
    try {
      // Check permission first
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        throw new NotificationError(
          NotificationErrorCode.PERMISSION_DENIED,
          'Notification permission not granted'
        );
      }

      return await this.scheduler.scheduleMultiple(notifications);
    } catch (error) {
      console.error('Error scheduling multiple notifications:', error);
      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to schedule multiple notifications',
        error
      );
    }
  }

  /**
   * Reschedule an existing notification
   * Requirements: 5.3
   */
  async reschedule(id: string, newTime: Date): Promise<void> {
    try {
      await this.scheduler.reschedule(id, newTime);
    } catch (error) {
      console.error('Error rescheduling notification:', error);
      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to reschedule notification',
        error
      );
    }
  }

  // ============================================================================
  // NOTIFICATION RESPONSE HANDLERS (Subtask 4.3)
  // ============================================================================

  /**
   * Set up listener for when notifications are received while app is foregrounded
   * Requirements: 9.4
   */
  onNotificationReceived(
    handler: (notification: Notifications.Notification) => void | Promise<void>
  ): Notifications.EventSubscription {
    return Notifications.addNotificationReceivedListener(async (notification) => {
      try {
        // Track that notification was delivered
        await this.trackNotificationDelivery(notification);

        // Call the custom handler
        await handler(notification);
      } catch (error) {
        console.error('Error in notification received handler:', error);
      }
    });
  }

  /**
   * Set up listener for when user taps on a notification
   * Requirements: 9.4, 10.3
   */
  onNotificationResponse(
    handler: (response: Notifications.NotificationResponse) => void | Promise<void>
  ): Notifications.EventSubscription {
    return Notifications.addNotificationResponseReceivedListener(async (response) => {
      try {
        // Track the notification action
        await this.trackNotificationAction(response);

        // Call the custom handler (which should handle deep linking)
        await handler(response);
      } catch (error) {
        console.error('Error in notification response handler:', error);
      }
    });
  }

  /**
   * Get the last notification response (useful for handling deep links on app launch)
   * Requirements: 9.4
   */
  async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    try {
      const response = await Notifications.getLastNotificationResponseAsync();
      return response;
    } catch (error) {
      console.error('Error getting last notification response:', error);
      return null;
    }
  }

  /**
   * Handle deep linking to relevant screens based on notification data
   * Requirements: 9.4
   */
  handleDeepLink(response: Notifications.NotificationResponse): {
    screen: string;
    params?: Record<string, any>;
  } | null {
    const { data } = response.notification.request.content;
    const notificationType = data.type as NotificationType;

    switch (notificationType) {
      case 'daily_reminder':
        return {
          screen: 'DiaryScreen',
          params: {},
        };

      case 'dose_reminder':
        return {
          screen: 'TestDayScreen',
          params: {
            testStepId: data.relatedEntityId,
          },
        };

      case 'washout_start':
      case 'washout_warning':
      case 'washout_end':
        return {
          screen: 'JourneyScreen',
          params: {
            washoutId: data.relatedEntityId,
          },
        };

      case 'test_start':
        return {
          screen: 'ReintroductionHomeScreen',
          params: {
            testId: data.relatedEntityId,
          },
        };

      default:
        return null;
    }
  }

  /**
   * Track notification delivery in history
   * Requirements: 10.1, 10.3
   */
  private async trackNotificationDelivery(notification: Notifications.Notification): Promise<void> {
    try {
      const { data, title, body } = notification.request.content;

      // Get user ID from auth context
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('Cannot track notification delivery: user not authenticated');
        return;
      }

      // Find the scheduled notification to get more details
      const scheduled = await this.scheduler.getScheduledNotifications();
      const scheduledNotification = scheduled.find((n) => n.id === notification.request.identifier);

      // Create history entry in Appwrite
      await this.historyRepository.create({
        userId,
        notificationType: data.type as NotificationType,
        title: title || 'Notification',
        body: body || '',
        scheduledTime: scheduledNotification?.scheduledTime || new Date(),
        deliveredTime: new Date(),
        relatedEntityId: data.relatedEntityId || undefined,
        relatedEntityType: data.relatedEntityType || undefined,
      });

      // Also keep local backup in AsyncStorage for offline support
      const deliveryRecord = {
        notificationId: notification.request.identifier,
        deliveredAt: new Date().toISOString(),
        type: data.type,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
      };

      const recordsJson = await AsyncStorage.getItem('@notifications:deliveries');
      const records = recordsJson ? JSON.parse(recordsJson) : [];
      records.push(deliveryRecord);
      const trimmed = records.slice(-100);
      await AsyncStorage.setItem('@notifications:deliveries', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error tracking notification delivery:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Track notification action in history
   * Requirements: 10.3
   */
  private async trackNotificationAction(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    try {
      const { data } = response.notification.request.content;
      const actionIdentifier = response.actionIdentifier;

      // Determine the action type
      let action: NotificationAction = 'opened';
      if (actionIdentifier === 'mark-taken') {
        action = 'dose_marked_taken';
      } else if (actionIdentifier === 'snooze') {
        action = 'snoozed';
      } else if (actionIdentifier === 'log-now') {
        action = 'symptom_logged';
      } else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        action = 'opened';
      }

      // Get user ID from auth context
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('Cannot track notification action: user not authenticated');
        return;
      }

      // Find existing history entry for this notification
      const historyEntries = await this.historyRepository.list({ userId }, 100);

      // Try to find the entry by matching notification data
      const existingEntry = historyEntries.find(
        (entry) =>
          entry.notificationType === data.type &&
          entry.relatedEntityId === data.relatedEntityId &&
          entry.action === null // Not yet actioned
      );

      if (existingEntry) {
        // Update existing entry with action
        await this.historyRepository.update(existingEntry.id, {
          actionedTime: new Date(),
          action,
        });
      } else {
        // Create new entry if not found (shouldn't happen normally)
        const { title, body } = response.notification.request.content;
        await this.historyRepository.create({
          userId,
          notificationType: data.type as NotificationType,
          title: title || 'Notification',
          body: body || '',
          scheduledTime: new Date(),
          deliveredTime: new Date(),
          relatedEntityId: data.relatedEntityId || undefined,
          relatedEntityType: data.relatedEntityType || undefined,
        });
      }

      // Also keep local backup in AsyncStorage for offline support
      const actionRecord = {
        notificationId: response.notification.request.identifier,
        actionedAt: new Date().toISOString(),
        action,
        type: data.type,
        relatedEntityId: data.relatedEntityId,
        relatedEntityType: data.relatedEntityType,
      };

      const recordsJson = await AsyncStorage.getItem('@notifications:actions');
      const records = recordsJson ? JSON.parse(recordsJson) : [];
      records.push(actionRecord);
      const trimmed = records.slice(-100);
      await AsyncStorage.setItem('@notifications:actions', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error tracking notification action:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get notification history from Appwrite
   * Requirements: 10.2, 10.3, 10.4
   *
   * @param days - Number of days to retrieve (default: 30)
   * @param filters - Optional filters for notification type
   * @returns Array of notification history entries
   */
  async getNotificationHistory(
    days: number = 30,
    filters?: { notificationType?: NotificationType }
  ): Promise<any[]> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        console.warn('Cannot get notification history: user not authenticated');
        return [];
      }

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get history from Appwrite repository
      const historyEntries = await this.historyRepository.list(
        {
          userId,
          startDate,
          notificationType: filters?.notificationType,
        },
        1000 // Get up to 1000 entries
      );

      return historyEntries;
    } catch (error) {
      console.error('Error getting notification history from repository:', error);

      // Fallback to local AsyncStorage if Appwrite fails
      try {
        const deliveriesJson = await AsyncStorage.getItem('@notifications:deliveries');
        const actionsJson = await AsyncStorage.getItem('@notifications:actions');

        const deliveries = deliveriesJson ? JSON.parse(deliveriesJson) : [];
        const actions = actionsJson ? JSON.parse(actionsJson) : [];

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const filteredDeliveries = deliveries.filter(
          (d: any) => new Date(d.deliveredAt) >= cutoffDate
        );

        const filteredActions = actions.filter((a: any) => new Date(a.actionedAt) >= cutoffDate);

        const combined = [
          ...filteredDeliveries.map((d: any) => ({ ...d, eventType: 'delivery' })),
          ...filteredActions.map((a: any) => ({ ...a, eventType: 'action' })),
        ].sort((a, b) => {
          const dateA = new Date(a.deliveredAt || a.actionedAt);
          const dateB = new Date(b.deliveredAt || b.actionedAt);
          return dateB.getTime() - dateA.getTime();
        });

        return combined;
      } catch (fallbackError) {
        console.error('Error getting notification history from fallback:', fallbackError);
        return [];
      }
    }
  }

  /**
   * Mark a notification as actioned (for manual tracking)
   * Requirements: 10.3
   */
  async markNotificationAsActioned(
    notificationId: string,
    action: NotificationAction
  ): Promise<void> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new NotificationError(NotificationErrorCode.STORAGE_ERROR, 'User not authenticated');
      }

      // Update in Appwrite repository
      await this.historyRepository.update(notificationId, {
        actionedTime: new Date(),
        action,
      });

      // Also update local backup
      const actionRecord = {
        notificationId,
        actionedAt: new Date().toISOString(),
        action,
        manual: true,
      };

      const recordsJson = await AsyncStorage.getItem('@notifications:actions');
      const records = recordsJson ? JSON.parse(recordsJson) : [];
      records.push(actionRecord);
      const trimmed = records.slice(-100);
      await AsyncStorage.setItem('@notifications:actions', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Error marking notification as actioned:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to mark notification as actioned',
        error
      );
    }
  }

  // ============================================================================
  // PROTOCOL-SPECIFIC NOTIFICATION SCHEDULING (Task 6)
  // ============================================================================

  /**
   * Schedule daily symptom reminder at user's preferred time
   * Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
   */
  async scheduleDailyReminder(time?: Date): Promise<string> {
    try {
      // Check permission first
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        throw new NotificationError(
          NotificationErrorCode.PERMISSION_DENIED,
          'Notification permission not granted'
        );
      }

      // Get preferences from store
      const store = useNotificationPreferencesStore.getState();

      // Check if daily reminders are enabled
      if (!store.dailyReminderEnabled) {
        throw new NotificationError(
          NotificationErrorCode.SCHEDULING_FAILED,
          'Daily reminders are disabled in preferences'
        );
      }

      // Determine the time to use
      let reminderTime: Date;
      if (time) {
        reminderTime = time;
      } else if (store.dailyReminderTime) {
        // Parse time from preferences (format: "HH:mm")
        const [hour, minute] =
          store.dailyReminderTime.hour !== undefined
            ? [store.dailyReminderTime.hour, store.dailyReminderTime.minute]
            : [9, 0]; // Default to 9:00 AM

        reminderTime = new Date();
        reminderTime.setHours(hour, minute, 0, 0);

        // If time has passed today, schedule for tomorrow
        if (reminderTime <= new Date()) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }
      } else {
        // Default to 9:00 AM
        reminderTime = new Date();
        reminderTime.setHours(9, 0, 0, 0);

        if (reminderTime <= new Date()) {
          reminderTime.setDate(reminderTime.getDate() + 1);
        }
      }

      // Cancel any existing daily reminders
      await this.cancelNotificationsByType('daily_reminder');

      // Create the notification input
      const input: ScheduleNotificationInput = {
        title: 'Time to Log Your Symptoms',
        body: 'How are you feeling today? Take a moment to record your symptoms.',
        data: {
          type: 'daily_reminder',
          relatedEntityType: 'symptom_entry',
        },
        trigger: {
          type: 'daily',
          hour: reminderTime.getHours(),
          minute: reminderTime.getMinutes(),
          repeats: true,
        },
        sound: true,
        categoryIdentifier: 'daily_reminder',
      };

      // Schedule the notification (scheduler handles quiet hours and adaptive frequency)
      const notificationId = await this.schedule(input);

      return notificationId;
    } catch (error) {
      console.error('Error scheduling daily reminder:', error);

      if (error instanceof NotificationError) {
        throw error;
      }

      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to schedule daily reminder',
        error
      );
    }
  }

  /**
   * Cancel daily symptom reminder for today (called when symptoms are logged)
   * Requirements: 1.2
   */
  async cancelDailyReminderForToday(): Promise<void> {
    try {
      // Note: Since we use daily repeating notifications, we can't cancel just today's instance
      // Instead, we reschedule for tomorrow
      const store = useNotificationPreferencesStore.getState();

      if (!store.dailyReminderEnabled || !store.dailyReminderTime) {
        return; // Nothing to do if reminders are disabled
      }

      // Get the scheduled time for tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(
        store.dailyReminderTime.hour ?? 9,
        store.dailyReminderTime.minute ?? 0,
        0,
        0
      );

      // Reschedule the daily reminder
      await this.scheduleDailyReminder(tomorrow);
    } catch (error) {
      console.error('Error canceling daily reminder for today:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Schedule dose reminder for a test step
   * Schedules both pre-dose (30 min before) and dose-time notifications
   * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5
   */
  async scheduleDoseReminder(testStep: {
    id: string;
    scheduledDate: Date;
    foodItemId: string;
    foodName?: string;
    doseAmount?: string;
  }): Promise<string[]> {
    try {
      // Check permission first
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        throw new NotificationError(
          NotificationErrorCode.PERMISSION_DENIED,
          'Notification permission not granted'
        );
      }

      // Get preferences from store
      const store = useNotificationPreferencesStore.getState();

      // Check if dose reminders are enabled
      if (!store.doseReminderEnabled) {
        throw new NotificationError(
          NotificationErrorCode.SCHEDULING_FAILED,
          'Dose reminders are disabled in preferences'
        );
      }

      const notificationIds: string[] = [];
      const doseTime = new Date(testStep.scheduledDate);
      const advanceMinutes = store.doseReminderAdvanceMinutes || 30;

      // Cancel any existing dose reminders for this test step
      const existing = await this.scheduler.getScheduledNotifications();
      const toCancel = existing.filter(
        (n) => n.notificationType === 'dose_reminder' && n.data.relatedEntityId === testStep.id
      );
      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }

      // Schedule pre-dose notification (30 minutes before)
      const preDoseTime = new Date(doseTime);
      preDoseTime.setMinutes(preDoseTime.getMinutes() - advanceMinutes);

      // Only schedule pre-dose if it's in the future
      if (preDoseTime > new Date()) {
        const preDoseInput: ScheduleNotificationInput = {
          title: 'Upcoming Dose Reminder',
          body: `Your dose of ${testStep.foodName || 'test food'} is coming up in ${advanceMinutes} minutes.`,
          data: {
            type: 'dose_reminder',
            relatedEntityId: testStep.id,
            relatedEntityType: 'test_step',
            isDoseTime: false,
          },
          trigger: {
            type: 'date',
            date: preDoseTime,
            repeats: false,
          },
          sound: true,
        };

        const preDoseId = await this.schedule(preDoseInput);
        notificationIds.push(preDoseId);
      }

      // Schedule dose-time notification with action buttons
      if (doseTime > new Date()) {
        const doseInput: ScheduleNotificationInput = {
          title: 'Time for Your Dose',
          body: `Take your dose of ${testStep.foodName || 'test food'}${testStep.doseAmount ? ` (${testStep.doseAmount})` : ''} now.`,
          data: {
            type: 'dose_reminder',
            relatedEntityId: testStep.id,
            relatedEntityType: 'test_step',
            isDoseTime: true,
            actionButtons: [
              {
                id: 'mark-taken',
                title: 'Mark as Taken',
                action: 'mark_taken',
              },
              {
                id: 'snooze',
                title: 'Snooze 15 min',
                action: 'snooze',
              },
            ],
          },
          trigger: {
            type: 'date',
            date: doseTime,
            repeats: false,
          },
          sound: true,
          categoryIdentifier: 'dose_reminder',
        };

        const doseId = await this.schedule(doseInput);
        notificationIds.push(doseId);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling dose reminder:', error);

      if (error instanceof NotificationError) {
        throw error;
      }

      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to schedule dose reminder',
        error
      );
    }
  }

  /**
   * Snooze a dose reminder by 15 minutes
   * Requirements: 2.4
   */
  async snoozeDoseReminder(testStepId: string): Promise<string> {
    try {
      // Find the existing dose reminder
      const existing = await this.scheduler.getScheduledNotifications();
      const doseReminder = existing.find(
        (n) =>
          n.notificationType === 'dose_reminder' &&
          n.data.relatedEntityId === testStepId &&
          n.data.isDoseTime === true
      );

      if (!doseReminder) {
        throw new NotificationError(
          NotificationErrorCode.SCHEDULING_FAILED,
          'Dose reminder not found for snoozing'
        );
      }

      // Cancel the existing reminder
      await this.cancel(doseReminder.id);

      // Schedule a new reminder 15 minutes from now
      const snoozeTime = new Date();
      snoozeTime.setMinutes(snoozeTime.getMinutes() + 15);

      const snoozeInput: ScheduleNotificationInput = {
        title: doseReminder.title,
        body: doseReminder.body,
        data: {
          ...doseReminder.data,
          snoozed: true,
        },
        trigger: {
          type: 'date',
          date: snoozeTime,
          repeats: false,
        },
        sound: true,
        categoryIdentifier: 'dose_reminder',
      };

      const snoozeId = await this.schedule(snoozeInput);
      return snoozeId;
    } catch (error) {
      console.error('Error snoozing dose reminder:', error);

      if (error instanceof NotificationError) {
        throw error;
      }

      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to snooze dose reminder',
        error
      );
    }
  }

  /**
   * Cancel dose reminders when dose is marked as taken
   * Requirements: 2.3
   */
  async cancelDoseReminders(testStepId: string): Promise<void> {
    try {
      const existing = await this.scheduler.getScheduledNotifications();
      const toCancel = existing.filter(
        (n) => n.notificationType === 'dose_reminder' && n.data.relatedEntityId === testStepId
      );

      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }
    } catch (error) {
      console.error('Error canceling dose reminders:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Schedule washout period notifications
   * Schedules start, 24-hour warning, and end notifications
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async scheduleWashoutNotifications(washout: {
    id: string;
    startDate: Date;
    endDate: Date;
    protocolRunId: string;
  }): Promise<string[]> {
    try {
      // Check permission first
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        throw new NotificationError(
          NotificationErrorCode.PERMISSION_DENIED,
          'Notification permission not granted'
        );
      }

      // Get preferences from store
      const store = useNotificationPreferencesStore.getState();

      // Check if washout notifications are enabled
      if (!store.washoutNotificationsEnabled) {
        throw new NotificationError(
          NotificationErrorCode.SCHEDULING_FAILED,
          'Washout notifications are disabled in preferences'
        );
      }

      const notificationIds: string[] = [];
      const startDate = new Date(washout.startDate);
      const endDate = new Date(washout.endDate);

      // Cancel any existing washout notifications for this washout period
      const existing = await this.scheduler.getScheduledNotifications();
      const toCancel = existing.filter(
        (n) =>
          (n.notificationType === 'washout_start' ||
            n.notificationType === 'washout_warning' ||
            n.notificationType === 'washout_end') &&
          n.data.relatedEntityId === washout.id
      );
      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }

      // Calculate washout duration in days
      const durationMs = endDate.getTime() - startDate.getTime();
      const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

      // Schedule washout start notification
      if (startDate > new Date()) {
        const startInput: ScheduleNotificationInput = {
          title: 'Washout Period Started',
          body: `Your ${durationDays}-day washout period has begun. Avoid trigger foods during this time.`,
          data: {
            type: 'washout_start',
            relatedEntityId: washout.id,
            relatedEntityType: 'washout_period',
            protocolRunId: washout.protocolRunId,
          },
          trigger: {
            type: 'date',
            date: startDate,
            repeats: false,
          },
          sound: true,
          categoryIdentifier: 'washout',
        };

        const startId = await this.schedule(startInput);
        notificationIds.push(startId);
      }

      // Schedule 24-hour warning before end
      const warningTime = new Date(endDate);
      warningTime.setHours(warningTime.getHours() - 24);

      if (warningTime > new Date()) {
        const warningInput: ScheduleNotificationInput = {
          title: 'Washout Period Ending Soon',
          body: 'Your washout period ends in 24 hours. Get ready to start your next test!',
          data: {
            type: 'washout_warning',
            relatedEntityId: washout.id,
            relatedEntityType: 'washout_period',
            protocolRunId: washout.protocolRunId,
          },
          trigger: {
            type: 'date',
            date: warningTime,
            repeats: false,
          },
          sound: true,
          categoryIdentifier: 'washout',
        };

        const warningId = await this.schedule(warningInput);
        notificationIds.push(warningId);
      }

      // Schedule washout end notification
      if (endDate > new Date()) {
        const endInput: ScheduleNotificationInput = {
          title: 'Washout Period Complete',
          body: 'Your washout period is over! You can now begin your next reintroduction test.',
          data: {
            type: 'washout_end',
            relatedEntityId: washout.id,
            relatedEntityType: 'washout_period',
            protocolRunId: washout.protocolRunId,
          },
          trigger: {
            type: 'date',
            date: endDate,
            repeats: false,
          },
          sound: true,
          categoryIdentifier: 'washout',
        };

        const endId = await this.schedule(endInput);
        notificationIds.push(endId);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling washout notifications:', error);

      if (error instanceof NotificationError) {
        throw error;
      }

      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to schedule washout notifications',
        error
      );
    }
  }

  /**
   * Update washout notifications when washout period is extended
   * Requirements: 3.4
   */
  async updateWashoutNotifications(washout: {
    id: string;
    startDate: Date;
    endDate: Date;
    protocolRunId: string;
  }): Promise<string[]> {
    try {
      // Simply reschedule all washout notifications
      return await this.scheduleWashoutNotifications(washout);
    } catch (error) {
      console.error('Error updating washout notifications:', error);

      if (error instanceof NotificationError) {
        throw error;
      }

      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to update washout notifications',
        error
      );
    }
  }

  /**
   * Cancel all washout notifications for a specific washout period
   */
  async cancelWashoutNotifications(washoutId: string): Promise<void> {
    try {
      const existing = await this.scheduler.getScheduledNotifications();
      const toCancel = existing.filter(
        (n) =>
          (n.notificationType === 'washout_start' ||
            n.notificationType === 'washout_warning' ||
            n.notificationType === 'washout_end') &&
          n.data.relatedEntityId === washoutId
      );

      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }
    } catch (error) {
      console.error('Error canceling washout notifications:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Schedule test start reminder when new test is available
   * Schedules immediate notification and follow-up after 48 hours if not started
   * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
   */
  async scheduleTestStartReminder(testStep: {
    id: string;
    foodItemId: string;
    foodName?: string;
    protocolRunId: string;
    availableDate?: Date;
  }): Promise<string[]> {
    try {
      // Check permission first
      const permission = await this.checkPermission();
      if (permission !== 'granted') {
        throw new NotificationError(
          NotificationErrorCode.PERMISSION_DENIED,
          'Notification permission not granted'
        );
      }

      // Get preferences from store
      const store = useNotificationPreferencesStore.getState();

      // Check if test start reminders are enabled
      if (!store.testStartReminderEnabled) {
        throw new NotificationError(
          NotificationErrorCode.SCHEDULING_FAILED,
          'Test start reminders are disabled in preferences'
        );
      }

      const notificationIds: string[] = [];
      const availableDate = testStep.availableDate || new Date();

      // Cancel any existing test start reminders for this test step
      const existing = await this.scheduler.getScheduledNotifications();
      const toCancel = existing.filter(
        (n) => n.notificationType === 'test_start' && n.data.relatedEntityId === testStep.id
      );
      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }

      // Schedule immediate notification (within 2 hours of availability)
      const immediateTime = new Date(availableDate);
      immediateTime.setHours(immediateTime.getHours() + 2);

      if (immediateTime > new Date()) {
        const immediateInput: ScheduleNotificationInput = {
          title: 'New Test Available',
          body: `Your next reintroduction test with ${testStep.foodName || 'a new food'} is ready to start!`,
          data: {
            type: 'test_start',
            relatedEntityId: testStep.id,
            relatedEntityType: 'test_step',
            protocolRunId: testStep.protocolRunId,
            isFollowUp: false,
          },
          trigger: {
            type: 'date',
            date: immediateTime,
            repeats: false,
          },
          sound: true,
          categoryIdentifier: 'test_start',
        };

        const immediateId = await this.schedule(immediateInput);
        notificationIds.push(immediateId);
      }

      // Schedule follow-up reminder after 48 hours
      const followUpTime = new Date(availableDate);
      followUpTime.setHours(followUpTime.getHours() + 48);

      if (followUpTime > new Date()) {
        const followUpInput: ScheduleNotificationInput = {
          title: 'Test Reminder',
          body: `Don't forget to start your reintroduction test with ${testStep.foodName || 'the next food'}. Keep your protocol on track!`,
          data: {
            type: 'test_start',
            relatedEntityId: testStep.id,
            relatedEntityType: 'test_step',
            protocolRunId: testStep.protocolRunId,
            isFollowUp: true,
          },
          trigger: {
            type: 'date',
            date: followUpTime,
            repeats: false,
          },
          sound: true,
          categoryIdentifier: 'test_start',
        };

        const followUpId = await this.schedule(followUpInput);
        notificationIds.push(followUpId);
      }

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling test start reminder:', error);

      if (error instanceof NotificationError) {
        throw error;
      }

      throw new NotificationError(
        NotificationErrorCode.SCHEDULING_FAILED,
        'Failed to schedule test start reminder',
        error
      );
    }
  }

  /**
   * Cancel test start reminders when test is started
   * Requirements: 4.3
   */
  async cancelTestStartReminders(testStepId: string): Promise<void> {
    try {
      const existing = await this.scheduler.getScheduledNotifications();
      const toCancel = existing.filter(
        (n) => n.notificationType === 'test_start' && n.data.relatedEntityId === testStepId
      );

      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }
    } catch (error) {
      console.error('Error canceling test start reminders:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Disable test start reminders when protocol is paused
   * Requirements: 4.4
   */
  async disableTestStartRemindersForProtocol(protocolRunId: string): Promise<void> {
    try {
      const existing = await this.scheduler.getScheduledNotifications();
      const toCancel = existing.filter(
        (n) => n.notificationType === 'test_start' && n.data.protocolRunId === protocolRunId
      );

      for (const notification of toCancel) {
        await this.cancel(notification.id);
      }
    } catch (error) {
      console.error('Error disabling test start reminders for protocol:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Re-enable test start reminders when protocol is resumed
   * Requirements: 4.5
   */
  async enableTestStartRemindersForProtocol(
    protocolRunId: string,
    pendingTests: Array<{
      id: string;
      foodItemId: string;
      foodName?: string;
      protocolRunId: string;
      availableDate?: Date;
    }>
  ): Promise<void> {
    try {
      // Schedule test start reminders for all pending tests
      for (const test of pendingTests) {
        await this.scheduleTestStartReminder(test);
      }
    } catch (error) {
      console.error('Error enabling test start reminders for protocol:', error);
      // Don't throw - this is non-critical
    }
  }

  // ============================================================================
  // ADAPTIVE BEHAVIOR (Subtask 7.4)
  // ============================================================================

  /**
   * Analyze user adherence and return metrics
   * Requirements: 6.1, 6.2
   */
  async analyzeAdherence(userId: string): Promise<AdherenceScore> {
    try {
      return await this.adherenceAnalyzer.calculateAdherenceScore(userId, 14);
    } catch (error) {
      console.error('Error analyzing adherence:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to analyze adherence',
        error
      );
    }
  }

  /**
   * Detect adherence patterns for the user
   * Requirements: 6.1, 6.2, 6.3
   */
  async detectAdherencePatterns(userId: string): Promise<AdherencePattern[]> {
    try {
      return await this.adherenceAnalyzer.detectPatterns(userId);
    } catch (error) {
      console.error('Error detecting adherence patterns:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to detect adherence patterns',
        error
      );
    }
  }

  /**
   * Adjust notification frequency based on adherence
   * Checks adherence before scheduling and applies frequency adjustments
   * Requirements: 6.1, 6.2, 6.5
   */
  async adjustNotificationFrequency(userId: string): Promise<void> {
    try {
      const store = useNotificationPreferencesStore.getState();

      // Only adjust if adaptive frequency is enabled
      if (!store.adaptiveFrequencyEnabled) {
        return;
      }

      // Get current frequency
      const currentFrequency = store.currentFrequency;

      // Calculate new frequency based on adherence
      const newFrequency = await this.adherenceAnalyzer.adjustNotificationFrequency(
        userId,
        currentFrequency
      );

      // Update frequency if it changed
      if (newFrequency !== currentFrequency) {
        store.updateCurrentFrequency(newFrequency);

        // Reschedule notifications based on new frequency
        await this.applyFrequencyAdjustment(newFrequency);
      }
    } catch (error) {
      console.error('Error adjusting notification frequency:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Apply frequency adjustment to scheduled notifications
   * Requirements: 6.1, 6.2, 6.5
   */
  private async applyFrequencyAdjustment(frequency: NotificationFrequency): Promise<void> {
    try {
      const store = useNotificationPreferencesStore.getState();

      // Adjust daily reminders based on frequency
      if (store.dailyReminderEnabled) {
        if (frequency === 'minimal') {
          // Reduce to every other day
          // Note: This is a simplified implementation
          // In production, you'd want to modify the trigger to skip days
          console.log('Reducing daily reminders to every other day');
        } else if (frequency === 'reduced') {
          // Keep daily but maybe adjust timing
          console.log('Maintaining daily reminders with reduced emphasis');
        } else {
          // Full frequency - daily reminders as configured
          console.log('Maintaining full daily reminder frequency');
        }
      }

      // Adjust dose reminders based on frequency
      if (store.doseReminderEnabled) {
        if (frequency === 'minimal') {
          // Disable pre-dose reminders (30 min before)
          // Only keep dose-time reminders
          console.log('Disabling pre-dose reminders');
        } else if (frequency === 'reduced') {
          // Keep both pre-dose and dose-time reminders
          console.log('Maintaining both pre-dose and dose-time reminders');
        } else {
          // Full frequency - all reminders
          console.log('Maintaining full dose reminder frequency');
        }
      }
    } catch (error) {
      console.error('Error applying frequency adjustment:', error);
    }
  }

  /**
   * Check adherence before scheduling reminders
   * Requirements: 6.1, 6.2
   */
  async shouldScheduleReminder(userId: string, reminderType: NotificationType): Promise<boolean> {
    try {
      const store = useNotificationPreferencesStore.getState();

      // If adaptive frequency is disabled, always schedule
      if (!store.adaptiveFrequencyEnabled) {
        return true;
      }

      const currentFrequency = store.currentFrequency;

      // For minimal frequency, skip some reminders
      if (currentFrequency === 'minimal') {
        // Skip daily reminders if user is highly engaged
        if (reminderType === 'daily_reminder') {
          const shouldReduce = await this.adherenceAnalyzer.shouldReduceReminders(userId);
          return !shouldReduce;
        }
      }

      // For reduced frequency, skip pre-dose reminders
      if (currentFrequency === 'reduced') {
        // This would be checked in the scheduleDoseReminder method
        // to skip the 30-minute pre-dose notification
      }

      return true;
    } catch (error) {
      console.error('Error checking if should schedule reminder:', error);
      return true; // Default to scheduling on error
    }
  }

  /**
   * Get frequency recommendation with explanation
   * Requirements: 6.3
   */
  async getFrequencyRecommendation(userId: string): Promise<{
    recommendedFrequency: NotificationFrequency;
    reason: string;
    shouldChange: boolean;
  }> {
    try {
      const store = useNotificationPreferencesStore.getState();
      return await this.adherenceAnalyzer.getFrequencyRecommendation(
        userId,
        store.currentFrequency
      );
    } catch (error) {
      console.error('Error getting frequency recommendation:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to get frequency recommendation',
        error
      );
    }
  }

  /**
   * Allow manual override of adaptive behavior
   * Requirements: 6.5
   */
  async setManualFrequency(frequency: NotificationFrequency): Promise<void> {
    try {
      const store = useNotificationPreferencesStore.getState();

      // Disable adaptive frequency
      store.setAdaptiveFrequencyEnabled(false);

      // Set manual frequency
      store.updateCurrentFrequency(frequency);

      // Apply the frequency adjustment
      await this.applyFrequencyAdjustment(frequency);
    } catch (error) {
      console.error('Error setting manual frequency:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to set manual frequency',
        error
      );
    }
  }

  /**
   * Re-enable adaptive frequency behavior
   * Requirements: 6.5
   */
  async enableAdaptiveFrequency(userId: string): Promise<void> {
    try {
      const store = useNotificationPreferencesStore.getState();

      // Enable adaptive frequency
      store.setAdaptiveFrequencyEnabled(true);

      // Immediately adjust based on current adherence
      await this.adjustNotificationFrequency(userId);
    } catch (error) {
      console.error('Error enabling adaptive frequency:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to enable adaptive frequency',
        error
      );
    }
  }

  /**
   * Clear adherence cache (useful for testing or when user data changes significantly)
   */
  async clearAdherenceCache(): Promise<void> {
    try {
      await this.adherenceAnalyzer.clearCache();
    } catch (error) {
      console.error('Error clearing adherence cache:', error);
    }
  }

  // ============================================================================
  // NOTIFICATION HISTORY MANAGEMENT (Task 8.2)
  // ============================================================================

  /**
   * Clean up old notification history entries
   * Automatically removes entries older than specified days
   * Requirements: 10.5
   *
   * @param daysToKeep - Number of days to keep (default: 30)
   * @returns Number of entries deleted
   */
  async cleanupOldHistory(daysToKeep: number = 30): Promise<number> {
    try {
      const deletedCount = await this.historyRepository.deleteOldEntries(daysToKeep);
      console.log(`Cleaned up ${deletedCount} old notification history entries`);
      return deletedCount;
    } catch (error) {
      console.error('Error cleaning up old notification history:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to cleanup old notification history',
        error
      );
    }
  }

  /**
   * Get notification statistics for the current user
   * Requirements: 10.1
   *
   * @param days - Number of days to analyze (default: 30)
   * @returns Notification statistics
   */
  async getNotificationStatistics(days: number = 30): Promise<{
    totalDelivered: number;
    totalActioned: number;
    actionRate: number;
    byType: Record<NotificationType, { delivered: number; actioned: number }>;
  }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        throw new NotificationError(NotificationErrorCode.STORAGE_ERROR, 'User not authenticated');
      }

      return await this.historyRepository.getStatistics(userId, days);
    } catch (error) {
      console.error('Error getting notification statistics:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to get notification statistics',
        error
      );
    }
  }

  /**
   * Get notification history for a specific related entity
   * Useful for showing notification history on test step or washout detail screens
   * Requirements: 10.3
   *
   * @param entityId - Related entity ID
   * @param entityType - Related entity type
   * @returns Array of notification history entries
   */
  async getNotificationHistoryForEntity(entityId: string, entityType: string): Promise<any[]> {
    try {
      return await this.historyRepository.getByRelatedEntity(entityId, entityType);
    } catch (error) {
      console.error('Error getting notification history for entity:', error);
      return [];
    }
  }

  /**
   * Initialize automatic cleanup of old notification history
   * Should be called on app startup
   * Requirements: 10.5
   */
  async initializeHistoryCleanup(): Promise<void> {
    try {
      // Run cleanup immediately
      await this.cleanupOldHistory(30);

      // Note: In a production app, you would set up a background task
      // to run this cleanup periodically (e.g., daily)
      // For now, we'll just run it on initialization
    } catch (error) {
      console.error('Error initializing history cleanup:', error);
      // Don't throw - this is non-critical
    }
  }

  // ============================================================================
  // ERROR HANDLING AND RETRY LOGIC (Task 12)
  // ============================================================================

  /**
   * Handle network reconnection - retry all failed operations
   * Requirements: 9.2
   */
  async onNetworkReconnect(): Promise<void> {
    try {
      console.log('Network reconnected, retrying failed operations');
      await this.retryQueue.retryAllImmediately();
    } catch (error) {
      console.error('Error retrying operations on network reconnect:', error);
    }
  }

  /**
   * Get retry queue status for debugging
   * Requirements: 9.2
   */
  async getRetryQueueStatus(): Promise<{
    total: number;
    pending: number;
    operations: any[];
  }> {
    return await this.retryQueue.getQueueStatus();
  }

  /**
   * Clear the retry queue
   * Requirements: 9.2
   */
  async clearRetryQueue(): Promise<void> {
    await this.retryQueue.clearQueue();
  }

  /**
   * Get error logs for debugging
   * Requirements: 9.1, 9.2
   */
  async getErrorLogs(): Promise<any[]> {
    return await NotificationError.getErrorLogs();
  }

  /**
   * Clear error logs
   * Requirements: 9.1, 9.2
   */
  async clearErrorLogs(): Promise<void> {
    await NotificationError.clearErrorLogs();
  }

  /**
   * Check if notifications are available (permission granted and enabled)
   * Used for graceful degradation
   * Requirements: 7.3
   */
  async areNotificationsAvailable(): Promise<boolean> {
    try {
      const permission = await this.checkPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error checking notification availability:', error);
      return false;
    }
  }

  /**
   * Get fallback reminder options when notifications are disabled
   * Requirements: 7.3
   */
  getFallbackReminderOptions(): {
    showInAppAlerts: boolean;
    showDashboardBadges: boolean;
    showManualReminders: boolean;
  } {
    const store = useNotificationPreferencesStore.getState();
    const notificationsDisabled = store.permissionStatus !== 'granted';

    return {
      showInAppAlerts: notificationsDisabled,
      showDashboardBadges: notificationsDisabled,
      showManualReminders: notificationsDisabled,
    };
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationService = NotificationService.getInstance();
