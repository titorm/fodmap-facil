/**
 * Notification Batch Scheduler
 *
 * Optimizes notification scheduling by pre-calculating times for entire protocol
 * and batching operations to minimize AsyncStorage reads/writes
 *
 * Requirements: 9.1, 9.2
 * Task: 15.1 - Implement efficient scheduling
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationScheduler } from './NotificationScheduler';
import type { ScheduleNotificationInput, NotificationType, NotificationTrigger } from './types';

const BATCH_SCHEDULE_CACHE_KEY = '@notifications:batch_schedule_cache';
const PROTOCOL_SCHEDULE_KEY = '@notifications:protocol_schedule';

/**
 * Pre-calculated notification schedule for an entire protocol
 */
interface ProtocolSchedule {
  protocolRunId: string;
  userId: string;
  notifications: PreCalculatedNotification[];
  calculatedAt: Date;
  validUntil: Date;
}

/**
 * Pre-calculated notification with all timing information
 */
interface PreCalculatedNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  scheduledTime: Date;
  trigger: NotificationTrigger;
  data: Record<string, any>;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

/**
 * Batch operation for efficient scheduling
 */
interface BatchOperation {
  type: 'schedule' | 'cancel';
  notifications: ScheduleNotificationInput[] | string[];
  timestamp: Date;
}

/**
 * NotificationBatchScheduler - Optimizes notification scheduling
 */
export class NotificationBatchScheduler {
  private static instance: NotificationBatchScheduler;
  private scheduler: NotificationScheduler;
  private pendingOperations: BatchOperation[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;
  private readonly BATCH_DELAY_MS = 500; // Wait 500ms before executing batch

  private constructor() {
    this.scheduler = new NotificationScheduler();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationBatchScheduler {
    if (!NotificationBatchScheduler.instance) {
      NotificationBatchScheduler.instance = new NotificationBatchScheduler();
    }
    return NotificationBatchScheduler.instance;
  }

  // ============================================================================
  // PRE-CALCULATION OF NOTIFICATION TIMES
  // ============================================================================

  /**
   * Pre-calculate all notification times for an entire protocol
   * This allows us to schedule everything at once and avoid repeated calculations
   *
   * Requirements: 9.1
   */
  async preCalculateProtocolSchedule(
    protocolRunId: string,
    userId: string,
    testSteps: Array<{
      id: string;
      scheduledDate: Date;
      foodName: string;
      doseAmount?: string;
    }>,
    washoutPeriods: Array<{
      id: string;
      startDate: Date;
      endDate: Date;
    }>,
    dailyReminderTime?: { hour: number; minute: number }
  ): Promise<ProtocolSchedule> {
    const notifications: PreCalculatedNotification[] = [];
    const now = new Date();

    // Calculate daily reminders for the protocol duration
    if (dailyReminderTime) {
      const protocolEndDate = this.calculateProtocolEndDate(testSteps, washoutPeriods);
      const dailyReminders = this.calculateDailyReminders(now, protocolEndDate, dailyReminderTime);
      notifications.push(...dailyReminders);
    }

    // Calculate dose reminders for all test steps
    for (const testStep of testSteps) {
      const doseReminders = this.calculateDoseReminders(testStep);
      notifications.push(...doseReminders);
    }

    // Calculate washout notifications for all washout periods
    for (const washout of washoutPeriods) {
      const washoutNotifications = this.calculateWashoutNotifications(washout, protocolRunId);
      notifications.push(...washoutNotifications);
    }

    // Calculate test start reminders
    for (const testStep of testSteps) {
      const testStartReminders = this.calculateTestStartReminders(testStep, protocolRunId);
      notifications.push(...testStartReminders);
    }

    const schedule: ProtocolSchedule = {
      protocolRunId,
      userId,
      notifications,
      calculatedAt: now,
      validUntil: this.calculateProtocolEndDate(testSteps, washoutPeriods),
    };

    // Cache the schedule
    await this.cacheProtocolSchedule(schedule);

    return schedule;
  }

  /**
   * Calculate daily reminders for the protocol duration
   */
  private calculateDailyReminders(
    startDate: Date,
    endDate: Date,
    reminderTime: { hour: number; minute: number }
  ): PreCalculatedNotification[] {
    const reminders: PreCalculatedNotification[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const reminderDate = new Date(currentDate);
      reminderDate.setHours(reminderTime.hour, reminderTime.minute, 0, 0);

      if (reminderDate > new Date()) {
        reminders.push({
          id: `daily_${reminderDate.getTime()}`,
          type: 'daily_reminder',
          title: 'Time to Log Your Symptoms',
          body: 'How are you feeling today? Take a moment to record your symptoms.',
          scheduledTime: reminderDate,
          trigger: {
            type: 'date',
            date: reminderDate,
            repeats: false,
          },
          data: {
            type: 'daily_reminder',
            relatedEntityType: 'symptom_entry',
          },
        });
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return reminders;
  }

  /**
   * Calculate dose reminders for a test step
   */
  private calculateDoseReminders(testStep: {
    id: string;
    scheduledDate: Date;
    foodName: string;
    doseAmount?: string;
  }): PreCalculatedNotification[] {
    const reminders: PreCalculatedNotification[] = [];
    const doseTime = new Date(testStep.scheduledDate);
    const now = new Date();

    // Pre-dose reminder (30 minutes before)
    const preDoseTime = new Date(doseTime);
    preDoseTime.setMinutes(preDoseTime.getMinutes() - 30);

    if (preDoseTime > now) {
      reminders.push({
        id: `pre_dose_${testStep.id}`,
        type: 'dose_reminder',
        title: 'Upcoming Dose Reminder',
        body: `Your dose of ${testStep.foodName} is coming up in 30 minutes.`,
        scheduledTime: preDoseTime,
        trigger: {
          type: 'date',
          date: preDoseTime,
          repeats: false,
        },
        data: {
          type: 'dose_reminder',
          relatedEntityId: testStep.id,
          relatedEntityType: 'test_step',
          isDoseTime: false,
        },
        relatedEntityId: testStep.id,
        relatedEntityType: 'test_step',
      });
    }

    // Dose-time reminder
    if (doseTime > now) {
      reminders.push({
        id: `dose_${testStep.id}`,
        type: 'dose_reminder',
        title: 'Time for Your Dose',
        body: `Take your dose of ${testStep.foodName}${testStep.doseAmount ? ` (${testStep.doseAmount})` : ''} now.`,
        scheduledTime: doseTime,
        trigger: {
          type: 'date',
          date: doseTime,
          repeats: false,
        },
        data: {
          type: 'dose_reminder',
          relatedEntityId: testStep.id,
          relatedEntityType: 'test_step',
          isDoseTime: true,
        },
        relatedEntityId: testStep.id,
        relatedEntityType: 'test_step',
      });
    }

    return reminders;
  }

  /**
   * Calculate washout notifications
   */
  private calculateWashoutNotifications(
    washout: {
      id: string;
      startDate: Date;
      endDate: Date;
    },
    protocolRunId: string
  ): PreCalculatedNotification[] {
    const notifications: PreCalculatedNotification[] = [];
    const now = new Date();
    const startDate = new Date(washout.startDate);
    const endDate = new Date(washout.endDate);

    const durationMs = endDate.getTime() - startDate.getTime();
    const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));

    // Washout start notification
    if (startDate > now) {
      notifications.push({
        id: `washout_start_${washout.id}`,
        type: 'washout_start',
        title: 'Washout Period Started',
        body: `Your ${durationDays}-day washout period has begun. Avoid trigger foods during this time.`,
        scheduledTime: startDate,
        trigger: {
          type: 'date',
          date: startDate,
          repeats: false,
        },
        data: {
          type: 'washout_start',
          relatedEntityId: washout.id,
          relatedEntityType: 'washout_period',
          protocolRunId,
        },
        relatedEntityId: washout.id,
        relatedEntityType: 'washout_period',
      });
    }

    // 24-hour warning
    const warningTime = new Date(endDate);
    warningTime.setHours(warningTime.getHours() - 24);

    if (warningTime > now) {
      notifications.push({
        id: `washout_warning_${washout.id}`,
        type: 'washout_warning',
        title: 'Washout Period Ending Soon',
        body: 'Your washout period ends in 24 hours. Get ready to start your next test!',
        scheduledTime: warningTime,
        trigger: {
          type: 'date',
          date: warningTime,
          repeats: false,
        },
        data: {
          type: 'washout_warning',
          relatedEntityId: washout.id,
          relatedEntityType: 'washout_period',
          protocolRunId,
        },
        relatedEntityId: washout.id,
        relatedEntityType: 'washout_period',
      });
    }

    // Washout end notification
    if (endDate > now) {
      notifications.push({
        id: `washout_end_${washout.id}`,
        type: 'washout_end',
        title: 'Washout Period Complete',
        body: 'Your washout period is over! You can now begin your next reintroduction test.',
        scheduledTime: endDate,
        trigger: {
          type: 'date',
          date: endDate,
          repeats: false,
        },
        data: {
          type: 'washout_end',
          relatedEntityId: washout.id,
          relatedEntityType: 'washout_period',
          protocolRunId,
        },
        relatedEntityId: washout.id,
        relatedEntityType: 'washout_period',
      });
    }

    return notifications;
  }

  /**
   * Calculate test start reminders
   */
  private calculateTestStartReminders(
    testStep: {
      id: string;
      scheduledDate: Date;
      foodName: string;
    },
    protocolRunId: string
  ): PreCalculatedNotification[] {
    const reminders: PreCalculatedNotification[] = [];
    const now = new Date();
    const availableDate = new Date(testStep.scheduledDate);

    // Immediate notification (2 hours after availability)
    const immediateTime = new Date(availableDate);
    immediateTime.setHours(immediateTime.getHours() + 2);

    if (immediateTime > now) {
      reminders.push({
        id: `test_start_immediate_${testStep.id}`,
        type: 'test_start',
        title: 'New Test Available',
        body: `Your next reintroduction test with ${testStep.foodName} is ready to start!`,
        scheduledTime: immediateTime,
        trigger: {
          type: 'date',
          date: immediateTime,
          repeats: false,
        },
        data: {
          type: 'test_start',
          relatedEntityId: testStep.id,
          relatedEntityType: 'test_step',
          protocolRunId,
          isFollowUp: false,
        },
        relatedEntityId: testStep.id,
        relatedEntityType: 'test_step',
      });
    }

    // Follow-up reminder (48 hours after availability)
    const followUpTime = new Date(availableDate);
    followUpTime.setHours(followUpTime.getHours() + 48);

    if (followUpTime > now) {
      reminders.push({
        id: `test_start_followup_${testStep.id}`,
        type: 'test_start',
        title: 'Test Reminder',
        body: `Don't forget to start your reintroduction test with ${testStep.foodName}. Keep your protocol on track!`,
        scheduledTime: followUpTime,
        trigger: {
          type: 'date',
          date: followUpTime,
          repeats: false,
        },
        data: {
          type: 'test_start',
          relatedEntityId: testStep.id,
          relatedEntityType: 'test_step',
          protocolRunId,
          isFollowUp: true,
        },
        relatedEntityId: testStep.id,
        relatedEntityType: 'test_step',
      });
    }

    return reminders;
  }

  /**
   * Calculate protocol end date based on test steps and washout periods
   */
  private calculateProtocolEndDate(
    testSteps: Array<{ scheduledDate: Date }>,
    washoutPeriods: Array<{ endDate: Date }>
  ): Date {
    let latestDate = new Date();

    for (const testStep of testSteps) {
      if (testStep.scheduledDate > latestDate) {
        latestDate = new Date(testStep.scheduledDate);
      }
    }

    for (const washout of washoutPeriods) {
      if (washout.endDate > latestDate) {
        latestDate = new Date(washout.endDate);
      }
    }

    // Add 7 days buffer
    latestDate.setDate(latestDate.getDate() + 7);

    return latestDate;
  }

  // ============================================================================
  // BATCH OPERATIONS
  // ============================================================================

  /**
   * Schedule all notifications from a pre-calculated protocol schedule
   * Uses batch operations to minimize API calls
   *
   * Requirements: 9.1, 9.2
   */
  async scheduleProtocol(schedule: ProtocolSchedule): Promise<string[]> {
    const inputs: ScheduleNotificationInput[] = schedule.notifications.map((notification) => ({
      title: notification.title,
      body: notification.body,
      data: notification.data,
      trigger: notification.trigger,
      sound: true,
      categoryIdentifier: notification.type,
    }));

    // Use batch scheduling from NotificationScheduler
    return await this.scheduler.scheduleMultiple(inputs);
  }

  /**
   * Add operation to batch queue
   * Operations are executed after a short delay to allow batching
   *
   * Requirements: 9.2
   */
  private addToBatch(operation: BatchOperation): void {
    this.pendingOperations.push(operation);

    // Clear existing timeout
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    // Set new timeout to execute batch
    this.batchTimeout = setTimeout(() => {
      this.executeBatch();
    }, this.BATCH_DELAY_MS);
  }

  /**
   * Execute all pending batch operations
   */
  private async executeBatch(): Promise<void> {
    if (this.pendingOperations.length === 0) {
      return;
    }

    const operations = [...this.pendingOperations];
    this.pendingOperations = [];

    // Group operations by type
    const scheduleOps = operations.filter((op) => op.type === 'schedule');
    const cancelOps = operations.filter((op) => op.type === 'cancel');

    // Execute schedule operations
    if (scheduleOps.length > 0) {
      const allNotifications = scheduleOps.flatMap(
        (op) => op.notifications as ScheduleNotificationInput[]
      );
      await this.scheduler.scheduleMultiple(allNotifications);
    }

    // Execute cancel operations
    if (cancelOps.length > 0) {
      const allIds = cancelOps.flatMap((op) => op.notifications as string[]);
      await this.scheduler.cancelMultiple(allIds);
    }
  }

  // ============================================================================
  // CACHING
  // ============================================================================

  /**
   * Cache protocol schedule to minimize recalculations
   */
  private async cacheProtocolSchedule(schedule: ProtocolSchedule): Promise<void> {
    try {
      const cacheKey = `${PROTOCOL_SCHEDULE_KEY}:${schedule.protocolRunId}`;
      await AsyncStorage.setItem(cacheKey, JSON.stringify(schedule));
    } catch (error) {
      console.error('Error caching protocol schedule:', error);
    }
  }

  /**
   * Get cached protocol schedule
   */
  async getCachedProtocolSchedule(protocolRunId: string): Promise<ProtocolSchedule | null> {
    try {
      const cacheKey = `${PROTOCOL_SCHEDULE_KEY}:${protocolRunId}`;
      const cached = await AsyncStorage.getItem(cacheKey);

      if (!cached) {
        return null;
      }

      const schedule: ProtocolSchedule = JSON.parse(cached);

      // Convert date strings back to Date objects
      schedule.calculatedAt = new Date(schedule.calculatedAt);
      schedule.validUntil = new Date(schedule.validUntil);
      schedule.notifications = schedule.notifications.map((n) => ({
        ...n,
        scheduledTime: new Date(n.scheduledTime),
        trigger: {
          ...n.trigger,
          date: n.trigger.date ? new Date(n.trigger.date) : undefined,
        },
      }));

      // Check if schedule is still valid
      if (schedule.validUntil < new Date()) {
        return null;
      }

      return schedule;
    } catch (error) {
      console.error('Error getting cached protocol schedule:', error);
      return null;
    }
  }

  /**
   * Clear cached protocol schedule
   */
  async clearProtocolScheduleCache(protocolRunId: string): Promise<void> {
    try {
      const cacheKey = `${PROTOCOL_SCHEDULE_KEY}:${protocolRunId}`;
      await AsyncStorage.removeItem(cacheKey);
    } catch (error) {
      console.error('Error clearing protocol schedule cache:', error);
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationBatchScheduler = NotificationBatchScheduler.getInstance();
