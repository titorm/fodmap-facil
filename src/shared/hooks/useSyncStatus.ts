import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { SyncQueue } from '../../services/SyncQueue';

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncDate: Date | null;
  syncError: Error | null;
  syncNow: () => Promise<void>;
}

/**
 * Hook to manage data synchronization status
 *
 * Features:
 * - Monitors pending sync operations
 * - Automatically syncs when online
 * - Provides manual sync trigger
 * - Tracks last sync timestamp
 * - Reports sync errors
 *
 * @returns Sync status and control functions
 *
 * @example
 * ```tsx
 * const { isSyncing, pendingCount, syncNow } = useSyncStatus();
 *
 * return (
 *   <View>
 *     {pendingCount > 0 && (
 *       <Text>{pendingCount} changes pending sync</Text>
 *     )}
 *     <Button onPress={syncNow} disabled={isSyncing}>
 *       Sync Now
 *     </Button>
 *   </View>
 * );
 * ```
 */
export function useSyncStatus(): SyncStatus {
  const { isConnected } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    const count = SyncQueue.getPendingCount();
    const entities = await SyncQueue.findPendingEntities();
    const totalPending =
      count + entities.symptomEntries + entities.testSteps + entities.protocolRuns;
    setPendingCount(totalPending);
  }, []);

  // Update last sync date
  const updateLastSyncDate = useCallback(async () => {
    const date = await SyncQueue.getLastSyncTimestamp();
    setLastSyncDate(date);
  }, []);

  // Sync now function
  const syncNow = useCallback(async () => {
    if (!isConnected) {
      setSyncError(new Error('Cannot sync while offline'));
      return;
    }

    if (isSyncing) {
      return;
    }

    try {
      setIsSyncing(true);
      setSyncError(null);

      const result = await SyncQueue.processQueue(isConnected);

      if (result.failed > 0) {
        setSyncError(new Error(`${result.failed} operations failed to sync`));
      }

      await updatePendingCount();
      await updateLastSyncDate();
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, isSyncing, updatePendingCount, updateLastSyncDate]);

  // Initialize sync queue on mount
  useEffect(() => {
    SyncQueue.initialize().then(() => {
      updatePendingCount();
      updateLastSyncDate();
    });
  }, [updatePendingCount, updateLastSyncDate]);

  // Auto-sync when coming online
  useEffect(() => {
    if (isConnected && pendingCount > 0 && !isSyncing) {
      console.log('Device came online, triggering auto-sync');
      syncNow();
    }
  }, [isConnected, pendingCount, isSyncing, syncNow]);

  // Periodic sync check (every 5 minutes when online)
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const interval = setInterval(
      () => {
        if (pendingCount > 0 && !isSyncing) {
          console.log('Periodic sync check triggered');
          syncNow();
        }
      },
      5 * 60 * 1000
    ); // 5 minutes

    return () => clearInterval(interval);
  }, [isConnected, pendingCount, isSyncing, syncNow]);

  return {
    isSyncing,
    pendingCount,
    lastSyncDate,
    syncError,
    syncNow,
  };
}
