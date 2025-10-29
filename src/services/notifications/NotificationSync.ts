/**
 * Notification Sync Utilities
 *
 * Handles syncing notification preferences and history with Appwrite
 * Requirements: 8.3, 9.2
 */

import { NotificationError, NotificationErrorCode } from './types';
import { useNotificationPreferencesStore } from '../../shared/stores/notificationPreferencesStore';
import { tablesDB, DATABASE_ID, TABLES } from '../../infrastructure/api/appwrite';
import type { UserProfile } from '../../shared/types/entities';

/**
 * Sync notification preferences to Appwrite
 * Requirements: 8.3
 */
export async function syncNotificationPreferences(userId: string): Promise<void> {
  try {
    const store = useNotificationPreferencesStore.getState();

    // Get current user profile
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.USER_PROFILES,
      rowId: userId,
    });

    if (!row) {
      throw new NotificationError(
        NotificationErrorCode.SYNC_ERROR,
        'User profile not found for sync'
      );
    }

    // Update notification preferences in profile
    const notificationPreferences = {
      permissionGranted: store.permissionStatus === 'granted',
      dailyReminderEnabled: store.dailyReminderEnabled,
      dailyReminderTime: store.dailyReminderTime
        ? `${String(store.dailyReminderTime.hour).padStart(2, '0')}:${String(store.dailyReminderTime.minute).padStart(2, '0')}`
        : null,
      doseReminderEnabled: store.doseReminderEnabled,
      doseReminderAdvanceMinutes: store.doseReminderAdvanceMinutes,
      washoutNotificationsEnabled: store.washoutNotificationsEnabled,
      testStartReminderEnabled: store.testStartReminderEnabled,
      quietHoursEnabled: store.quietHours?.enabled ?? false,
      quietHoursStart: store.quietHours?.start
        ? `${String(store.quietHours.start.hour).padStart(2, '0')}:${String(store.quietHours.start.minute).padStart(2, '0')}`
        : null,
      quietHoursEnd: store.quietHours?.end
        ? `${String(store.quietHours.end.hour).padStart(2, '0')}:${String(store.quietHours.end.minute).padStart(2, '0')}`
        : null,
      quietHoursAllowCritical: store.quietHours?.allowCritical ?? false,
      adaptiveFrequencyEnabled: store.adaptiveFrequencyEnabled,
      currentFrequency: store.currentFrequency,
    };

    await tablesDB.updateRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.USER_PROFILES,
      rowId: userId,
      data: { notificationPreferences },
    });

    console.log('Notification preferences synced successfully');
  } catch (error) {
    console.error('Error syncing notification preferences:', error);
    throw new NotificationError(
      NotificationErrorCode.SYNC_ERROR,
      'Failed to sync notification preferences',
      error
    );
  }
}

/**
 * Load notification preferences from Appwrite
 * Requirements: 8.3
 */
export async function loadNotificationPreferences(userId: string): Promise<void> {
  try {
    const row = await tablesDB.getRow({
      databaseId: DATABASE_ID,
      tableId: TABLES.USER_PROFILES,
      rowId: userId,
    });

    const profile = row as UserProfile;

    if (!profile || !profile.notificationPreferences) {
      console.log('No notification preferences found in profile');
      return;
    }

    const prefs = profile.notificationPreferences;
    const store = useNotificationPreferencesStore.getState();

    // Update store with loaded preferences
    store.setPermissionStatus(prefs.permissionGranted ? 'granted' : 'denied');
    store.setDailyReminderEnabled(prefs.dailyReminderEnabled);

    if (prefs.dailyReminderTime) {
      const [hour, minute] = prefs.dailyReminderTime.split(':').map(Number);
      store.setDailyReminderTime({ hour, minute });
    }

    store.setDoseReminderEnabled(prefs.doseReminderEnabled);
    store.setDoseReminderAdvanceMinutes(prefs.doseReminderAdvanceMinutes);
    store.setWashoutNotificationsEnabled(prefs.washoutNotificationsEnabled);
    store.setTestStartReminderEnabled(prefs.testStartReminderEnabled);

    if (prefs.quietHoursEnabled && prefs.quietHoursStart && prefs.quietHoursEnd) {
      const [startHour, startMinute] = prefs.quietHoursStart.split(':').map(Number);
      const [endHour, endMinute] = prefs.quietHoursEnd.split(':').map(Number);

      store.setQuietHours({
        enabled: true,
        start: { hour: startHour, minute: startMinute },
        end: { hour: endHour, minute: endMinute },
        allowCritical: prefs.quietHoursAllowCritical,
      });
    }

    store.setAdaptiveFrequencyEnabled(prefs.adaptiveFrequencyEnabled);
    store.updateCurrentFrequency(prefs.currentFrequency);

    console.log('Notification preferences loaded successfully');
  } catch (error) {
    console.error('Error loading notification preferences:', error);
    throw new NotificationError(
      NotificationErrorCode.SYNC_ERROR,
      'Failed to load notification preferences',
      error
    );
  }
}
