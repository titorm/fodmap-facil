/**
 * Notification Configuration
 *
 * Sets up notification channels, categories, and handlers for the app
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Configure notification channels for Android
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    // Main channel for general reminders
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General Reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#2196F3',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // High priority channel for dose reminders
    await Notifications.setNotificationChannelAsync('dose-reminders', {
      name: 'Dose Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Medium priority channel for daily reminders
    await Notifications.setNotificationChannelAsync('daily-reminders', {
      name: 'Daily Symptom Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });

    // Washout notifications channel
    await Notifications.setNotificationChannelAsync('washout', {
      name: 'Washout Period Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#9C27B0',
      sound: 'default',
      enableVibrate: true,
      showBadge: true,
    });
  }
}

/**
 * Configure notification categories with action buttons
 * Requirements: 2.4 - Dose reminders with "Mark Taken" and "Snooze" actions
 * Requirements: 2.4 - Daily reminders with "Log Now" action
 */
export async function setupNotificationCategories(): Promise<void> {
  // Category for dose reminders with action buttons
  // Requirement 2.4: "Mark Taken" and "Snooze" actions
  await Notifications.setNotificationCategoryAsync('dose_reminder', [
    {
      identifier: 'mark-taken',
      buttonTitle: 'Mark Taken',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
    {
      identifier: 'snooze',
      buttonTitle: 'Snooze 15min',
      options: {
        opensAppToForeground: false,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  // Category for daily reminders
  // Requirement 2.4: "Log Now" action
  await Notifications.setNotificationCategoryAsync('daily_reminder', [
    {
      identifier: 'log-now',
      buttonTitle: 'Log Now',
      options: {
        opensAppToForeground: true,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  // Category for test start reminders
  await Notifications.setNotificationCategoryAsync('test_start', [
    {
      identifier: 'start-test',
      buttonTitle: 'Start Test',
      options: {
        opensAppToForeground: true,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  // Category for washout notifications with view action
  await Notifications.setNotificationCategoryAsync('washout', [
    {
      identifier: 'view-washout',
      buttonTitle: 'View',
      options: {
        opensAppToForeground: true,
        isDestructive: false,
        isAuthenticationRequired: false,
      },
    },
  ]);

  console.log('Notification categories configured successfully');
}

/**
 * Set default notification handler behavior
 */
export function setupNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Initialize all notification configurations
 */
export async function initializeNotifications(): Promise<void> {
  // Set up the notification handler
  setupNotificationHandler();

  // Set up Android channels
  await setupNotificationChannels();

  // Set up notification categories with actions
  await setupNotificationCategories();
}
