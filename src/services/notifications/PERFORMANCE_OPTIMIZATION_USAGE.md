# Performance Optimization Usage Guide

This guide explains how to use the performance optimization features added in Task 15.

## Overview

Three new modules have been added to optimize notification performance and battery usage:

1. **NotificationBatchScheduler** - Pre-calculates and batches notification scheduling
2. **NotificationStorageOptimizer** - Compresses data and manages storage efficiently
3. **NotificationAnalytics** - Tracks metrics for monitoring and optimization

## 1. Batch Scheduling (Task 15.1)

### Pre-Calculate Protocol Schedule

Instead of scheduling notifications one at a time, pre-calculate all notifications for an entire protocol:

```typescript
import { notificationBatchScheduler } from './notifications';

// Pre-calculate all notifications for a protocol
const schedule = await notificationBatchScheduler.preCalculateProtocolSchedule(
  protocolRunId,
  userId,
  testSteps, // Array of test steps with scheduled dates
  washoutPeriods, // Array of washout periods
  { hour: 9, minute: 0 } // Daily reminder time
);

// Schedule all notifications at once
const notificationIds = await notificationBatchScheduler.scheduleProtocol(schedule);

console.log(`Scheduled ${notificationIds.length} notifications`);
```

### Benefits

- **Reduced API calls**: Schedule multiple notifications in one batch
- **Faster execution**: Pre-calculated times avoid repeated calculations
- **Better battery life**: Fewer wake-ups and operations

### Use Cached Schedule

```typescript
// Check if we have a cached schedule
const cached = await notificationBatchScheduler.getCachedProtocolSchedule(protocolRunId);

if (cached) {
  // Use cached schedule
  await notificationBatchScheduler.scheduleProtocol(cached);
} else {
  // Calculate new schedule
  const schedule = await notificationBatchScheduler.preCalculateProtocolSchedule(
    protocolRunId,
    userId,
    testSteps,
    washoutPeriods,
    dailyReminderTime
  );
  await notificationBatchScheduler.scheduleProtocol(schedule);
}
```

## 2. Storage Optimization (Task 15.2)

### Compress Notification History

Automatically compress notification history to save storage space:

```typescript
import { notificationStorageOptimizer } from './notifications';

// Store compressed history (happens automatically in background)
const entries = await notificationHistoryRepository.list({ userId }, 1000);
await notificationStorageOptimizer.storeCompressedHistory(entries);
```

### Lazy-Load History

Load history on demand instead of all at once:

```typescript
// Load only what you need
const recentHistory = await notificationStorageOptimizer.lazyLoadHistory(userId, {
  limit: 20, // Only load 20 entries
  offset: 0, // Start from beginning
  type: 'daily_reminder', // Filter by type
  startDate: new Date('2025-01-01'),
});

// Load more as user scrolls
const moreHistory = await notificationStorageOptimizer.lazyLoadHistory(userId, {
  limit: 20,
  offset: 20, // Next page
});
```

### Automatic Cleanup

Initialize automatic cleanup to remove old history:

```typescript
// Initialize on app startup
await notificationStorageOptimizer.initializeAutoCleanup(30); // Keep 30 days

// Or run cleanup manually
const deletedCount = await notificationStorageOptimizer.runCleanup(30);
console.log(`Cleaned up ${deletedCount} old entries`);
```

### Storage Statistics

Monitor storage usage:

```typescript
const stats = await notificationStorageOptimizer.getStorageStatistics();

console.log(`Compressed size: ${stats.compressedHistorySize} bytes`);
console.log(`Total entries: ${stats.totalEntries}`);
console.log(`Estimated savings: ${stats.estimatedSavings} bytes`);
console.log(`Oldest entry: ${stats.oldestEntry}`);
console.log(`Newest entry: ${stats.newestEntry}`);
```

## 3. Analytics and Monitoring (Task 15.3)

### Track Delivery Rate

Monitor how many notifications are successfully delivered:

```typescript
import { notificationAnalytics } from './notifications';

// Track delivery rate for last 30 days
const deliveryMetrics = await notificationAnalytics.trackDeliveryRate(userId, 30);

console.log(`Delivery rate: ${deliveryMetrics.deliveryRate}%`);
console.log(`Total scheduled: ${deliveryMetrics.totalScheduled}`);
console.log(`Total delivered: ${deliveryMetrics.totalDelivered}`);
console.log(`Total failed: ${deliveryMetrics.totalFailed}`);
console.log(`Average delay: ${deliveryMetrics.averageDeliveryDelay}ms`);

// Check by type
console.log('Daily reminders:', deliveryMetrics.byType.daily_reminder);
console.log('Dose reminders:', deliveryMetrics.byType.dose_reminder);
```

### Track Action Rate

Monitor user engagement with notifications:

```typescript
// Track action rate for last 30 days
const actionMetrics = await notificationAnalytics.trackActionRate(userId, 30);

console.log(`Action rate: ${actionMetrics.actionRate}%`);
console.log(`Open rate: ${actionMetrics.openRate}%`);
console.log(`Total actioned: ${actionMetrics.totalActioned}`);
console.log(`Total opened: ${actionMetrics.totalOpened}`);
console.log(`Total dismissed: ${actionMetrics.totalDismissed}`);

// Check by action type
console.log('Dose marked taken:', actionMetrics.byAction.dose_marked_taken);
console.log('Symptom logged:', actionMetrics.byAction.symptom_logged);
```

### Track Permission Requests

Monitor permission grant/deny rates:

```typescript
// Track when permission is requested
await notificationAnalytics.trackPermissionRequest('granted', 'undetermined');

// Get permission metrics
const permissionMetrics = await notificationAnalytics.getPermissionMetrics();

console.log(`Grant rate: ${permissionMetrics.grantRate}%`);
console.log(`Deny rate: ${permissionMetrics.denyRate}%`);
console.log(`Total requests: ${permissionMetrics.totalRequests}`);
console.log(`Request history:`, permissionMetrics.requestHistory);
```

### Generate Comprehensive Report

Get a complete analytics report:

```typescript
// Generate report for last 30 days
const report = await notificationAnalytics.generateAnalyticsReport(userId, 30);

console.log('Period:', report.period);
console.log('Delivery metrics:', report.delivery);
console.log('Action metrics:', report.actions);
console.log('Permission metrics:', report.permissions);
console.log('Adherence distribution:', report.adherence);
console.log('Trends:', report.trends);
```

### Export Analytics

Export analytics data for external analysis:

```typescript
// Export all analytics data as JSON
const exportedData = await notificationAnalytics.exportAnalytics();

// Save to file or send to analytics service
console.log(exportedData);
```

## Integration Example

Here's how to integrate all optimization features in your app:

```typescript
import {
  notificationBatchScheduler,
  notificationStorageOptimizer,
  notificationAnalytics,
} from './notifications';

// On app startup
async function initializeNotificationOptimizations() {
  try {
    // Initialize automatic cleanup
    await notificationStorageOptimizer.initializeAutoCleanup(30);

    // Check storage statistics
    const stats = await notificationStorageOptimizer.getStorageStatistics();
    console.log('Storage stats:', stats);

    // Generate analytics report
    const userId = await getCurrentUserId();
    if (userId) {
      const report = await notificationAnalytics.generateAnalyticsReport(userId, 30);
      console.log('Analytics report:', report);
    }
  } catch (error) {
    console.error('Error initializing notification optimizations:', error);
  }
}

// When starting a new protocol
async function scheduleProtocolNotifications(
  protocolRunId: string,
  userId: string,
  testSteps: any[],
  washoutPeriods: any[]
) {
  try {
    // Check for cached schedule first
    let schedule = await notificationBatchScheduler.getCachedProtocolSchedule(protocolRunId);

    if (!schedule) {
      // Pre-calculate all notifications
      schedule = await notificationBatchScheduler.preCalculateProtocolSchedule(
        protocolRunId,
        userId,
        testSteps,
        washoutPeriods,
        { hour: 9, minute: 0 }
      );
    }

    // Schedule all notifications in batch
    const notificationIds = await notificationBatchScheduler.scheduleProtocol(schedule);

    console.log(`Scheduled ${notificationIds.length} notifications for protocol`);

    return notificationIds;
  } catch (error) {
    console.error('Error scheduling protocol notifications:', error);
    throw error;
  }
}

// When loading notification history
async function loadNotificationHistory(userId: string, page: number = 0) {
  try {
    const pageSize = 20;

    // Lazy-load history
    const history = await notificationStorageOptimizer.lazyLoadHistory(userId, {
      limit: pageSize,
      offset: page * pageSize,
    });

    return history;
  } catch (error) {
    console.error('Error loading notification history:', error);
    return [];
  }
}

// Periodic analytics tracking (run daily)
async function trackDailyAnalytics(userId: string) {
  try {
    // Track delivery rate
    await notificationAnalytics.trackDeliveryRate(userId, 7);

    // Track action rate
    await notificationAnalytics.trackActionRate(userId, 7);

    // Run cleanup if needed
    await notificationStorageOptimizer.runCleanup(30);
  } catch (error) {
    console.error('Error tracking daily analytics:', error);
  }
}
```

## Performance Tips

1. **Use batch scheduling** for protocols with multiple notifications
2. **Enable automatic cleanup** to prevent storage bloat
3. **Lazy-load history** instead of loading everything at once
4. **Monitor analytics** to identify optimization opportunities
5. **Cache protocol schedules** to avoid recalculation
6. **Clear history cache** when memory is low

## Monitoring Recommendations

Track these metrics regularly:

- **Delivery rate**: Should be > 95%
- **Action rate**: Indicates user engagement
- **Storage size**: Keep under 1MB for history
- **Permission grant rate**: Monitor onboarding effectiveness
- **Average delivery delay**: Should be < 1 second

## Troubleshooting

### High Storage Usage

```typescript
// Check storage statistics
const stats = await notificationStorageOptimizer.getStorageStatistics();

if (stats.compressedHistorySize > 1000000) {
  // Run aggressive cleanup
  await notificationStorageOptimizer.runCleanup(7); // Keep only 7 days
}
```

### Low Delivery Rate

```typescript
// Check delivery metrics
const metrics = await notificationAnalytics.trackDeliveryRate(userId, 30);

if (metrics.deliveryRate < 90) {
  console.warn('Low delivery rate detected');
  // Check permission status
  // Check for scheduling errors
  // Review quiet hours configuration
}
```

### Memory Issues

```typescript
// Clear caches
notificationStorageOptimizer.clearHistoryCache();

// Reduce cache size
// Load smaller batches
const history = await notificationStorageOptimizer.lazyLoadHistory(userId, {
  limit: 10, // Smaller batch
});
```

## Requirements Satisfied

- **9.1, 9.2**: Efficient scheduling with pre-calculation and batching
- **10.5**: Storage optimization with compression and automatic cleanup
- **10.1**: Comprehensive analytics and monitoring

## Next Steps

1. Integrate batch scheduling into protocol creation flow
2. Set up automatic cleanup on app startup
3. Add analytics dashboard to settings screen
4. Monitor metrics in production
5. Optimize based on real-world usage patterns
