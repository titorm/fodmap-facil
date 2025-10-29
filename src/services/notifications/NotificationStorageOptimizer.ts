/**
 * Notification Storage Optimizer
 *
 * Optimizes AsyncStorage usage for notifications by compressing data,
 * implementing automatic cleanup, and lazy-loading history
 *
 * Requirements: 10.5
 * Task: 15.2 - Implement storage optimization
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationHistoryRepository } from './NotificationHistoryRepository';
import type { NotificationHistoryEntry, NotificationType } from './types';

const COMPRESSED_HISTORY_KEY = '@notifications:compressed_history';
const HISTORY_INDEX_KEY = '@notifications:history_index';
const CLEANUP_SCHEDULE_KEY = '@notifications:cleanup_schedule';

/**
 * Compressed notification history entry
 * Uses shorter keys and removes redundant data
 */
interface CompressedHistoryEntry {
  i: string; // id
  u: string; // userId
  t: NotificationType; // type
  ti: string; // title
  b: string; // body
  s: number; // scheduledTime (timestamp)
  d: number | null; // deliveredTime (timestamp)
  a: number | null; // actionedTime (timestamp)
  ac: string | null; // action
  r: string | null; // relatedEntityId
  rt: string | null; // relatedEntityType
  c: number; // createdAt (timestamp)
}

/**
 * History index for fast lookups without loading all data
 */
interface HistoryIndex {
  totalEntries: number;
  entriesByType: Record<NotificationType, number>;
  oldestEntry: number; // timestamp
  newestEntry: number; // timestamp
  lastUpdated: number; // timestamp
}

/**
 * Cleanup schedule configuration
 */
interface CleanupSchedule {
  lastCleanup: Date;
  nextCleanup: Date;
  daysToKeep: number;
  autoCleanupEnabled: boolean;
}

/**
 * NotificationStorageOptimizer - Optimizes notification storage
 */
export class NotificationStorageOptimizer {
  private static instance: NotificationStorageOptimizer;
  private historyRepository: NotificationHistoryRepository;
  private historyCache: Map<string, NotificationHistoryEntry[]> = new Map();
  private readonly CACHE_SIZE_LIMIT = 100; // Maximum entries to keep in memory
  private readonly CLEANUP_INTERVAL_DAYS = 1; // Run cleanup daily

  private constructor() {
    this.historyRepository = NotificationHistoryRepository.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationStorageOptimizer {
    if (!NotificationStorageOptimizer.instance) {
      NotificationStorageOptimizer.instance = new NotificationStorageOptimizer();
    }
    return NotificationStorageOptimizer.instance;
  }

  // ============================================================================
  // DATA COMPRESSION
  // ============================================================================

  /**
   * Compress notification history entry to reduce storage size
   * Reduces field names and converts dates to timestamps
   *
   * Requirements: 10.5
   */
  private compressEntry(entry: NotificationHistoryEntry): CompressedHistoryEntry {
    return {
      i: entry.id,
      u: entry.userId,
      t: entry.notificationType,
      ti: entry.title,
      b: entry.body,
      s: entry.scheduledTime.getTime(),
      d: entry.deliveredTime ? entry.deliveredTime.getTime() : null,
      a: entry.actionedTime ? entry.actionedTime.getTime() : null,
      ac: entry.action,
      r: entry.relatedEntityId,
      rt: entry.relatedEntityType,
      c: entry.createdAt.getTime(),
    };
  }

  /**
   * Decompress notification history entry
   */
  private decompressEntry(compressed: CompressedHistoryEntry): NotificationHistoryEntry {
    return {
      id: compressed.i,
      userId: compressed.u,
      notificationType: compressed.t,
      title: compressed.ti,
      body: compressed.b,
      scheduledTime: new Date(compressed.s),
      deliveredTime: compressed.d ? new Date(compressed.d) : null,
      actionedTime: compressed.a ? new Date(compressed.a) : null,
      action: compressed.ac,
      relatedEntityId: compressed.r,
      relatedEntityType: compressed.rt,
      createdAt: new Date(compressed.c),
    };
  }

  /**
   * Store compressed notification history in AsyncStorage
   * This is used as a local backup/cache
   *
   * Requirements: 10.5
   */
  async storeCompressedHistory(entries: NotificationHistoryEntry[]): Promise<void> {
    try {
      const compressed = entries.map((entry) => this.compressEntry(entry));
      const json = JSON.stringify(compressed);

      // Store compressed data
      await AsyncStorage.setItem(COMPRESSED_HISTORY_KEY, json);

      // Update index
      await this.updateHistoryIndex(entries);

      console.log(`Stored ${entries.length} compressed history entries (${json.length} bytes)`);
    } catch (error) {
      console.error('Error storing compressed history:', error);
      throw error;
    }
  }

  /**
   * Load compressed notification history from AsyncStorage
   */
  async loadCompressedHistory(): Promise<NotificationHistoryEntry[]> {
    try {
      const json = await AsyncStorage.getItem(COMPRESSED_HISTORY_KEY);

      if (!json) {
        return [];
      }

      const compressed: CompressedHistoryEntry[] = JSON.parse(json);
      return compressed.map((entry) => this.decompressEntry(entry));
    } catch (error) {
      console.error('Error loading compressed history:', error);
      return [];
    }
  }

  // ============================================================================
  // HISTORY INDEX
  // ============================================================================

  /**
   * Update history index for fast lookups
   * Index allows querying without loading all history data
   *
   * Requirements: 10.5
   */
  private async updateHistoryIndex(entries: NotificationHistoryEntry[]): Promise<void> {
    try {
      if (entries.length === 0) {
        return;
      }

      const entriesByType: Record<string, number> = {};
      let oldestEntry = entries[0].createdAt.getTime();
      let newestEntry = entries[0].createdAt.getTime();

      for (const entry of entries) {
        // Count by type
        entriesByType[entry.notificationType] = (entriesByType[entry.notificationType] || 0) + 1;

        // Track oldest and newest
        const timestamp = entry.createdAt.getTime();
        if (timestamp < oldestEntry) {
          oldestEntry = timestamp;
        }
        if (timestamp > newestEntry) {
          newestEntry = timestamp;
        }
      }

      const index: HistoryIndex = {
        totalEntries: entries.length,
        entriesByType: entriesByType as Record<NotificationType, number>,
        oldestEntry,
        newestEntry,
        lastUpdated: Date.now(),
      };

      await AsyncStorage.setItem(HISTORY_INDEX_KEY, JSON.stringify(index));
    } catch (error) {
      console.error('Error updating history index:', error);
    }
  }

  /**
   * Get history index
   */
  async getHistoryIndex(): Promise<HistoryIndex | null> {
    try {
      const json = await AsyncStorage.getItem(HISTORY_INDEX_KEY);

      if (!json) {
        return null;
      }

      return JSON.parse(json);
    } catch (error) {
      console.error('Error getting history index:', error);
      return null;
    }
  }

  // ============================================================================
  // LAZY LOADING
  // ============================================================================

  /**
   * Lazy-load notification history on demand
   * Only loads what's needed, uses cache for repeated requests
   *
   * Requirements: 10.5
   */
  async lazyLoadHistory(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: NotificationType;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<NotificationHistoryEntry[]> {
    const cacheKey = this.generateCacheKey(userId, options);

    // Check cache first
    if (this.historyCache.has(cacheKey)) {
      console.log('Returning cached history');
      return this.historyCache.get(cacheKey)!;
    }

    try {
      // Load from Appwrite repository
      const entries = await this.historyRepository.list(
        {
          userId,
          notificationType: options.type,
          startDate: options.startDate,
          endDate: options.endDate,
        },
        options.limit || 50
      );

      // Apply offset if specified
      const offsetEntries = options.offset ? entries.slice(options.offset) : entries;

      // Cache the result
      this.cacheHistory(cacheKey, offsetEntries);

      return offsetEntries;
    } catch (error) {
      console.error('Error lazy-loading history:', error);

      // Fallback to compressed local storage
      const compressed = await this.loadCompressedHistory();
      return this.filterHistory(compressed, options);
    }
  }

  /**
   * Filter history entries based on options
   */
  private filterHistory(
    entries: NotificationHistoryEntry[],
    options: {
      limit?: number;
      offset?: number;
      type?: NotificationType;
      startDate?: Date;
      endDate?: Date;
    }
  ): NotificationHistoryEntry[] {
    let filtered = entries;

    // Filter by type
    if (options.type) {
      filtered = filtered.filter((e) => e.notificationType === options.type);
    }

    // Filter by date range
    if (options.startDate) {
      filtered = filtered.filter((e) => e.createdAt >= options.startDate!);
    }

    if (options.endDate) {
      filtered = filtered.filter((e) => e.createdAt <= options.endDate!);
    }

    // Apply offset and limit
    const offset = options.offset || 0;
    const limit = options.limit || 50;

    return filtered.slice(offset, offset + limit);
  }

  /**
   * Generate cache key for history query
   */
  private generateCacheKey(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      type?: NotificationType;
      startDate?: Date;
      endDate?: Date;
    }
  ): string {
    return `${userId}_${options.type || 'all'}_${options.limit || 50}_${options.offset || 0}_${options.startDate?.getTime() || 'none'}_${options.endDate?.getTime() || 'none'}`;
  }

  /**
   * Cache history entries in memory
   */
  private cacheHistory(key: string, entries: NotificationHistoryEntry[]): void {
    // Limit cache size
    if (this.historyCache.size >= this.CACHE_SIZE_LIMIT) {
      // Remove oldest entry
      const firstKey = this.historyCache.keys().next().value;
      this.historyCache.delete(firstKey);
    }

    this.historyCache.set(key, entries);
  }

  /**
   * Clear history cache
   */
  clearHistoryCache(): void {
    this.historyCache.clear();
  }

  // ============================================================================
  // AUTOMATIC CLEANUP
  // ============================================================================

  /**
   * Initialize automatic cleanup of old notification history
   * Runs cleanup on a schedule to keep storage size manageable
   *
   * Requirements: 10.5
   */
  async initializeAutoCleanup(daysToKeep: number = 30): Promise<void> {
    try {
      const schedule = await this.getCleanupSchedule();

      if (!schedule) {
        // Create initial schedule
        await this.setCleanupSchedule({
          lastCleanup: new Date(),
          nextCleanup: this.calculateNextCleanup(new Date()),
          daysToKeep,
          autoCleanupEnabled: true,
        });

        // Run initial cleanup
        await this.runCleanup(daysToKeep);
      } else if (schedule.autoCleanupEnabled && new Date() >= schedule.nextCleanup) {
        // Run scheduled cleanup
        await this.runCleanup(schedule.daysToKeep);

        // Update schedule
        await this.setCleanupSchedule({
          ...schedule,
          lastCleanup: new Date(),
          nextCleanup: this.calculateNextCleanup(new Date()),
        });
      }
    } catch (error) {
      console.error('Error initializing auto cleanup:', error);
    }
  }

  /**
   * Run cleanup of old notification history
   */
  async runCleanup(daysToKeep: number = 30): Promise<number> {
    try {
      console.log(`Running notification history cleanup (keeping ${daysToKeep} days)`);

      // Clean up Appwrite repository
      const deletedCount = await this.historyRepository.deleteOldEntries(daysToKeep);

      // Clean up compressed local storage
      await this.cleanupCompressedHistory(daysToKeep);

      // Clear cache
      this.clearHistoryCache();

      console.log(`Cleaned up ${deletedCount} old notification history entries`);

      return deletedCount;
    } catch (error) {
      console.error('Error running cleanup:', error);
      return 0;
    }
  }

  /**
   * Clean up compressed history in AsyncStorage
   */
  private async cleanupCompressedHistory(daysToKeep: number): Promise<void> {
    try {
      const entries = await this.loadCompressedHistory();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const filtered = entries.filter((entry) => entry.createdAt >= cutoffDate);

      await this.storeCompressedHistory(filtered);
    } catch (error) {
      console.error('Error cleaning up compressed history:', error);
    }
  }

  /**
   * Calculate next cleanup time
   */
  private calculateNextCleanup(lastCleanup: Date): Date {
    const next = new Date(lastCleanup);
    next.setDate(next.getDate() + this.CLEANUP_INTERVAL_DAYS);
    return next;
  }

  /**
   * Get cleanup schedule
   */
  async getCleanupSchedule(): Promise<CleanupSchedule | null> {
    try {
      const json = await AsyncStorage.getItem(CLEANUP_SCHEDULE_KEY);

      if (!json) {
        return null;
      }

      const schedule = JSON.parse(json);
      return {
        ...schedule,
        lastCleanup: new Date(schedule.lastCleanup),
        nextCleanup: new Date(schedule.nextCleanup),
      };
    } catch (error) {
      console.error('Error getting cleanup schedule:', error);
      return null;
    }
  }

  /**
   * Set cleanup schedule
   */
  async setCleanupSchedule(schedule: CleanupSchedule): Promise<void> {
    try {
      await AsyncStorage.setItem(CLEANUP_SCHEDULE_KEY, JSON.stringify(schedule));
    } catch (error) {
      console.error('Error setting cleanup schedule:', error);
    }
  }

  /**
   * Enable or disable automatic cleanup
   */
  async setAutoCleanupEnabled(enabled: boolean): Promise<void> {
    try {
      const schedule = await this.getCleanupSchedule();

      if (schedule) {
        await this.setCleanupSchedule({
          ...schedule,
          autoCleanupEnabled: enabled,
        });
      }
    } catch (error) {
      console.error('Error setting auto cleanup enabled:', error);
    }
  }

  // ============================================================================
  // STORAGE STATISTICS
  // ============================================================================

  /**
   * Get storage statistics for monitoring
   */
  async getStorageStatistics(): Promise<{
    compressedHistorySize: number;
    indexSize: number;
    totalEntries: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
    estimatedSavings: number;
  }> {
    try {
      const compressedJson = await AsyncStorage.getItem(COMPRESSED_HISTORY_KEY);
      const indexJson = await AsyncStorage.getItem(HISTORY_INDEX_KEY);
      const index = await this.getHistoryIndex();

      const compressedSize = compressedJson ? compressedJson.length : 0;
      const indexSize = indexJson ? indexJson.length : 0;

      // Estimate uncompressed size (rough estimate: 2x compressed size)
      const estimatedUncompressedSize = compressedSize * 2;
      const estimatedSavings = estimatedUncompressedSize - compressedSize;

      return {
        compressedHistorySize: compressedSize,
        indexSize,
        totalEntries: index?.totalEntries || 0,
        oldestEntry: index ? new Date(index.oldestEntry) : null,
        newestEntry: index ? new Date(index.newestEntry) : null,
        estimatedSavings,
      };
    } catch (error) {
      console.error('Error getting storage statistics:', error);
      return {
        compressedHistorySize: 0,
        indexSize: 0,
        totalEntries: 0,
        oldestEntry: null,
        newestEntry: null,
        estimatedSavings: 0,
      };
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationStorageOptimizer = NotificationStorageOptimizer.getInstance();
