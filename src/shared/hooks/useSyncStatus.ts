import { useState, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SyncStatus {
  isSyncing: boolean;
  pendingCount: number;
  lastSyncDate: Date | null;
  syncError: Error | null;
  syncNow: () => Promise<void>;
}

const LAST_SYNC_KEY = '@fodmap_last_sync';

/**
 * Hook to manage data synchronization status
 *
 * Note: With Appwrite, sync is handled automatically by the backend.
 * This hook provides a simplified interface for monitoring connectivity
 * and triggering manual refreshes.
 *
 * @returns Sync status and control functions
 *
 * @example
 * ```tsx
 * const { isSyncing, syncNow } = useSyncStatus();
 *
 * return (
 *   <View>
 *     <Button onPress={syncNow} disabled={isSyncing}>
 *       Refresh Data
 *     </Button>
 *   </View>
 * );
 * ```
 */
export function useSyncStatus(): SyncStatus {
  const { isConnected } = useNetworkStatus();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncDate, setLastSyncDate] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // Sync now function - with Appwrite, this is just a refresh trigger
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

      // Update last sync timestamp
      const now = new Date();
      await AsyncStorage.setItem(LAST_SYNC_KEY, now.toISOString());
      setLastSyncDate(now);

      // With Appwrite, data is automatically synced
      // This is just a placeholder for UI feedback
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncError(error instanceof Error ? error : new Error('Sync failed'));
    } finally {
      setIsSyncing(false);
    }
  }, [isConnected, isSyncing]);

  return {
    isSyncing,
    pendingCount: 0, // Appwrite handles sync automatically
    lastSyncDate,
    syncError,
    syncNow,
  };
}
