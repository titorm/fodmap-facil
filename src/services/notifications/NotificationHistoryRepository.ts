/**
 * Notification History Repository
 *
 * Repository for managing notification history entries in Appwrite TablesDB
 * Tracks notification deliveries and user actions for adherence analysis
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

import { tablesDB, DATABASE_ID, Query, ID } from '../../infrastructure/api/appwrite';
import type { NotificationHistoryEntry, NotificationType, NotificationAction } from './types';

// Table ID for notification history (will be added to .env)
const NOTIFICATION_HISTORY_TABLE_ID =
  process.env.EXPO_PUBLIC_APPWRITE_TABLE_NOTIFICATION_HISTORY_ID || '';

/**
 * Input type for creating a notification history entry
 */
export interface CreateNotificationHistoryInput {
  userId: string;
  notificationType: NotificationType;
  title: string;
  body: string;
  scheduledTime: Date;
  deliveredTime?: Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

/**
 * Input type for updating a notification history entry
 */
export interface UpdateNotificationHistoryInput {
  actionedTime?: Date;
  action?: NotificationAction;
}

/**
 * Filter options for listing notification history
 */
export interface NotificationHistoryFilters {
  userId?: string;
  notificationType?: NotificationType;
  startDate?: Date;
  endDate?: Date;
  hasAction?: boolean;
}

/**
 * NotificationHistoryRepository - Manages notification history in Appwrite
 */
export class NotificationHistoryRepository {
  private static instance: NotificationHistoryRepository;

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationHistoryRepository {
    if (!NotificationHistoryRepository.instance) {
      NotificationHistoryRepository.instance = new NotificationHistoryRepository();
    }
    return NotificationHistoryRepository.instance;
  }

  /**
   * Create a new notification history entry
   * Requirements: 10.1
   *
   * @param input - Notification history data
   * @returns Created notification history entry
   */
  async create(input: CreateNotificationHistoryInput): Promise<NotificationHistoryEntry> {
    try {
      const now = new Date();

      const data = {
        userId: input.userId,
        notificationType: input.notificationType,
        title: input.title,
        body: input.body,
        scheduledTime: input.scheduledTime.toISOString(),
        deliveredTime: input.deliveredTime?.toISOString() || null,
        actionedTime: null,
        action: null,
        relatedEntityId: input.relatedEntityId || null,
        relatedEntityType: input.relatedEntityType || null,
        createdAt: now.toISOString(),
      };

      const response = await tablesDB.createRow(
        DATABASE_ID,
        NOTIFICATION_HISTORY_TABLE_ID,
        ID.unique(),
        data
      );

      return this.mapToEntity(response);
    } catch (error) {
      console.error('Error creating notification history entry:', error);
      throw new Error('Failed to create notification history entry');
    }
  }

  /**
   * Update a notification history entry to track actions
   * Requirements: 10.3
   *
   * @param id - Notification history entry ID
   * @param input - Update data
   * @returns Updated notification history entry
   */
  async update(
    id: string,
    input: UpdateNotificationHistoryInput
  ): Promise<NotificationHistoryEntry> {
    try {
      const data: Record<string, any> = {};

      if (input.actionedTime) {
        data.actionedTime = input.actionedTime.toISOString();
      }

      if (input.action) {
        data.action = input.action;
      }

      const response = await tablesDB.updateRow(
        DATABASE_ID,
        NOTIFICATION_HISTORY_TABLE_ID,
        id,
        data
      );

      return this.mapToEntity(response);
    } catch (error) {
      console.error('Error updating notification history entry:', error);
      throw new Error('Failed to update notification history entry');
    }
  }

  /**
   * List notification history entries with optional filtering
   * Requirements: 10.2, 10.4
   *
   * @param filters - Filter options
   * @param limit - Maximum number of entries to return (default: 100)
   * @returns Array of notification history entries
   */
  async list(
    filters: NotificationHistoryFilters = {},
    limit: number = 100
  ): Promise<NotificationHistoryEntry[]> {
    try {
      const queries: string[] = [];

      // Filter by user ID
      if (filters.userId) {
        queries.push(Query.equal('userId', filters.userId));
      }

      // Filter by notification type
      if (filters.notificationType) {
        queries.push(Query.equal('notificationType', filters.notificationType));
      }

      // Filter by date range
      if (filters.startDate) {
        queries.push(Query.greaterThanEqual('scheduledTime', filters.startDate.toISOString()));
      }

      if (filters.endDate) {
        queries.push(Query.lessThanEqual('scheduledTime', filters.endDate.toISOString()));
      }

      // Filter by action status
      if (filters.hasAction !== undefined) {
        if (filters.hasAction) {
          queries.push(Query.isNotNull('action'));
        } else {
          queries.push(Query.isNull('action'));
        }
      }

      // Add limit and ordering
      queries.push(Query.limit(limit));
      queries.push(Query.orderDesc('scheduledTime'));

      const response = await tablesDB.listRows(DATABASE_ID, NOTIFICATION_HISTORY_TABLE_ID, queries);

      return response.rows.map((row) => this.mapToEntity(row));
    } catch (error) {
      console.error('Error listing notification history:', error);
      throw new Error('Failed to list notification history');
    }
  }

  /**
   * Get a single notification history entry by ID
   *
   * @param id - Notification history entry ID
   * @returns Notification history entry or null if not found
   */
  async getById(id: string): Promise<NotificationHistoryEntry | null> {
    try {
      const response = await tablesDB.getRow(DATABASE_ID, NOTIFICATION_HISTORY_TABLE_ID, id);
      return this.mapToEntity(response);
    } catch (error) {
      console.error('Error getting notification history entry:', error);
      return null;
    }
  }

  /**
   * Delete old notification history entries (older than specified days)
   * Requirements: 10.5
   *
   * @param daysToKeep - Number of days to keep (default: 30)
   * @returns Number of entries deleted
   */
  async deleteOldEntries(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Find entries older than cutoff date
      const queries = [
        Query.lessThan('createdAt', cutoffDate.toISOString()),
        Query.limit(100), // Process in batches
      ];

      const response = await tablesDB.listRows(DATABASE_ID, NOTIFICATION_HISTORY_TABLE_ID, queries);

      let deletedCount = 0;

      // Delete each entry
      for (const row of response.rows) {
        try {
          await tablesDB.deleteRow(DATABASE_ID, NOTIFICATION_HISTORY_TABLE_ID, row.$id);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting notification history entry ${row.$id}:`, error);
          // Continue with other deletions
        }
      }

      return deletedCount;
    } catch (error) {
      console.error('Error deleting old notification history entries:', error);
      throw new Error('Failed to delete old notification history entries');
    }
  }

  /**
   * Delete a specific notification history entry
   *
   * @param id - Notification history entry ID
   */
  async delete(id: string): Promise<void> {
    try {
      await tablesDB.deleteRow(DATABASE_ID, NOTIFICATION_HISTORY_TABLE_ID, id);
    } catch (error) {
      console.error('Error deleting notification history entry:', error);
      throw new Error('Failed to delete notification history entry');
    }
  }

  /**
   * Get notification history for a specific related entity
   *
   * @param entityId - Related entity ID
   * @param entityType - Related entity type
   * @returns Array of notification history entries
   */
  async getByRelatedEntity(
    entityId: string,
    entityType: string
  ): Promise<NotificationHistoryEntry[]> {
    try {
      const queries = [
        Query.equal('relatedEntityId', entityId),
        Query.equal('relatedEntityType', entityType),
        Query.orderDesc('scheduledTime'),
        Query.limit(50),
      ];

      const response = await tablesDB.listRows(DATABASE_ID, NOTIFICATION_HISTORY_TABLE_ID, queries);

      return response.rows.map((row) => this.mapToEntity(row));
    } catch (error) {
      console.error('Error getting notification history by related entity:', error);
      throw new Error('Failed to get notification history by related entity');
    }
  }

  /**
   * Get notification statistics for a user
   *
   * @param userId - User ID
   * @param days - Number of days to analyze (default: 30)
   * @returns Notification statistics
   */
  async getStatistics(
    userId: string,
    days: number = 30
  ): Promise<{
    totalDelivered: number;
    totalActioned: number;
    actionRate: number;
    byType: Record<NotificationType, { delivered: number; actioned: number }>;
  }> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const entries = await this.list(
        {
          userId,
          startDate,
        },
        1000 // Get more entries for statistics
      );

      const totalDelivered = entries.filter((e) => e.deliveredTime !== null).length;
      const totalActioned = entries.filter((e) => e.action !== null).length;
      const actionRate = totalDelivered > 0 ? (totalActioned / totalDelivered) * 100 : 0;

      // Group by type
      const byType: Record<string, { delivered: number; actioned: number }> = {};

      for (const entry of entries) {
        if (!byType[entry.notificationType]) {
          byType[entry.notificationType] = { delivered: 0, actioned: 0 };
        }

        if (entry.deliveredTime) {
          byType[entry.notificationType].delivered++;
        }

        if (entry.action) {
          byType[entry.notificationType].actioned++;
        }
      }

      return {
        totalDelivered,
        totalActioned,
        actionRate,
        byType: byType as Record<NotificationType, { delivered: number; actioned: number }>,
      };
    } catch (error) {
      console.error('Error getting notification statistics:', error);
      throw new Error('Failed to get notification statistics');
    }
  }

  /**
   * Map Appwrite row to NotificationHistoryEntry entity
   */
  private mapToEntity(row: any): NotificationHistoryEntry {
    return {
      id: row.$id,
      userId: row.userId,
      notificationType: row.notificationType as NotificationType,
      title: row.title,
      body: row.body,
      scheduledTime: new Date(row.scheduledTime),
      deliveredTime: row.deliveredTime ? new Date(row.deliveredTime) : null,
      actionedTime: row.actionedTime ? new Date(row.actionedTime) : null,
      action: row.action as NotificationAction | null,
      relatedEntityId: row.relatedEntityId || null,
      relatedEntityType: row.relatedEntityType || null,
      createdAt: new Date(row.createdAt),
    };
  }
}

// Export singleton instance
export const notificationHistoryRepository = NotificationHistoryRepository.getInstance();
