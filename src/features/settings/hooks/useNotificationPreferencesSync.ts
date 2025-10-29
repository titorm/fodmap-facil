import { useEffect, useCallback } from 'react';
import { useNotificationPreferencesStore } from '../../../shared/stores/notificationPreferencesStore';
import { useUpdateUserProfile } from '../../../shared/hooks/useUserProfile';
import { useAuth } from '../../../shared/hooks/useAuth';
import type { NotificationPreferences } from '../../../shared/types/entities';
import type { NotificationFrequency } from '../../../services/notifications/types';

/**
 * Hook to sync notification preferences from Zustand store to UserProfile in Appwrite
 * Requirements: 8.3, 5.1
 *
 * This hook automatically syncs changes from the local notification preferences store
 * to the user's profile in Appwrite for cloud backup and cross-device sync.
 */
export function useNotificationPreferencesSync() {
  const { user } = useAuth();
  const updateUserProfile = useUpdateUserProfile();

  // Get all preferences from store
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);
  const dailyReminderEnabled = useNotificationPreferencesStore(
    (state) => state.dailyReminderEnabled
  );
  const dailyReminderTime = useNotificationPreferencesStore((state) => state.dailyReminderTime);
  const doseReminderEnabled = useNotificationPreferencesStore((state) => state.doseReminderEnabled);
  const doseReminderAdvanceMinutes = useNotificationPreferencesStore(
    (state) => state.doseReminderAdvanceMinutes
  );
  const washoutNotificationsEnabled = useNotificationPreferencesStore(
    (state) => state.washoutNotificationsEnabled
  );
  const testStartReminderEnabled = useNotificationPreferencesStore(
    (state) => state.testStartReminderEnabled
  );
  const quietHours = useNotificationPreferencesStore((state) => state.quietHours);
  const adaptiveFrequencyEnabled = useNotificationPreferencesStore(
    (state) => state.adaptiveFrequencyEnabled
  );
  const currentFrequency = useNotificationPreferencesStore((state) => state.currentFrequency);

  /**
   * Sync preferences to UserProfile
   */
  const syncToUserProfile = useCallback(async () => {
    if (!user?.id) {
      console.log('Cannot sync preferences: user not authenticated');
      return;
    }

    try {
      // Convert TimeOfDay to string format for storage
      const dailyReminderTimeString = dailyReminderTime
        ? `${dailyReminderTime.hour.toString().padStart(2, '0')}:${dailyReminderTime.minute.toString().padStart(2, '0')}`
        : null;

      const quietHoursStartString = quietHours?.start
        ? `${quietHours.start.hour.toString().padStart(2, '0')}:${quietHours.start.minute.toString().padStart(2, '0')}`
        : null;

      const quietHoursEndString = quietHours?.end
        ? `${quietHours.end.hour.toString().padStart(2, '0')}:${quietHours.end.minute.toString().padStart(2, '0')}`
        : null;

      const notificationPreferences: NotificationPreferences = {
        permissionGranted: permissionStatus === 'granted',
        dailyReminderEnabled,
        dailyReminderTime: dailyReminderTimeString,
        doseReminderEnabled,
        doseReminderAdvanceMinutes,
        washoutNotificationsEnabled,
        testStartReminderEnabled,
        quietHoursEnabled: quietHours?.enabled ?? false,
        quietHoursStart: quietHoursStartString,
        quietHoursEnd: quietHoursEndString,
        quietHoursAllowCritical: quietHours?.allowCritical ?? true,
        adaptiveFrequencyEnabled,
        currentFrequency,
      };

      await updateUserProfile.mutateAsync({
        id: user.id,
        data: {
          notificationPreferences,
          updatedAt: new Date(),
        },
      });

      console.log('Notification preferences synced to UserProfile');
    } catch (error) {
      console.error('Error syncing notification preferences to UserProfile:', error);
      // Don't throw - sync failures should not break the UI
    }
  }, [
    user?.id,
    permissionStatus,
    dailyReminderEnabled,
    dailyReminderTime,
    doseReminderEnabled,
    doseReminderAdvanceMinutes,
    washoutNotificationsEnabled,
    testStartReminderEnabled,
    quietHours,
    adaptiveFrequencyEnabled,
    currentFrequency,
    updateUserProfile,
  ]);

  return {
    syncToUserProfile,
    isSyncing: updateUserProfile.isPending,
    syncError: updateUserProfile.error,
  };
}

/**
 * Hook to automatically sync preferences on change
 * Use this in the NotificationSettingsScreen to enable auto-sync
 */
export function useAutoSyncNotificationPreferences() {
  const { syncToUserProfile, isSyncing } = useNotificationPreferencesSync();

  // Get all preferences from store to trigger sync on change
  const permissionStatus = useNotificationPreferencesStore((state) => state.permissionStatus);
  const dailyReminderEnabled = useNotificationPreferencesStore(
    (state) => state.dailyReminderEnabled
  );
  const dailyReminderTime = useNotificationPreferencesStore((state) => state.dailyReminderTime);
  const doseReminderEnabled = useNotificationPreferencesStore((state) => state.doseReminderEnabled);
  const doseReminderAdvanceMinutes = useNotificationPreferencesStore(
    (state) => state.doseReminderAdvanceMinutes
  );
  const washoutNotificationsEnabled = useNotificationPreferencesStore(
    (state) => state.washoutNotificationsEnabled
  );
  const testStartReminderEnabled = useNotificationPreferencesStore(
    (state) => state.testStartReminderEnabled
  );
  const quietHours = useNotificationPreferencesStore((state) => state.quietHours);
  const adaptiveFrequencyEnabled = useNotificationPreferencesStore(
    (state) => state.adaptiveFrequencyEnabled
  );
  const currentFrequency = useNotificationPreferencesStore((state) => state.currentFrequency);

  // Sync whenever preferences change (with debounce via useEffect)
  useEffect(() => {
    // Debounce sync to avoid too many requests
    const timeoutId = setTimeout(() => {
      syncToUserProfile();
    }, 1000); // Wait 1 second after last change

    return () => clearTimeout(timeoutId);
  }, [
    permissionStatus,
    dailyReminderEnabled,
    dailyReminderTime,
    doseReminderEnabled,
    doseReminderAdvanceMinutes,
    washoutNotificationsEnabled,
    testStartReminderEnabled,
    quietHours,
    adaptiveFrequencyEnabled,
    currentFrequency,
    syncToUserProfile,
  ]);

  return {
    isSyncing,
  };
}
