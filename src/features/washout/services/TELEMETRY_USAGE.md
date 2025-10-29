# TelemetryService Usage Guide

## Overview

The TelemetryService tracks user interactions with educational content during washout periods. It implements event batching, local persistence, and retry logic for reliable analytics tracking.

## Quick Start

```typescript
import { TelemetryService } from './services/TelemetryService';
import { TelemetryEventStore } from './stores/TelemetryEventStore';

// Initialize the service
const eventStore = new TelemetryEventStore();
const telemetryService = new TelemetryService(eventStore);

// Track events
await telemetryService.trackContentViewed('content-id-123', userState);
await telemetryService.trackContentExpanded('content-id-123', userState);
await telemetryService.trackContentCompleted('content-id-123', userState, 120); // 120 seconds

// Sync events to backend
const syncedCount = await telemetryService.syncEvents();
console.log(`Synced ${syncedCount} events`);
```

## Event Types

### 1. Content Viewed (Requirement 7.1)

Triggered when a user views content for more than 3 seconds.

```typescript
await telemetryService.trackContentViewed(contentId, userState);
```

### 2. Content Expanded (Requirement 7.2)

Triggered when a user taps to expand a content card.

```typescript
await telemetryService.trackContentExpanded(contentId, userState);
```

### 3. Content Completed (Requirement 7.3)

Triggered when a user scrolls to the end of content.

```typescript
const timeSpent = 120; // seconds
await telemetryService.trackContentCompleted(contentId, userState, timeSpent);
```

## Event Batching (Requirement 7.4)

Events are automatically batched and flushed to local storage when:

- Buffer reaches 50 events (configurable)
- 5 minutes have elapsed since first event (configurable)

```typescript
// Custom configuration
const telemetryService = new TelemetryService(eventStore, {
  maxBatchSize: 100, // Flush after 100 events
  maxBatchTime: 10 * 60 * 1000, // Flush after 10 minutes
  maxRetries: 5, // Retry failed syncs 5 times
  retryBaseDelay: 2000, // Start with 2 second delay
});
```

## Local Persistence (Requirement 7.4)

Events are persisted to AsyncStorage before syncing to ensure no data loss:

```typescript
// Events are automatically persisted when batches flush
// You can also manually sync all unsynced events
await telemetryService.syncEvents();
```

## User State Context (Requirement 7.5)

All events include user state for segmentation analysis:

```typescript
const userState = {
  experienceLevel: 'intermediate',
  anxietyLevel: 'high',
  protocolPhase: 'reintroduction',
  completedTestsCount: 3,
  previouslyViewedContentIds: ['content-1', 'content-2'],
};

await telemetryService.trackContentViewed('content-3', userState);
```

## Retrieving Viewed Content

Get all content IDs a user has viewed:

```typescript
const viewedContentIds = await telemetryService.getViewedContentIds(userId);
console.log('User has viewed:', viewedContentIds);
```

## Store Management

### Clear All Events

```typescript
const eventStore = new TelemetryEventStore();
await eventStore.clear();
```

### Prune Old Events

Remove synced events older than 30 days to prevent storage bloat:

```typescript
const removedCount = await eventStore.pruneOldEvents(30);
console.log(`Removed ${removedCount} old events`);
```

### Get Unsynced Count

```typescript
const unsyncedCount = await eventStore.getUnsyncedCount();
console.log(`${unsyncedCount} events waiting to sync`);
```

## Integration with ContentSurfacingEngine

The TelemetryService integrates with the ContentSurfacingEngine to personalize content:

```typescript
import { deriveUserState } from './utils/userStateUtils';

// Create telemetry service
const telemetryService = new TelemetryService(eventStore);

// Derive user state with viewed content IDs
const userState = await deriveUserState(
  userId,
  userProfileRepository,
  protocolRunRepository,
  testStepRepository,
  (userId) => telemetryService.getViewedContentIds(userId)
);

// Use user state for content surfacing
const content = await contentSurfacingEngine.selectContent(userState);
```

## Error Handling

The service handles errors gracefully:

```typescript
try {
  await telemetryService.syncEvents();
} catch (error) {
  // Events remain in local store for next sync attempt
  console.error('Sync failed, will retry later:', error);
}
```

## Retry Logic

Failed syncs are automatically retried with exponential backoff:

- Attempt 1: Immediate
- Attempt 2: 1 second delay
- Attempt 3: 2 second delay
- Attempt 4: 4 second delay

After max retries, events remain in local storage for the next sync attempt.

## Cleanup

When destroying the service (e.g., on app unmount):

```typescript
telemetryService.destroy();
```

## Backend Integration

The service includes a placeholder for backend integration. To implement:

1. Replace `sendToAnalyticsBackend` method in `TelemetryService.ts`
2. Add your analytics API endpoint
3. Configure authentication headers

```typescript
private async sendToAnalyticsBackend(events: TelemetryEvent[]): Promise<void> {
  const response = await fetch('https://your-analytics-api.com/events', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(events),
  });

  if (!response.ok) {
    throw new Error(`Analytics API error: ${response.status}`);
  }
}
```

## Testing

Example test setup:

```typescript
import { TelemetryService } from './TelemetryService';
import { TelemetryEventStore } from '../stores/TelemetryEventStore';

describe('TelemetryService', () => {
  let service: TelemetryService;
  let store: TelemetryEventStore;

  beforeEach(() => {
    store = new TelemetryEventStore();
    service = new TelemetryService(store);
  });

  afterEach(async () => {
    await store.clear();
    service.destroy();
  });

  it('should track content viewed event', async () => {
    await service.trackContentViewed('test-content', mockUserState);
    const events = await store.getAllEvents();
    expect(events).toHaveLength(1);
    expect(events[0].eventType).toBe('content-viewed');
  });
});
```
