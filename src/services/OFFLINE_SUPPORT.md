# Offline Support Implementation

This document describes the offline support implementation for the FODMAP Reintroduction app.

## Overview

The app implements a comprehensive offline-first architecture that allows users to:

- Log symptoms without internet connection
- Continue test progression offline
- Automatically sync data when connection is restored
- View sync status and pending operations

## Components

### 1. Network Detection

**Hook: `useNetworkStatus`**

- Monitors real-time network connectivity
- Provides connection status and type
- Automatically updates when network state changes

```typescript
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';

function MyComponent() {
  const { isConnected, isInternetReachable, type } = useNetworkStatus();

  if (!isConnected) {
    return <OfflineIndicator />;
  }

  return <MainContent />;
}
```

**Component: `OfflineIndicator`**

- Displays a banner when device is offline
- Automatically shows/hides based on connectivity
- Accessible with proper ARIA labels

### 2. Local Data Persistence

All data is stored locally in SQLite using Drizzle ORM:

**Database Schema Updates:**

- Added `syncStatus` field to track sync state ('pending', 'synced', 'error')
- Added `lastSyncAttempt` timestamp for retry logic

**Affected Tables:**

- `symptom_entries`
- `test_steps`
- `protocol_runs`

**Protocol State Cache:**

- Caches protocol state in AsyncStorage
- Reduces need for recalculation
- Provides offline access to protocol state

```typescript
import { ProtocolStateCache } from '@/services/ProtocolStateCache';

// Save protocol state
await ProtocolStateCache.save(protocolState);

// Load protocol state
const cachedState = await ProtocolStateCache.load();

// Check if cache exists
const exists = await ProtocolStateCache.exists();

// Clear cache
await ProtocolStateCache.clear();
```

### 3. Sync Queue

**Service: `SyncQueue`**

- Queues CRUD operations when offline
- Automatically syncs when online
- Implements retry logic with exponential backoff
- Handles sync conflicts

```typescript
import { SyncQueue } from '@/services/SyncQueue';

// Initialize sync queue (call once at app startup)
await SyncQueue.initialize();

// Enqueue an operation
await SyncQueue.enqueue({
  type: 'symptom_entry',
  entityId: symptomEntry.id,
  operation: 'create',
  data: symptomEntry,
});

// Process sync queue (automatically called when online)
const result = await SyncQueue.processQueue(isOnline);
console.log(`Synced: ${result.synced}, Failed: ${result.failed}, Pending: ${result.pending}`);

// Get pending count
const pendingCount = SyncQueue.getPendingCount();

// Get last sync timestamp
const lastSync = await SyncQueue.getLastSyncTimestamp();
```

**Hook: `useSyncStatus`**

- Monitors sync status
- Provides manual sync trigger
- Auto-syncs when coming online
- Periodic sync checks (every 5 minutes)

```typescript
import { useSyncStatus } from '@/shared/hooks/useSyncStatus';

function MyComponent() {
  const { isSyncing, pendingCount, lastSyncDate, syncError, syncNow } = useSyncStatus();

  return (
    <View>
      {pendingCount > 0 && (
        <Text>{pendingCount} changes pending sync</Text>
      )}
      <Button onPress={syncNow} disabled={isSyncing}>
        Sync Now
      </Button>
    </View>
  );
}
```

**Component: `SyncStatusIndicator`**

- Displays sync status banner
- Shows pending operations count
- Provides manual sync button
- Displays sync errors

## Integration

### Symptom Logging

The `useSymptomLogger` hook automatically queues symptom entries for sync:

```typescript
// In useSymptomLogger.ts
const symptomEntry = await symptomEntryRepository.create({...});

// Queue for sync
await SyncQueue.enqueue({
  type: 'symptom_entry',
  entityId: symptomEntry.id,
  operation: 'create',
  data: symptomEntry,
});
```

### Test Progression

The `useTestWizard` hook queues test step updates:

```typescript
// In useTestWizard.ts
const updatedTestStep = await testStepRepository.update(testStep.id, {...});

// Queue for sync
await SyncQueue.enqueue({
  type: 'test_step',
  entityId: testStep.id,
  operation: 'update',
  data: updatedTestStep,
});
```

## Usage in App

### App Initialization

Initialize the sync queue when the app starts:

```typescript
// In App.tsx or root component
import { SyncQueue } from '@/services/SyncQueue';

useEffect(() => {
  SyncQueue.initialize();
}, []);
```

### Display Offline Indicator

Add the offline indicator to your main layout:

```typescript
import { OfflineIndicator } from '@/shared/components/atoms';

function MainLayout() {
  return (
    <View>
      <OfflineIndicator />
      <MainContent />
    </View>
  );
}
```

### Display Sync Status

Add the sync status indicator to show pending operations:

```typescript
import { SyncStatusIndicator } from '@/shared/components/atoms';

function MainLayout() {
  return (
    <View>
      <OfflineIndicator />
      <SyncStatusIndicator />
      <MainContent />
    </View>
  );
}
```

## Sync Behavior

### Automatic Sync

The app automatically syncs in the following scenarios:

1. When device comes online (detected by network status change)
2. Every 5 minutes when online (periodic check)
3. When app comes to foreground (if implemented)

### Manual Sync

Users can manually trigger sync using:

1. The "Sync Now" button in the sync status indicator
2. Pull-to-refresh on main screens (if implemented)
3. Calling `syncNow()` from the `useSyncStatus` hook

### Retry Logic

Failed sync operations are automatically retried:

- Maximum 3 retry attempts per operation
- Operations are removed from queue after max retries
- Sync status is updated to 'error' in database

### Conflict Resolution

Currently, the sync implementation uses a "last write wins" strategy:

- Local changes always overwrite server data
- No conflict detection or merging
- Future enhancement: implement proper conflict resolution

## Testing

### Testing Offline Behavior

1. Disable network connection
2. Log symptoms or progress tests
3. Verify data is saved locally
4. Enable network connection
5. Verify data syncs automatically

### Testing Sync Queue

```typescript
// Check pending operations
const pending = SyncQueue.getPendingOperations();
console.log('Pending operations:', pending);

// Check pending entities in database
const entities = await SyncQueue.findPendingEntities();
console.log('Pending entities:', entities);

// Manually trigger sync
const result = await SyncQueue.processQueue(true);
console.log('Sync result:', result);
```

## Future Enhancements

1. **Conflict Resolution**: Implement proper conflict detection and resolution
2. **Optimistic Updates**: Update UI immediately, rollback on sync failure
3. **Background Sync**: Use background tasks to sync when app is closed
4. **Selective Sync**: Allow users to choose what to sync
5. **Sync History**: Track sync history for debugging
6. **Compression**: Compress large payloads before sync
7. **Delta Sync**: Only sync changed fields, not entire entities

## Troubleshooting

### Sync Not Working

1. Check network connectivity: `useNetworkStatus()`
2. Check pending count: `SyncQueue.getPendingCount()`
3. Check last sync: `await SyncQueue.getLastSyncTimestamp()`
4. Check sync errors in database: Look for entities with `syncStatus = 'error'`

### Data Not Persisting

1. Verify SQLite database is initialized
2. Check repository create/update methods
3. Verify sync queue enqueue calls
4. Check console logs for errors

### Sync Queue Growing

1. Check if Supabase sync is implemented (currently placeholder)
2. Verify network connectivity
3. Check for sync errors in database
4. Clear queue if needed: `await SyncQueue.clear()`

## Dependencies

- `@react-native-community/netinfo`: Network status detection
- `@react-native-async-storage/async-storage`: Protocol state caching
- `drizzle-orm`: SQLite database ORM
- `expo-sqlite`: SQLite database

## Related Files

- `src/shared/hooks/useNetworkStatus.ts`
- `src/shared/hooks/useSyncStatus.ts`
- `src/shared/components/atoms/OfflineIndicator.tsx`
- `src/shared/components/atoms/SyncStatusIndicator.tsx`
- `src/services/SyncQueue.ts`
- `src/services/ProtocolStateCache.ts`
- `src/db/schema.ts` (sync status fields)
