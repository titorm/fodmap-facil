/**
 * Notification Listeners
 *
 * Sets up listeners for notification events (received, tapped, etc.)
 */

import * as Notifications from 'expo-notifications';
import type { EventSubscription } from 'expo-notifications';

export type NotificationReceivedHandler = (notification: Notifications.Notification) => void;

export type NotificationResponseHandler = (response: Notifications.NotificationResponse) => void;

/**
 * Manages notification event listeners
 */
export class NotificationListeners {
  private notificationReceivedSubscription: EventSubscription | null = null;
  private notificationResponseSubscription: EventSubscription | null = null;

  /**
   * Set up listener for when notifications are received while app is foregrounded
   */
  onNotificationReceived(handler: NotificationReceivedHandler): void {
    this.notificationReceivedSubscription = Notifications.addNotificationReceivedListener(handler);
  }

  /**
   * Set up listener for when user taps on a notification
   */
  onNotificationResponse(handler: NotificationResponseHandler): void {
    this.notificationResponseSubscription =
      Notifications.addNotificationResponseReceivedListener(handler);
  }

  /**
   * Remove all notification listeners
   */
  removeAllListeners(): void {
    if (this.notificationReceivedSubscription) {
      this.notificationReceivedSubscription.remove();
      this.notificationReceivedSubscription = null;
    }

    if (this.notificationResponseSubscription) {
      this.notificationResponseSubscription.remove();
      this.notificationResponseSubscription = null;
    }
  }

  /**
   * Get the last notification response (useful for handling deep links on app launch)
   */
  getLastNotificationResponse(): Notifications.NotificationResponse | null {
    return Notifications.getLastNotificationResponse();
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationListeners = new NotificationListeners();
