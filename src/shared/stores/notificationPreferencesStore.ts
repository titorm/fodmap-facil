/**
 * Notification Preferences Store
 *
 * Zustand store for managing notification preferences with AsyncStorage persistence
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type {
  PermissionStatus,
  NotificationFrequency,
  TimeOfDay,
  QuietHoursConfig,
} from '../../services/notifications/types';

/**
 * Notification Preferences State Interface
 */
export interface NotificationPreferencesState {
  // Permission Status
  permissionStatus: PermissionStatus;
  permissionAskedAt: Date | null;

  // Enabled Types
  dailyReminderEnabled: boolean;
  doseReminderEnabled: boolean;
  washoutNotificationsEnabled: boolean;
  testStartReminderEnabled: boolean;

  // Timing
  dailyReminderTime: TimeOfDay | null;
  doseReminderAdvanceMinutes: number; // Default: 30

  // Quiet Hours
  quietHours: QuietHoursConfig | null;

  // Adaptive Behavior
  adaptiveFrequencyEnabled: boolean;
  currentFrequency: NotificationFrequency;

  // Actions
  setPermissionStatus: (status: PermissionStatus) => void;
  setPermissionAskedAt: (date: Date) => void;
  setDailyReminderEnabled: (enabled: boolean) => void;
  setDailyReminderTime: (time: TimeOfDay | null) => void;
  setDoseReminderEnabled: (enabled: boolean) => void;
  setDoseReminderAdvanceMinutes: (minutes: number) => void;
  setWashoutNotificationsEnabled: (enabled: boolean) => void;
  setTestStartReminderEnabled: (enabled: boolean) => void;
  setQuietHours: (config: QuietHoursConfig | null) => void;
  setAdaptiveFrequencyEnabled: (enabled: boolean) => void;
  updateCurrentFrequency: (frequency: NotificationFrequency) => void;
  reset: () => void;
}

/**
 * Default state values
 */
const defaultState = {
  permissionStatus: 'undetermined' as PermissionStatus,
  permissionAskedAt: null,
  dailyReminderEnabled: true,
  doseReminderEnabled: true,
  washoutNotificationsEnabled: true,
  testStartReminderEnabled: true,
  dailyReminderTime: { hour: 20, minute: 0 } as TimeOfDay, // 8 PM default
  doseReminderAdvanceMinutes: 30,
  quietHours: null,
  adaptiveFrequencyEnabled: true,
  currentFrequency: 'full' as NotificationFrequency,
};

/**
 * Notification Preferences Store
 */
export const useNotificationPreferencesStore = create<NotificationPreferencesState>()(
  persist(
    (set) => ({
      // Initial State
      ...defaultState,

      // Actions
      setPermissionStatus: (status) => set({ permissionStatus: status }),

      setPermissionAskedAt: (date) => set({ permissionAskedAt: date }),

      setDailyReminderEnabled: (enabled) => set({ dailyReminderEnabled: enabled }),

      setDailyReminderTime: (time) => set({ dailyReminderTime: time }),

      setDoseReminderEnabled: (enabled) => set({ doseReminderEnabled: enabled }),

      setDoseReminderAdvanceMinutes: (minutes) => set({ doseReminderAdvanceMinutes: minutes }),

      setWashoutNotificationsEnabled: (enabled) => set({ washoutNotificationsEnabled: enabled }),

      setTestStartReminderEnabled: (enabled) => set({ testStartReminderEnabled: enabled }),

      setQuietHours: (config) => set({ quietHours: config }),

      setAdaptiveFrequencyEnabled: (enabled) => set({ adaptiveFrequencyEnabled: enabled }),

      updateCurrentFrequency: (frequency) => set({ currentFrequency: frequency }),

      reset: () => set(defaultState),
    }),
    {
      name: 'notification-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Selectors for common queries
 */

/**
 * Check if notifications are fully enabled (permission granted and at least one type enabled)
 */
export const selectNotificationsEnabled = (state: NotificationPreferencesState): boolean => {
  return (
    state.permissionStatus === 'granted' &&
    (state.dailyReminderEnabled ||
      state.doseReminderEnabled ||
      state.washoutNotificationsEnabled ||
      state.testStartReminderEnabled)
  );
};

/**
 * Check if any notification type is enabled
 */
export const selectAnyNotificationTypeEnabled = (state: NotificationPreferencesState): boolean => {
  return (
    state.dailyReminderEnabled ||
    state.doseReminderEnabled ||
    state.washoutNotificationsEnabled ||
    state.testStartReminderEnabled
  );
};

/**
 * Check if quiet hours are currently active
 */
export const selectQuietHoursEnabled = (state: NotificationPreferencesState): boolean => {
  return state.quietHours !== null && state.quietHours.enabled;
};

/**
 * Get quiet hours configuration if enabled
 */
export const selectQuietHoursConfig = (
  state: NotificationPreferencesState
): QuietHoursConfig | null => {
  return state.quietHours?.enabled ? state.quietHours : null;
};

/**
 * Check if permission has been requested before
 */
export const selectPermissionAsked = (state: NotificationPreferencesState): boolean => {
  return state.permissionAskedAt !== null;
};

/**
 * Check if permission is granted
 */
export const selectPermissionGranted = (state: NotificationPreferencesState): boolean => {
  return state.permissionStatus === 'granted';
};

/**
 * Check if permission is denied
 */
export const selectPermissionDenied = (state: NotificationPreferencesState): boolean => {
  return state.permissionStatus === 'denied';
};

/**
 * Check if adaptive frequency is reducing notifications
 */
export const selectIsReducedFrequency = (state: NotificationPreferencesState): boolean => {
  return (
    state.adaptiveFrequencyEnabled &&
    (state.currentFrequency === 'reduced' || state.currentFrequency === 'minimal')
  );
};

/**
 * Get daily reminder time in minutes since midnight
 */
export const selectDailyReminderMinutes = (state: NotificationPreferencesState): number | null => {
  if (!state.dailyReminderTime) return null;
  return state.dailyReminderTime.hour * 60 + state.dailyReminderTime.minute;
};

/**
 * Custom Hooks for accessing preferences
 */

/**
 * Hook to check if notifications are enabled
 */
export const useNotificationsEnabled = (): boolean => {
  return useNotificationPreferencesStore(selectNotificationsEnabled);
};

/**
 * Hook to check if permission is granted
 */
export const usePermissionGranted = (): boolean => {
  return useNotificationPreferencesStore(selectPermissionGranted);
};

/**
 * Hook to check if permission is denied
 */
export const usePermissionDenied = (): boolean => {
  return useNotificationPreferencesStore(selectPermissionDenied);
};

/**
 * Hook to get quiet hours configuration
 */
export const useQuietHoursConfig = (): QuietHoursConfig | null => {
  return useNotificationPreferencesStore(selectQuietHoursConfig);
};

/**
 * Hook to check if quiet hours are enabled
 */
export const useQuietHoursEnabled = (): boolean => {
  return useNotificationPreferencesStore(selectQuietHoursEnabled);
};

/**
 * Hook to check if any notification type is enabled
 */
export const useAnyNotificationTypeEnabled = (): boolean => {
  return useNotificationPreferencesStore(selectAnyNotificationTypeEnabled);
};

/**
 * Hook to check if adaptive frequency is reducing notifications
 */
export const useIsReducedFrequency = (): boolean => {
  return useNotificationPreferencesStore(selectIsReducedFrequency);
};

/**
 * Hook to get daily reminder time
 */
export const useDailyReminderTime = (): TimeOfDay | null => {
  return useNotificationPreferencesStore((state) => state.dailyReminderTime);
};

/**
 * Hook to get dose reminder advance minutes
 */
export const useDoseReminderAdvanceMinutes = (): number => {
  return useNotificationPreferencesStore((state) => state.doseReminderAdvanceMinutes);
};

/**
 * Hook to get current notification frequency
 */
export const useCurrentFrequency = (): NotificationFrequency => {
  return useNotificationPreferencesStore((state) => state.currentFrequency);
};

/**
 * Hook to get permission status
 */
export const usePermissionStatus = (): PermissionStatus => {
  return useNotificationPreferencesStore((state) => state.permissionStatus);
};

/**
 * Hook to check if permission has been asked
 */
export const usePermissionAsked = (): boolean => {
  return useNotificationPreferencesStore(selectPermissionAsked);
};

/**
 * Hook to get all notification type enabled states
 */
export const useNotificationTypesEnabled = () => {
  return useNotificationPreferencesStore((state) => ({
    dailyReminder: state.dailyReminderEnabled,
    doseReminder: state.doseReminderEnabled,
    washoutNotifications: state.washoutNotificationsEnabled,
    testStartReminder: state.testStartReminderEnabled,
  }));
};

/**
 * Hook to get all preference actions
 */
export const useNotificationPreferencesActions = () => {
  return useNotificationPreferencesStore((state) => ({
    setPermissionStatus: state.setPermissionStatus,
    setPermissionAskedAt: state.setPermissionAskedAt,
    setDailyReminderEnabled: state.setDailyReminderEnabled,
    setDailyReminderTime: state.setDailyReminderTime,
    setDoseReminderEnabled: state.setDoseReminderEnabled,
    setDoseReminderAdvanceMinutes: state.setDoseReminderAdvanceMinutes,
    setWashoutNotificationsEnabled: state.setWashoutNotificationsEnabled,
    setTestStartReminderEnabled: state.setTestStartReminderEnabled,
    setQuietHours: state.setQuietHours,
    setAdaptiveFrequencyEnabled: state.setAdaptiveFrequencyEnabled,
    updateCurrentFrequency: state.updateCurrentFrequency,
    reset: state.reset,
  }));
};
