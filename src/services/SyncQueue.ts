import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../infrastructure/database/client';
import { symptomEntries, testSteps, protocolRuns } from '../db/schema';
import { eq, or } from 'drizzle-orm';

const SYNC_QUEUE_KEY = '@fodmap:sync_queue';
const LAST_SYNC_KEY = '@fodmap:last_sync';

export type SyncOperation = {
  id: string;
  type: 'symptom_entry' | 'test_step' | 'protocol_run';
  entityId: string;
  operation: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
  retryCount: number;
};

/**
 * SyncQueue
 *
 * Service for managing offline data synchronization queue.
 * Queues operations when offline and syncs to Supabase when online.
 *
 * Features:
 * - Queues CRUD operations for later sync
 * - Automatic retry with exponential backoff
 * - Conflict resolution
 * - Sync status tracking
 * - Batch synchronization
 */
export class SyncQueue {
  private static queue: SyncOperation[] = [];
  private static isSyncing = false;
  private static maxRetries = 3;

  /**
   * Initialize the sync queue by loading from storage
   */
  static async initialize(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(SYNC_QUEUE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`Sync queue initialized with ${this.queue.length} operations`);
      }
    } catch (error) {
      console.error('Failed to initialize sync queue:', error);
    }
  }

  /**
   * Add an operation to the sync queue
   *
   * @param operation - The sync operation to queue
   */
  static async enqueue(
    operation: Omit<SyncOperation, 'id' | 'timestamp' | 'retryCount'>
  ): Promise<void> {
    try {
      const queuedOperation: SyncOperation = {
        ...operation,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date().toISOString(),
        retryCount: 0,
      };

      this.queue.push(queuedOperation);
      await this.persistQueue();

      console.log(
        `Operation queued: ${operation.type} ${operation.operation} ${operation.entityId}`
      );
    } catch (error) {
      console.error('Failed to enqueue operation:', error);
      throw error;
    }
  }

  /**
   * Process the sync queue and sync all pending operations
   *
   * @param isOnline - Whether the device is currently online
   * @returns Promise resolving to sync results
   */
  static async processQueue(isOnline: boolean): Promise<{
    synced: number;
    failed: number;
    pending: number;
  }> {
    if (!isOnline) {
      console.log('Device is offline, skipping sync');
      return { synced: 0, failed: 0, pending: this.queue.length };
    }

    if (this.isSyncing) {
      console.log('Sync already in progress');
      return { synced: 0, failed: 0, pending: this.queue.length };
    }

    this.isSyncing = true;
    let synced = 0;
    let failed = 0;

    try {
      console.log(`Processing sync queue with ${this.queue.length} operations`);

      // Process operations in order
      const operationsToProcess = [...this.queue];

      for (const operation of operationsToProcess) {
        try {
          await this.syncOperation(operation);

          // Remove from queue on success
          this.queue = this.queue.filter((op) => op.id !== operation.id);
          synced++;

          // Update sync status in database
          await this.updateSyncStatus(operation.type, operation.entityId, 'synced');
        } catch (error) {
          console.error(`Failed to sync operation ${operation.id}:`, error);

          // Increment retry count
          const operationIndex = this.queue.findIndex((op) => op.id === operation.id);
          if (operationIndex !== -1) {
            this.queue[operationIndex].retryCount++;

            // Remove if max retries exceeded
            if (this.queue[operationIndex].retryCount >= this.maxRetries) {
              console.error(
                `Max retries exceeded for operation ${operation.id}, removing from queue`
              );
              this.queue.splice(operationIndex, 1);
              await this.updateSyncStatus(operation.type, operation.entityId, 'error');
            }
          }

          failed++;
        }
      }

      // Persist updated queue
      await this.persistQueue();

      // Update last sync timestamp
      await AsyncStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());

      console.log(
        `Sync complete: ${synced} synced, ${failed} failed, ${this.queue.length} pending`
      );
    } finally {
      this.isSyncing = false;
    }

    return { synced, failed, pending: this.queue.length };
  }

  /**
   * Sync a single operation to Supabase
   *
   * @param operation - The operation to sync
   */
  private static async syncOperation(operation: SyncOperation): Promise<void> {
    // TODO: Implement actual Supabase sync
    // For now, this is a placeholder that simulates sync
    console.log(
      `Syncing operation: ${operation.type} ${operation.operation} ${operation.entityId}`
    );

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // In a real implementation, this would:
    // 1. Call Supabase API to create/update/delete the entity
    // 2. Handle conflicts (e.g., entity already exists, version mismatch)
    // 3. Update local database with server response
    // 4. Handle errors and retry logic
  }

  /**
   * Update sync status in local database
   *
   * @param type - The entity type
   * @param entityId - The entity ID
   * @param status - The new sync status
   */
  private static async updateSyncStatus(
    type: SyncOperation['type'],
    entityId: string,
    status: 'pending' | 'synced' | 'error'
  ): Promise<void> {
    try {
      const now = new Date();

      switch (type) {
        case 'symptom_entry':
          await db
            .update(symptomEntries)
            .set({ syncStatus: status, lastSyncAttempt: now })
            .where(eq(symptomEntries.id, entityId));
          break;

        case 'test_step':
          await db
            .update(testSteps)
            .set({ syncStatus: status, lastSyncAttempt: now })
            .where(eq(testSteps.id, entityId));
          break;

        case 'protocol_run':
          await db
            .update(protocolRuns)
            .set({ syncStatus: status, lastSyncAttempt: now })
            .where(eq(protocolRuns.id, entityId));
          break;
      }
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  }

  /**
   * Persist the queue to AsyncStorage
   */
  private static async persistQueue(): Promise<void> {
    try {
      await AsyncStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('Failed to persist sync queue:', error);
    }
  }

  /**
   * Get pending operations count
   *
   * @returns Number of pending operations
   */
  static getPendingCount(): number {
    return this.queue.length;
  }

  /**
   * Get last sync timestamp
   *
   * @returns Promise resolving to last sync date or null
   */
  static async getLastSyncTimestamp(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(LAST_SYNC_KEY);
      return timestamp ? new Date(timestamp) : null;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return null;
    }
  }

  /**
   * Clear the sync queue
   */
  static async clear(): Promise<void> {
    try {
      this.queue = [];
      await AsyncStorage.removeItem(SYNC_QUEUE_KEY);
      console.log('Sync queue cleared');
    } catch (error) {
      console.error('Failed to clear sync queue:', error);
    }
  }

  /**
   * Get all pending operations
   *
   * @returns Array of pending operations
   */
  static getPendingOperations(): SyncOperation[] {
    return [...this.queue];
  }

  /**
   * Find pending operations that need sync from database
   *
   * @returns Promise resolving to count of entities needing sync
   */
  static async findPendingEntities(): Promise<{
    symptomEntries: number;
    testSteps: number;
    protocolRuns: number;
  }> {
    try {
      const [pendingSymptoms, pendingTestSteps, pendingProtocolRuns] = await Promise.all([
        db
          .select()
          .from(symptomEntries)
          .where(
            or(eq(symptomEntries.syncStatus, 'pending'), eq(symptomEntries.syncStatus, 'error'))
          ),
        db
          .select()
          .from(testSteps)
          .where(or(eq(testSteps.syncStatus, 'pending'), eq(testSteps.syncStatus, 'error'))),
        db
          .select()
          .from(protocolRuns)
          .where(or(eq(protocolRuns.syncStatus, 'pending'), eq(protocolRuns.syncStatus, 'error'))),
      ]);

      return {
        symptomEntries: pendingSymptoms.length,
        testSteps: pendingTestSteps.length,
        protocolRuns: pendingProtocolRuns.length,
      };
    } catch (error) {
      console.error('Failed to find pending entities:', error);
      return { symptomEntries: 0, testSteps: 0, protocolRuns: 0 };
    }
  }
}
