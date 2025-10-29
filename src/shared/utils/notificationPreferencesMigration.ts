/**
 * Migration utilities for notification preferences
 * Provides helpers to add default notification preferences to existing user profiles
 */

import type { NotificationPreferences } from '../types/entities';
import type { NotificationFrequency } from '../../services/notifications/types';

/**
 * Default notification preferences for new and existing users
 */
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  permissionGranted: false,
  dailyReminderEnabled: true,
  dailyReminderTime: '20:00', // 8 PM default
  doseReminderEnabled: true,
  doseReminderAdvanceMinutes: 30,
  washoutNotificationsEnabled: true,
  testStartReminderEnabled: true,
  quietHoursEnabled: false,
  quietHoursStart: '22:00', // 10 PM default
  quietHoursEnd: '08:00', // 8 AM default
  quietHoursAllowCritical: true,
  adaptiveFrequencyEnabled: true,
  currentFrequency: 'full' as NotificationFrequency,
};

/**
 * Creates default notification preferences
 * @returns A new NotificationPreferences object with default values
 */
export function createDefaultNotificationPreferences(): NotificationPreferences {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES };
}

/**
 * Migrates a user profile to include notification preferences if missing
 * @param profile - The user profile to migrate
 * @returns The profile with notification preferences added if they were missing
 */
export function migrateUserProfileNotificationPreferences<
  T extends { notificationPreferences?: NotificationPreferences },
>(profile: T): T & { notificationPreferences: NotificationPreferences } {
  if (!profile.notificationPreferences) {
    return {
      ...profile,
      notificationPreferences: createDefaultNotificationPreferences(),
    };
  }

  // Ensure all fields exist (partial migration for profiles with incomplete preferences)
  return {
    ...profile,
    notificationPreferences: {
      ...DEFAULT_NOTIFICATION_PREFERENCES,
      ...profile.notificationPreferences,
    },
  };
}

/**
 * Checks if a user profile needs notification preferences migration
 * @param profile - The user profile to check
 * @returns true if migration is needed, false otherwise
 */
export function needsNotificationPreferencesMigration(profile: {
  notificationPreferences?: NotificationPreferences;
}): boolean {
  return !profile.notificationPreferences;
}
