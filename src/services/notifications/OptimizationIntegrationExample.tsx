/**
 * Optimization Integration Example
 *
 * This file demonstrates how to integrate all performance optimization features
 * into your app for maximum efficiency and battery savings.
 *
 * Task: 15 - Optimize performance and battery usage
 */

import { useEffect, useState } from 'react';
import {
  notificationBatchScheduler,
  notificationStorageOptimizer,
  notificationAnalytics,
} from './index';

/**
 * Hook to initialize notification optimizations on app startup
 */
export function useNotificationOptimizations() {
  const [initialized, setInitialized] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    initializeOptimizations();
  }, []);

  async function initializeOptimizations() {
    try {
      console.log('Initializing notification optimizations...');

      // 1. Initialize automatic cleanup (Task 15.2)
      await notificationStorageOptimizer.initializeAutoCleanup(30);
      console.log('✓ Automatic cleanup initialized');

      // 2. Get storage statistics
      const storageStats = await notificationStorageOptimizer.getStorageStatistics();
      console.log('✓ Storage stats:', storageStats);
      setStats(storageStats);

      // 3. Check if cleanup is needed
      if (storageStats.compressedHistorySize > 500000) {
        // Storage > 500KB, run cleanup
        console.log('Running cleanup due to high storage usage...');
        await notificationStorageOptimizer.runCleanup(14); // Keep only 14 days
      }

      setInitialized(true);
      console.log('✓ Notification optimizations initialized');
    } catch (error) {
      console.error('Error initializing notification optimizations:', error);
    }
  }

  return { initialized, stats };
}

/**
 * Hook to schedule protocol notifications efficiently
 */
export function useProtocolScheduling() {
  const [scheduling, setScheduling] = useState(false);

  async function scheduleProtocol(
    protocolRunId: string,
    userId: string,
    testSteps: Array<{
      id: string;
      scheduledDate: Date;
      foodName: string;
      doseAmount?: string;
    }>,
    washoutPeriods: Array<{
      id: string;
      startDate: Date;
      endDate: Date;
    }>,
    dailyReminderTime?: { hour: number; minute: number }
  ) {
    setScheduling(true);

    try {
      console.log('Scheduling protocol notifications...');

      // 1. Check for cached schedule (Task 15.1)
      let schedule = await notificationBatchScheduler.getCachedProtocolSchedule(protocolRunId);

      if (schedule) {
        console.log('✓ Using cached protocol schedule');
      } else {
        // 2. Pre-calculate all notifications (Task 15.1)
        console.log('Pre-calculating protocol schedule...');
        schedule = await notificationBatchScheduler.preCalculateProtocolSchedule(
          protocolRunId,
          userId,
          testSteps,
          washoutPeriods,
          dailyReminderTime
        );
        console.log(`✓ Pre-calculated ${schedule.notifications.length} notifications`);
      }

      // 3. Schedule all notifications in batch (Task 15.1)
      console.log('Scheduling notifications in batch...');
      const notificationIds = await notificationBatchScheduler.scheduleProtocol(schedule);
      console.log(`✓ Scheduled ${notificationIds.length} notifications`);

      return notificationIds;
    } catch (error) {
      console.error('Error scheduling protocol:', error);
      throw error;
    } finally {
      setScheduling(false);
    }
  }

  return { scheduleProtocol, scheduling };
}

/**
 * Hook to load notification history efficiently
 */
export function useNotificationHistory(userId: string) {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 20;

  async function loadHistory(pageNum: number = 0) {
    setLoading(true);

    try {
      // Lazy-load history with pagination (Task 15.2)
      const entries = await notificationStorageOptimizer.lazyLoadHistory(userId, {
        limit: pageSize,
        offset: pageNum * pageSize,
      });

      if (pageNum === 0) {
        setHistory(entries);
      } else {
        setHistory((prev) => [...prev, ...entries]);
      }

      setHasMore(entries.length === pageSize);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading notification history:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    if (!loading && hasMore) {
      await loadHistory(page + 1);
    }
  }

  async function refresh() {
    await loadHistory(0);
  }

  useEffect(() => {
    loadHistory(0);
  }, [userId]);

  return { history, loading, hasMore, loadMore, refresh };
}

/**
 * Hook to track notification analytics
 */
export function useNotificationAnalytics(userId: string) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  async function trackAnalytics() {
    setLoading(true);

    try {
      // Track delivery rate (Task 15.3)
      const deliveryMetrics = await notificationAnalytics.trackDeliveryRate(userId, 30);
      console.log('Delivery rate:', deliveryMetrics.deliveryRate + '%');

      // Track action rate (Task 15.3)
      const actionMetrics = await notificationAnalytics.trackActionRate(userId, 30);
      console.log('Action rate:', actionMetrics.actionRate + '%');

      // Get permission metrics (Task 15.3)
      const permissionMetrics = await notificationAnalytics.getPermissionMetrics();
      console.log('Permission grant rate:', permissionMetrics.grantRate + '%');

      setAnalytics({
        delivery: deliveryMetrics,
        actions: actionMetrics,
        permissions: permissionMetrics,
      });
    } catch (error) {
      console.error('Error tracking analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateReport() {
    setLoading(true);

    try {
      // Generate comprehensive report (Task 15.3)
      const report = await notificationAnalytics.generateAnalyticsReport(userId, 30);
      console.log('Analytics report generated:', report);
      return report;
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    trackAnalytics();
  }, [userId]);

  return { analytics, loading, trackAnalytics, generateReport };
}

/**
 * Example component showing integration
 */
export function NotificationOptimizationExample() {
  const { initialized, stats } = useNotificationOptimizations();
  const { scheduleProtocol, scheduling } = useProtocolScheduling();
  const userId = 'example-user-id';
  const { history, loading, hasMore, loadMore, refresh } = useNotificationHistory(userId);
  const { analytics, trackAnalytics, generateReport } = useNotificationAnalytics(userId);

  if (!initialized) {
    return <div>Initializing optimizations...</div>;
  }

  return (
    <div>
      <h2>Notification Optimizations</h2>

      {/* Storage Statistics */}
      <section>
        <h3>Storage Statistics</h3>
        <p>Compressed size: {stats?.compressedHistorySize} bytes</p>
        <p>Total entries: {stats?.totalEntries}</p>
        <p>Estimated savings: {stats?.estimatedSavings} bytes</p>
      </section>

      {/* Analytics */}
      <section>
        <h3>Analytics</h3>
        {analytics && (
          <>
            <p>Delivery rate: {analytics.delivery.deliveryRate.toFixed(1)}%</p>
            <p>Action rate: {analytics.actions.actionRate.toFixed(1)}%</p>
            <p>Permission grant rate: {analytics.permissions.grantRate.toFixed(1)}%</p>
          </>
        )}
        <button onClick={trackAnalytics}>Refresh Analytics</button>
        <button onClick={generateReport}>Generate Report</button>
      </section>

      {/* History */}
      <section>
        <h3>Notification History</h3>
        {loading && <p>Loading...</p>}
        <ul>
          {history.map((entry) => (
            <li key={entry.id}>
              {entry.title} - {entry.scheduledTime.toLocaleString()}
            </li>
          ))}
        </ul>
        {hasMore && <button onClick={loadMore}>Load More</button>}
        <button onClick={refresh}>Refresh</button>
      </section>
    </div>
  );
}

/**
 * Example: Schedule protocol on app startup
 */
export async function scheduleProtocolOnStartup(
  protocolRunId: string,
  userId: string,
  testSteps: any[],
  washoutPeriods: any[]
) {
  try {
    // Use the hook's function
    const { scheduleProtocol } = useProtocolScheduling();

    const notificationIds = await scheduleProtocol(
      protocolRunId,
      userId,
      testSteps,
      washoutPeriods,
      { hour: 9, minute: 0 }
    );

    console.log(`Successfully scheduled ${notificationIds.length} notifications`);
    return notificationIds;
  } catch (error) {
    console.error('Failed to schedule protocol:', error);
    throw error;
  }
}

/**
 * Example: Daily analytics tracking
 */
export async function runDailyAnalytics(userId: string) {
  try {
    console.log('Running daily analytics...');

    // Track metrics (Task 15.3)
    await notificationAnalytics.trackDeliveryRate(userId, 7);
    await notificationAnalytics.trackActionRate(userId, 7);

    // Run cleanup (Task 15.2)
    const deletedCount = await notificationStorageOptimizer.runCleanup(30);
    console.log(`Cleaned up ${deletedCount} old entries`);

    console.log('✓ Daily analytics complete');
  } catch (error) {
    console.error('Error running daily analytics:', error);
  }
}
