/**
 * Notification Setup Hook
 *
 * React hook to initialize notification infrastructure on app startup
 * Requirements: 2.4, 10.3 - Action handlers for notification buttons
 */

import { useEffect, useRef } from 'react';
import { initializeNotifications } from './NotificationConfig';
import { notificationListeners } from './NotificationListeners';
import { notificationActionHandlers } from './NotificationActionHandlers';
import { notificationService } from './NotificationService';

export interface NotificationSetupOptions {
  navigation?: any;
  onTestStepUpdate?: (testStepId: string, updates: any) => Promise<void>;
  onSymptomLogOpen?: () => void;
}

/**
 * Hook to set up notification infrastructure
 * Should be called once at the app root level
 *
 * @param options - Optional configuration for action handlers
 */
export function useNotificationSetup(options?: NotificationSetupOptions) {
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent double initialization in development (React StrictMode)
    if (isInitialized.current) {
      return;
    }

    isInitialized.current = true;

    // Initialize notification configuration
    initializeNotifications().catch((error) => {
      console.error('Failed to initialize notifications:', error);
    });

    // Set up action handler context if provided
    if (options) {
      notificationActionHandlers.setContext(options);
    }

    // Set up notification received listener
    notificationListeners.onNotificationReceived((notification) => {
      console.log('Notification received:', notification);
      // Track delivery in history (handled by NotificationService)
    });

    // Set up notification response listener (when user taps notification or action button)
    // Requirements: 2.4, 10.3
    notificationListeners.onNotificationResponse(async (response) => {
      console.log('Notification response received:', response);

      try {
        // Handle the notification action
        await notificationActionHandlers.handleNotificationResponse(response);
      } catch (error) {
        console.error('Error handling notification response:', error);
      }
    });

    // Check for notification that launched the app
    const lastResponse = notificationListeners.getLastNotificationResponse();
    if (lastResponse) {
      console.log('App launched from notification:', lastResponse);
      // Handle the notification that launched the app
      notificationActionHandlers.handleNotificationResponse(lastResponse).catch((error) => {
        console.error('Error handling launch notification:', error);
      });
    }

    // Initialize notification history cleanup
    notificationService.initializeHistoryCleanup().catch((error) => {
      console.error('Error initializing history cleanup:', error);
    });

    // Cleanup listeners on unmount
    return () => {
      notificationListeners.removeAllListeners();
    };
  }, [options]);
}
