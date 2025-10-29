/**
 * Notification Action Handlers
 *
 * Handles actions triggered from notification buttons
 * Requirements: 2.4, 10.3
 */

import * as Notifications from 'expo-notifications';
import { NotificationService } from './NotificationService';
import { NotificationHistoryRepository } from './NotificationHistoryRepository';
import type { NotificationAction } from './types';

export interface ActionHandlerContext {
  navigation?: any; // Navigation object for deep linking
  onTestStepUpdate?: (testStepId: string, updates: any) => Promise<void>;
  onSymptomLogOpen?: () => void;
}

/**
 * Handles notification action button responses
 */
export class NotificationActionHandlers {
  private static instance: NotificationActionHandlers;
  private notificationService: NotificationService;
  private historyRepository: NotificationHistoryRepository;
  private context: ActionHandlerContext = {};

  private constructor() {
    this.notificationService = NotificationService.getInstance();
    this.historyRepository = NotificationHistoryRepository.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationActionHandlers {
    if (!NotificationActionHandlers.instance) {
      NotificationActionHandlers.instance = new NotificationActionHandlers();
    }
    return NotificationActionHandlers.instance;
  }

  /**
   * Set the context for action handlers
   * Should be called during app initialization with navigation and callbacks
   */
  setContext(context: ActionHandlerContext): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Handle notification response with action
   * Requirements: 2.4, 10.3
   */
  async handleNotificationResponse(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const { actionIdentifier } = response;
      const { data } = response.notification.request.content;

      console.log('Handling notification action:', actionIdentifier, data);

      // Determine which action was triggered
      switch (actionIdentifier) {
        case 'mark-taken':
          await this.handleMarkTaken(response);
          break;

        case 'snooze':
          await this.handleSnooze(response);
          break;

        case 'log-now':
          await this.handleLogNow(response);
          break;

        case 'start-test':
          await this.handleStartTest(response);
          break;

        case Notifications.DEFAULT_ACTION_IDENTIFIER:
          // User tapped the notification itself (not an action button)
          await this.handleDefaultAction(response);
          break;

        default:
          console.warn('Unknown action identifier:', actionIdentifier);
      }
    } catch (error) {
      console.error('Error handling notification response:', error);
    }
  }

  /**
   * Handle "Mark Taken" action for dose reminders
   * Requirements: 2.4
   */
  private async handleMarkTaken(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const { data } = response.notification.request.content;
      const testStepId = data.relatedEntityId;

      if (!testStepId) {
        console.error('No test step ID found in notification data');
        return;
      }

      console.log('Marking dose as taken for test step:', testStepId);

      // Update test step to mark dose as taken
      if (this.context.onTestStepUpdate) {
        await this.context.onTestStepUpdate(testStepId, {
          doseTaken: true,
          doseTakenAt: new Date(),
        });
      } else {
        console.warn('onTestStepUpdate callback not set in context');
      }

      // Cancel any remaining dose reminders for this test step
      await this.notificationService.cancelDoseReminders(testStepId);

      // Track action in notification history
      await this.trackAction(response, 'dose_marked_taken');

      console.log('Dose marked as taken successfully');
    } catch (error) {
      console.error('Error handling mark taken action:', error);
    }
  }

  /**
   * Handle "Snooze" action for dose reminders
   * Requirements: 2.4
   */
  private async handleSnooze(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const { data } = response.notification.request.content;
      const testStepId = data.relatedEntityId;

      if (!testStepId) {
        console.error('No test step ID found in notification data');
        return;
      }

      console.log('Snoozing dose reminder for test step:', testStepId);

      // Snooze the dose reminder by 15 minutes
      await this.notificationService.snoozeDoseReminder(testStepId);

      // Track action in notification history
      await this.trackAction(response, 'snoozed');

      console.log('Dose reminder snoozed for 15 minutes');
    } catch (error) {
      console.error('Error handling snooze action:', error);
    }
  }

  /**
   * Handle "Log Now" action for daily reminders
   * Requirements: 2.4
   */
  private async handleLogNow(response: Notifications.NotificationResponse): Promise<void> {
    try {
      console.log('Opening symptom logging screen');

      // Open symptom logging screen
      if (this.context.navigation) {
        this.context.navigation.navigate('DiaryScreen');
      } else if (this.context.onSymptomLogOpen) {
        this.context.onSymptomLogOpen();
      } else {
        console.warn('Navigation or onSymptomLogOpen callback not set in context');
      }

      // Track action in notification history
      await this.trackAction(response, 'symptom_logged');

      console.log('Navigated to symptom logging screen');
    } catch (error) {
      console.error('Error handling log now action:', error);
    }
  }

  /**
   * Handle "Start Test" action for test start reminders
   */
  private async handleStartTest(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const { data } = response.notification.request.content;
      const testStepId = data.relatedEntityId;

      console.log('Opening test start screen for test step:', testStepId);

      // Navigate to test start screen
      if (this.context.navigation) {
        this.context.navigation.navigate('TestStartScreen', {
          testStepId,
        });
      } else {
        console.warn('Navigation not set in context');
      }

      // Track action in notification history
      await this.trackAction(response, 'opened');

      console.log('Navigated to test start screen');
    } catch (error) {
      console.error('Error handling start test action:', error);
    }
  }

  /**
   * Handle default action (user tapped notification itself)
   * Requirements: 10.3
   */
  private async handleDefaultAction(response: Notifications.NotificationResponse): Promise<void> {
    try {
      const { data } = response.notification.request.content;
      const notificationType = data.type;

      console.log('Handling default action for notification type:', notificationType);

      // Get deep link information from NotificationService
      const deepLink = this.notificationService.handleDeepLink(response);

      if (deepLink && this.context.navigation) {
        // Navigate to the appropriate screen
        this.context.navigation.navigate(deepLink.screen, deepLink.params);
      } else {
        console.warn('No deep link or navigation available');
      }

      // Track action in notification history
      await this.trackAction(response, 'opened');

      console.log('Handled default action successfully');
    } catch (error) {
      console.error('Error handling default action:', error);
    }
  }

  /**
   * Track notification action in history
   * Requirements: 10.3
   */
  private async trackAction(
    response: Notifications.NotificationResponse,
    action: NotificationAction
  ): Promise<void> {
    try {
      const notificationId = response.notification.request.identifier;
      await this.notificationService.markNotificationAsActioned(notificationId, action);
    } catch (error) {
      console.error('Error tracking notification action:', error);
      // Don't throw - this is non-critical
    }
  }

  /**
   * Get context for testing or debugging
   */
  getContext(): ActionHandlerContext {
    return { ...this.context };
  }

  /**
   * Clear context (useful for testing)
   */
  clearContext(): void {
    this.context = {};
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationActionHandlers = NotificationActionHandlers.getInstance();
