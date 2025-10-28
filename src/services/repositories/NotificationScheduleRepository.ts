import { eq, and, lte } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { notificationSchedules } from '../../db/schema';
import type {
  NotificationSchedule,
  CreateNotificationScheduleInput,
  NotificationType,
} from '../../db/schema';

/**
 * NotificationScheduleRepository
 *
 * Repository for managing NotificationSchedule entities.
 * Provides CRUD operations and queries for notification schedule data.
 *
 * Implements:
 * - create: Create a new notification schedule
 * - findById: Find a notification schedule by ID
 * - findPending: Find all pending (unsent) notifications that are due
 * - markAsSent: Mark a notification as sent
 * - delete: Delete a notification schedule by ID
 */
export class NotificationScheduleRepository extends BaseRepository<NotificationSchedule> {
  /**
   * Create a new notification schedule
   *
   * Generates ID and timestamp automatically.
   * Validates that required fields are present and values are valid.
   *
   * @param data - The notification schedule data to create
   * @returns Promise resolving to the created notification schedule
   * @throws {Error} If validation fails or database operation fails
   */
  async create(
    data: Omit<CreateNotificationScheduleInput, 'id' | 'createdAt'>
  ): Promise<NotificationSchedule> {
    try {
      // Validate required fields
      if (!data.testStepId || !data.testStepId.trim()) {
        throw new Error('Test step ID is required');
      }

      if (!data.notificationType) {
        throw new Error('Notification type is required');
      }

      if (!data.scheduledTime) {
        throw new Error('Scheduled time is required');
      }

      if (!data.message || !data.message.trim()) {
        throw new Error('Message is required');
      }

      // Validate notification type is a valid value
      const validTypes: NotificationType[] = [
        'reminder',
        'symptom_check',
        'washout_start',
        'washout_end',
      ];
      if (!validTypes.includes(data.notificationType as NotificationType)) {
        throw new Error(`Invalid notification type. Must be one of: ${validTypes.join(', ')}`);
      }

      // Create new notification schedule with generated ID and timestamp
      const newNotificationSchedule: CreateNotificationScheduleInput = {
        ...data,
        id: this.generateId(),
        sentStatus: data.sentStatus ?? false,
        createdAt: this.now(),
      };

      await this.db.insert(notificationSchedules).values(newNotificationSchedule);

      return newNotificationSchedule as NotificationSchedule;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a notification schedule by ID
   *
   * @param id - The notification schedule ID to search for
   * @returns Promise resolving to the notification schedule or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<NotificationSchedule | null> {
    try {
      const result = await this.db
        .select()
        .from(notificationSchedules)
        .where(eq(notificationSchedules.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find all pending (unsent) notifications that are due
   *
   * Returns notifications where sentStatus is false and scheduledTime is less than or equal to now.
   * Uses the sent_status and scheduled_time indexes for efficient lookup.
   * Results are ordered by scheduled time (earliest first).
   *
   * @param now - Optional current time (defaults to now). Useful for testing.
   * @returns Promise resolving to an array of pending notification schedules
   * @throws {Error} If database operation fails
   */
  async findPending(now?: Date): Promise<NotificationSchedule[]> {
    try {
      const currentTime = now || this.now();

      const result = await this.db
        .select()
        .from(notificationSchedules)
        .where(
          and(
            eq(notificationSchedules.sentStatus, false),
            lte(notificationSchedules.scheduledTime, currentTime)
          )
        )
        .orderBy(notificationSchedules.scheduledTime);

      return result;
    } catch (error) {
      this.handleError(error, 'findPending');
    }
  }

  /**
   * Mark a notification as sent
   *
   * Updates the sentStatus field to true for the specified notification.
   * This is a convenience method for the common operation of marking notifications as sent.
   *
   * @param id - The ID of the notification schedule to mark as sent
   * @returns Promise resolving to the updated notification schedule
   * @throws {Error} If notification schedule not found or database operation fails
   */
  async markAsSent(id: string): Promise<NotificationSchedule> {
    try {
      // Check if notification schedule exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`NotificationSchedule with id ${id} not found`);
      }

      // Update sent status
      await this.db
        .update(notificationSchedules)
        .set({ sentStatus: true })
        .where(eq(notificationSchedules.id, id));

      // Fetch and return updated notification schedule
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated notification schedule');
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'markAsSent');
    }
  }

  /**
   * Delete a notification schedule by ID
   *
   * @param id - The ID of the notification schedule to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If notification schedule not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if notification schedule exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`NotificationSchedule with id ${id} not found`);
      }

      await this.db.delete(notificationSchedules).where(eq(notificationSchedules.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
