/**
 * Notification Retry Queue
 *
 * Handles retry logic with exponential backoff for failed notification operations
 * Requirements: 9.2
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationError, NotificationErrorCode } from './types';
import type { ScheduleNotificationInput } from './types';

const RETRY_QUEUE_KEY = '@notifications:retry_queue';
const MAX_RETRIES = 3;
const INITIAL_DELAY_MS = 1000; // 1 second
const MAX_DELAY_MS = 30000; // 30 seconds

export interface RetryOperation {
  id: string;
  type: 'schedule' | 'cancel' | 'sync';
  data: any;
  attempts: number;
  lastAttempt: Date;
  nextRetry: Date;
  error?: string;
  createdAt: Date;
}

/**
 * NotificationRetryQueue - Manages retry logic for failed operations
 */
export class NotificationRetryQueue {
  private static instance: NotificationRetryQueue;
  private processing: boolean = false;
  private retryTimer: NodeJS.Timeout | null = null;

  private constructor() {
    // Initialize retry processing
    this.startRetryProcessor();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationRetryQueue {
    if (!NotificationRetryQueue.instance) {
      NotificationRetryQueue.instance = new NotificationRetryQueue();
    }
    return NotificationRetryQueue.instance;
  }

  /**
   * Add a failed operation to the retry queue
   * Requirements: 9.2
   */
  async enqueue(type: 'schedule' | 'cancel' | 'sync', data: any, error?: Error): Promise<void> {
    try {
      const queue = await this.getQueue();

      const operation: RetryOperation = {
        id: `retry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        data,
        attempts: 0,
        lastAttempt: new Date(),
        nextRetry: new Date(Date.now() + INITIAL_DELAY_MS),
        error: error?.message,
        createdAt: new Date(),
      };

      queue.push(operation);
      await this.saveQueue(queue);

      console.log(`Enqueued ${type} operation for retry:`, operation.id);

      // Trigger immediate processing check
      this.processQueue();
    } catch (error) {
      console.error('Error enqueueing retry operation:', error);
    }
  }

  /**
   * Process the retry queue with exponential backoff
   * Requirements: 9.2
   */
  async processQueue(): Promise<void> {
    if (this.processing) {
      return; // Already processing
    }

    this.processing = true;

    try {
      const queue = await this.getQueue();
      const now = new Date();

      // Filter operations that are ready to retry
      const readyToRetry = queue.filter((op) => new Date(op.nextRetry) <= now);

      if (readyToRetry.length === 0) {
        this.processing = false;
        return;
      }

      console.log(`Processing ${readyToRetry.length} retry operations`);

      for (const operation of readyToRetry) {
        try {
          await this.retryOperation(operation);

          // Remove from queue on success
          await this.removeFromQueue(operation.id);
        } catch (error) {
          console.error(`Retry failed for operation ${operation.id}:`, error);

          // Update operation with new retry time
          operation.attempts++;
          operation.lastAttempt = new Date();

          if (operation.attempts >= MAX_RETRIES) {
            // Max retries reached, remove from queue
            console.warn(`Max retries reached for operation ${operation.id}, removing from queue`);
            await this.removeFromQueue(operation.id);
          } else {
            // Calculate next retry time with exponential backoff
            const delay = this.calculateBackoffDelay(operation.attempts);
            operation.nextRetry = new Date(Date.now() + delay);
            operation.error = error instanceof Error ? error.message : String(error);

            // Update in queue
            await this.updateInQueue(operation);
          }
        }
      }
    } catch (error) {
      console.error('Error processing retry queue:', error);
    } finally {
      this.processing = false;
    }
  }

  /**
   * Retry a specific operation
   * Requirements: 9.2
   */
  private async retryOperation(operation: RetryOperation): Promise<void> {
    console.log(`Retrying ${operation.type} operation (attempt ${operation.attempts + 1})`);

    switch (operation.type) {
      case 'schedule':
        await this.retrySchedule(operation.data);
        break;

      case 'cancel':
        await this.retryCancel(operation.data);
        break;

      case 'sync':
        await this.retrySync(operation.data);
        break;

      default:
        throw new Error(`Unknown operation type: ${operation.type}`);
    }
  }

  /**
   * Retry a schedule operation
   */
  private async retrySchedule(data: ScheduleNotificationInput): Promise<void> {
    // Import NotificationService dynamically to avoid circular dependency
    const { NotificationService } = await import('./NotificationService');
    const service = NotificationService.getInstance();

    await service.schedule(data);
  }

  /**
   * Retry a cancel operation
   */
  private async retryCancel(data: { notificationId: string }): Promise<void> {
    const { NotificationService } = await import('./NotificationService');
    const service = NotificationService.getInstance();

    await service.cancel(data.notificationId);
  }

  /**
   * Retry a sync operation
   */
  private async retrySync(data: any): Promise<void> {
    // Import sync utilities dynamically
    const { syncNotificationPreferences } = await import('./NotificationSync');
    await syncNotificationPreferences(data);
  }

  /**
   * Calculate exponential backoff delay
   * Requirements: 9.2
   */
  private calculateBackoffDelay(attempts: number): number {
    // Exponential backoff: delay = initialDelay * 2^attempts
    const delay = INITIAL_DELAY_MS * Math.pow(2, attempts);

    // Cap at max delay
    return Math.min(delay, MAX_DELAY_MS);
  }

  /**
   * Start the retry processor (runs periodically)
   */
  private startRetryProcessor(): void {
    // Process queue every 5 seconds
    this.retryTimer = setInterval(() => {
      this.processQueue();
    }, 5000);
  }

  /**
   * Stop the retry processor
   */
  stopRetryProcessor(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Get the current retry queue
   */
  private async getQueue(): Promise<RetryOperation[]> {
    try {
      const queueJson = await AsyncStorage.getItem(RETRY_QUEUE_KEY);
      if (!queueJson) return [];

      const queue = JSON.parse(queueJson);

      // Convert date strings back to Date objects
      return queue.map((op: any) => ({
        ...op,
        lastAttempt: new Date(op.lastAttempt),
        nextRetry: new Date(op.nextRetry),
        createdAt: new Date(op.createdAt),
      }));
    } catch (error) {
      console.error('Error getting retry queue:', error);
      return [];
    }
  }

  /**
   * Save the retry queue
   */
  private async saveQueue(queue: RetryOperation[]): Promise<void> {
    try {
      await AsyncStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error('Error saving retry queue:', error);
      throw new NotificationError(
        NotificationErrorCode.STORAGE_ERROR,
        'Failed to save retry queue',
        error
      );
    }
  }

  /**
   * Remove an operation from the queue
   */
  private async removeFromQueue(operationId: string): Promise<void> {
    try {
      const queue = await this.getQueue();
      const filtered = queue.filter((op) => op.id !== operationId);
      await this.saveQueue(filtered);
    } catch (error) {
      console.error('Error removing from retry queue:', error);
    }
  }

  /**
   * Update an operation in the queue
   */
  private async updateInQueue(operation: RetryOperation): Promise<void> {
    try {
      const queue = await this.getQueue();
      const index = queue.findIndex((op) => op.id === operation.id);

      if (index !== -1) {
        queue[index] = operation;
        await this.saveQueue(queue);
      }
    } catch (error) {
      console.error('Error updating retry queue:', error);
    }
  }

  /**
   * Get queue status for debugging
   */
  async getQueueStatus(): Promise<{
    total: number;
    pending: number;
    operations: RetryOperation[];
  }> {
    const queue = await this.getQueue();
    const now = new Date();
    const pending = queue.filter((op) => new Date(op.nextRetry) <= now);

    return {
      total: queue.length,
      pending: pending.length,
      operations: queue,
    };
  }

  /**
   * Clear the entire retry queue
   */
  async clearQueue(): Promise<void> {
    try {
      await AsyncStorage.removeItem(RETRY_QUEUE_KEY);
      console.log('Retry queue cleared');
    } catch (error) {
      console.error('Error clearing retry queue:', error);
    }
  }

  /**
   * Retry all failed operations immediately (useful for network reconnect)
   * Requirements: 9.2
   */
  async retryAllImmediately(): Promise<void> {
    try {
      const queue = await this.getQueue();

      // Set all operations to retry immediately
      const updated = queue.map((op) => ({
        ...op,
        nextRetry: new Date(),
      }));

      await this.saveQueue(updated);

      // Process the queue
      await this.processQueue();
    } catch (error) {
      console.error('Error retrying all operations:', error);
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationRetryQueue = NotificationRetryQueue.getInstance();
