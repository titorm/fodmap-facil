/**
 * Notification Analytics
 *
 * Tracks and analyzes notification metrics for monitoring and optimization
 * Provides insights into delivery rates, action rates, and user engagement
 *
 * Requirements: 10.1
 * Task: 15.3 - Add monitoring and analytics
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NotificationHistoryRepository } from './NotificationHistoryRepository';
import type { NotificationType, NotificationAction, PermissionStatus } from './types';

const ANALYTICS_KEY = '@notifications:analytics';
const METRICS_KEY = '@notifications:metrics';
const PERMISSION_TRACKING_KEY = '@notifications:permission_tracking';

/**
 * Notification delivery metrics
 */
interface DeliveryMetrics {
  totalScheduled: number;
  totalDelivered: number;
  totalFailed: number;
  deliveryRate: number; // Percentage
  averageDeliveryDelay: number; // Milliseconds
  byType: Record<
    NotificationType,
    {
      scheduled: number;
      delivered: number;
      failed: number;
      deliveryRate: number;
    }
  >;
}

/**
 * Notification action metrics
 */
interface ActionMetrics {
  totalDelivered: number;
  totalActioned: number;
  totalOpened: number;
  totalDismissed: number;
  actionRate: number; // Percentage
  openRate: number; // Percentage
  byType: Record<
    NotificationType,
    {
      delivered: number;
      actioned: number;
      opened: number;
      dismissed: number;
      actionRate: number;
      openRate: number;
    }
  >;
  byAction: Record<NotificationAction, number>;
}

/**
 * Permission tracking metrics
 */
interface PermissionMetrics {
  totalRequests: number;
  totalGrants: number;
  totalDenials: number;
  grantRate: number; // Percentage
  denyRate: number; // Percentage
  requestHistory: Array<{
    timestamp: Date;
    status: PermissionStatus;
    previousStatus?: PermissionStatus;
  }>;
}

/**
 * Adherence score distribution
 */
interface AdherenceDistribution {
  excellent: number; // 90-100
  good: number; // 70-89
  fair: number; // 50-69
  poor: number; // 0-49
  averageScore: number;
  totalUsers: number;
}

/**
 * Time-series data point
 */
interface TimeSeriesDataPoint {
  timestamp: Date;
  value: number;
}

/**
 * Comprehensive analytics report
 */
interface AnalyticsReport {
  period: {
    start: Date;
    end: Date;
  };
  delivery: DeliveryMetrics;
  actions: ActionMetrics;
  permissions: PermissionMetrics;
  adherence: AdherenceDistribution;
  trends: {
    deliveryRate: TimeSeriesDataPoint[];
    actionRate: TimeSeriesDataPoint[];
    adherenceScore: TimeSeriesDataPoint[];
  };
  generatedAt: Date;
}

/**
 * NotificationAnalytics - Tracks and analyzes notification metrics
 */
export class NotificationAnalytics {
  private static instance: NotificationAnalytics;
  private historyRepository: NotificationHistoryRepository;

  private constructor() {
    this.historyRepository = NotificationHistoryRepository.getInstance();
  }

  /**
   * Get singleton instance
   */
  static getInstance(): NotificationAnalytics {
    if (!NotificationAnalytics.instance) {
      NotificationAnalytics.instance = new NotificationAnalytics();
    }
    return NotificationAnalytics.instance;
  }

  // ============================================================================
  // DELIVERY RATE TRACKING
  // ============================================================================

  /**
   * Track notification delivery rate
   * Calculates percentage of scheduled notifications that were delivered
   *
   * Requirements: 10.1
   */
  async trackDeliveryRate(userId: string, days: number = 30): Promise<DeliveryMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all history entries
      const entries = await this.historyRepository.list(
        {
          userId,
          startDate,
        },
        1000
      );

      const totalScheduled = entries.length;
      const totalDelivered = entries.filter((e) => e.deliveredTime !== null).length;
      const totalFailed = totalScheduled - totalDelivered;
      const deliveryRate = totalScheduled > 0 ? (totalDelivered / totalScheduled) * 100 : 0;

      // Calculate average delivery delay
      const deliveryDelays = entries
        .filter((e) => e.deliveredTime !== null)
        .map((e) => e.deliveredTime!.getTime() - e.scheduledTime.getTime());

      const averageDeliveryDelay =
        deliveryDelays.length > 0
          ? deliveryDelays.reduce((sum, delay) => sum + delay, 0) / deliveryDelays.length
          : 0;

      // Calculate by type
      const byType: Record<string, any> = {};

      for (const type of this.getAllNotificationTypes()) {
        const typeEntries = entries.filter((e) => e.notificationType === type);
        const typeScheduled = typeEntries.length;
        const typeDelivered = typeEntries.filter((e) => e.deliveredTime !== null).length;
        const typeFailed = typeScheduled - typeDelivered;
        const typeDeliveryRate = typeScheduled > 0 ? (typeDelivered / typeScheduled) * 100 : 0;

        byType[type] = {
          scheduled: typeScheduled,
          delivered: typeDelivered,
          failed: typeFailed,
          deliveryRate: typeDeliveryRate,
        };
      }

      const metrics: DeliveryMetrics = {
        totalScheduled,
        totalDelivered,
        totalFailed,
        deliveryRate,
        averageDeliveryDelay,
        byType: byType as Record<NotificationType, any>,
      };

      // Store metrics
      await this.storeMetrics('delivery', metrics);

      return metrics;
    } catch (error) {
      console.error('Error tracking delivery rate:', error);
      throw error;
    }
  }

  // ============================================================================
  // ACTION RATE TRACKING
  // ============================================================================

  /**
   * Track notification action rate
   * Calculates percentage of delivered notifications that were acted upon
   *
   * Requirements: 10.1
   */
  async trackActionRate(userId: string, days: number = 30): Promise<ActionMetrics> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get all delivered entries
      const entries = await this.historyRepository.list(
        {
          userId,
          startDate,
        },
        1000
      );

      const deliveredEntries = entries.filter((e) => e.deliveredTime !== null);
      const totalDelivered = deliveredEntries.length;
      const totalActioned = deliveredEntries.filter((e) => e.action !== null).length;
      const totalOpened = deliveredEntries.filter((e) => e.action === 'opened').length;
      const totalDismissed = deliveredEntries.filter((e) => e.action === 'dismissed').length;

      const actionRate = totalDelivered > 0 ? (totalActioned / totalDelivered) * 100 : 0;
      const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0;

      // Calculate by type
      const byType: Record<string, any> = {};

      for (const type of this.getAllNotificationTypes()) {
        const typeEntries = deliveredEntries.filter((e) => e.notificationType === type);
        const typeDelivered = typeEntries.length;
        const typeActioned = typeEntries.filter((e) => e.action !== null).length;
        const typeOpened = typeEntries.filter((e) => e.action === 'opened').length;
        const typeDismissed = typeEntries.filter((e) => e.action === 'dismissed').length;

        const typeActionRate = typeDelivered > 0 ? (typeActioned / typeDelivered) * 100 : 0;
        const typeOpenRate = typeDelivered > 0 ? (typeOpened / typeDelivered) * 100 : 0;

        byType[type] = {
          delivered: typeDelivered,
          actioned: typeActioned,
          opened: typeOpened,
          dismissed: typeDismissed,
          actionRate: typeActionRate,
          openRate: typeOpenRate,
        };
      }

      // Calculate by action
      const byAction: Record<string, number> = {};

      for (const entry of deliveredEntries) {
        if (entry.action) {
          byAction[entry.action] = (byAction[entry.action] || 0) + 1;
        }
      }

      const metrics: ActionMetrics = {
        totalDelivered,
        totalActioned,
        totalOpened,
        totalDismissed,
        actionRate,
        openRate,
        byType: byType as Record<NotificationType, any>,
        byAction: byAction as Record<NotificationAction, number>,
      };

      // Store metrics
      await this.storeMetrics('action', metrics);

      return metrics;
    } catch (error) {
      console.error('Error tracking action rate:', error);
      throw error;
    }
  }

  // ============================================================================
  // PERMISSION TRACKING
  // ============================================================================

  /**
   * Track permission grant/deny rate
   * Records permission requests and outcomes
   *
   * Requirements: 10.1
   */
  async trackPermissionRequest(
    status: PermissionStatus,
    previousStatus?: PermissionStatus
  ): Promise<void> {
    try {
      const tracking = await this.getPermissionTracking();

      const requestEntry = {
        timestamp: new Date(),
        status,
        previousStatus,
      };

      tracking.requestHistory.push(requestEntry);

      // Update counts
      tracking.totalRequests++;

      if (status === 'granted') {
        tracking.totalGrants++;
      } else if (status === 'denied') {
        tracking.totalDenials++;
      }

      // Calculate rates
      tracking.grantRate =
        tracking.totalRequests > 0 ? (tracking.totalGrants / tracking.totalRequests) * 100 : 0;
      tracking.denyRate =
        tracking.totalRequests > 0 ? (tracking.totalDenials / tracking.totalRequests) * 100 : 0;

      // Store updated tracking
      await this.storePermissionTracking(tracking);
    } catch (error) {
      console.error('Error tracking permission request:', error);
    }
  }

  /**
   * Get permission tracking metrics
   */
  async getPermissionMetrics(): Promise<PermissionMetrics> {
    try {
      return await this.getPermissionTracking();
    } catch (error) {
      console.error('Error getting permission metrics:', error);
      return this.getDefaultPermissionMetrics();
    }
  }

  /**
   * Get permission tracking data
   */
  private async getPermissionTracking(): Promise<PermissionMetrics> {
    try {
      const json = await AsyncStorage.getItem(PERMISSION_TRACKING_KEY);

      if (!json) {
        return this.getDefaultPermissionMetrics();
      }

      const tracking = JSON.parse(json);

      // Convert date strings back to Date objects
      tracking.requestHistory = tracking.requestHistory.map((entry: any) => ({
        ...entry,
        timestamp: new Date(entry.timestamp),
      }));

      return tracking;
    } catch (error) {
      console.error('Error getting permission tracking:', error);
      return this.getDefaultPermissionMetrics();
    }
  }

  /**
   * Store permission tracking data
   */
  private async storePermissionTracking(tracking: PermissionMetrics): Promise<void> {
    try {
      await AsyncStorage.setItem(PERMISSION_TRACKING_KEY, JSON.stringify(tracking));
    } catch (error) {
      console.error('Error storing permission tracking:', error);
    }
  }

  /**
   * Get default permission metrics
   */
  private getDefaultPermissionMetrics(): PermissionMetrics {
    return {
      totalRequests: 0,
      totalGrants: 0,
      totalDenials: 0,
      grantRate: 0,
      denyRate: 0,
      requestHistory: [],
    };
  }

  // ============================================================================
  // ADHERENCE SCORE DISTRIBUTION
  // ============================================================================

  /**
   * Track adherence score distribution
   * Analyzes how users are distributed across adherence levels
   *
   * Requirements: 10.1
   */
  async trackAdherenceDistribution(
    adherenceScores: Array<{ userId: string; score: number }>
  ): Promise<AdherenceDistribution> {
    try {
      let excellent = 0;
      let good = 0;
      let fair = 0;
      let poor = 0;
      let totalScore = 0;

      for (const { score } of adherenceScores) {
        totalScore += score;

        if (score >= 90) {
          excellent++;
        } else if (score >= 70) {
          good++;
        } else if (score >= 50) {
          fair++;
        } else {
          poor++;
        }
      }

      const totalUsers = adherenceScores.length;
      const averageScore = totalUsers > 0 ? totalScore / totalUsers : 0;

      const distribution: AdherenceDistribution = {
        excellent,
        good,
        fair,
        poor,
        averageScore,
        totalUsers,
      };

      // Store distribution
      await this.storeMetrics('adherence', distribution);

      return distribution;
    } catch (error) {
      console.error('Error tracking adherence distribution:', error);
      throw error;
    }
  }

  // ============================================================================
  // COMPREHENSIVE ANALYTICS REPORT
  // ============================================================================

  /**
   * Generate comprehensive analytics report
   * Combines all metrics into a single report
   *
   * Requirements: 10.1
   */
  async generateAnalyticsReport(userId: string, days: number = 30): Promise<AnalyticsReport> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Gather all metrics
      const delivery = await this.trackDeliveryRate(userId, days);
      const actions = await this.trackActionRate(userId, days);
      const permissions = await this.getPermissionMetrics();

      // Get adherence distribution (would need to be calculated from all users)
      const adherence: AdherenceDistribution = {
        excellent: 0,
        good: 0,
        fair: 0,
        poor: 0,
        averageScore: 0,
        totalUsers: 1,
      };

      // Generate trends (simplified - would need historical data)
      const trends = {
        deliveryRate: await this.generateTrendData('deliveryRate', days),
        actionRate: await this.generateTrendData('actionRate', days),
        adherenceScore: await this.generateTrendData('adherenceScore', days),
      };

      const report: AnalyticsReport = {
        period: {
          start: startDate,
          end: endDate,
        },
        delivery,
        actions,
        permissions,
        adherence,
        trends,
        generatedAt: new Date(),
      };

      // Store report
      await this.storeAnalyticsReport(report);

      return report;
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  /**
   * Generate trend data for a metric
   */
  private async generateTrendData(metric: string, days: number): Promise<TimeSeriesDataPoint[]> {
    // This is a simplified implementation
    // In production, you would store historical metrics and retrieve them here
    const dataPoints: TimeSeriesDataPoint[] = [];

    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);

      // Placeholder value - would be actual historical data
      dataPoints.push({
        timestamp: date,
        value: 0,
      });
    }

    return dataPoints;
  }

  // ============================================================================
  // STORAGE AND RETRIEVAL
  // ============================================================================

  /**
   * Store metrics in AsyncStorage
   */
  private async storeMetrics(type: string, metrics: any): Promise<void> {
    try {
      const key = `${METRICS_KEY}:${type}`;
      await AsyncStorage.setItem(key, JSON.stringify(metrics));
    } catch (error) {
      console.error(`Error storing ${type} metrics:`, error);
    }
  }

  /**
   * Get stored metrics
   */
  async getStoredMetrics(type: string): Promise<any | null> {
    try {
      const key = `${METRICS_KEY}:${type}`;
      const json = await AsyncStorage.getItem(key);

      if (!json) {
        return null;
      }

      return JSON.parse(json);
    } catch (error) {
      console.error(`Error getting ${type} metrics:`, error);
      return null;
    }
  }

  /**
   * Store analytics report
   */
  private async storeAnalyticsReport(report: AnalyticsReport): Promise<void> {
    try {
      await AsyncStorage.setItem(ANALYTICS_KEY, JSON.stringify(report));
    } catch (error) {
      console.error('Error storing analytics report:', error);
    }
  }

  /**
   * Get latest analytics report
   */
  async getLatestAnalyticsReport(): Promise<AnalyticsReport | null> {
    try {
      const json = await AsyncStorage.getItem(ANALYTICS_KEY);

      if (!json) {
        return null;
      }

      const report = JSON.parse(json);

      // Convert date strings back to Date objects
      report.period.start = new Date(report.period.start);
      report.period.end = new Date(report.period.end);
      report.generatedAt = new Date(report.generatedAt);
      report.trends.deliveryRate = report.trends.deliveryRate.map((dp: any) => ({
        ...dp,
        timestamp: new Date(dp.timestamp),
      }));
      report.trends.actionRate = report.trends.actionRate.map((dp: any) => ({
        ...dp,
        timestamp: new Date(dp.timestamp),
      }));
      report.trends.adherenceScore = report.trends.adherenceScore.map((dp: any) => ({
        ...dp,
        timestamp: new Date(dp.timestamp),
      }));

      return report;
    } catch (error) {
      console.error('Error getting analytics report:', error);
      return null;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Get all notification types
   */
  private getAllNotificationTypes(): NotificationType[] {
    return [
      'daily_reminder',
      'dose_reminder',
      'washout_start',
      'washout_warning',
      'washout_end',
      'test_start',
    ];
  }

  /**
   * Clear all analytics data
   */
  async clearAnalytics(): Promise<void> {
    try {
      await AsyncStorage.removeItem(ANALYTICS_KEY);
      await AsyncStorage.removeItem(PERMISSION_TRACKING_KEY);

      // Clear all metrics
      for (const type of ['delivery', 'action', 'adherence']) {
        const key = `${METRICS_KEY}:${type}`;
        await AsyncStorage.removeItem(key);
      }
    } catch (error) {
      console.error('Error clearing analytics:', error);
    }
  }

  /**
   * Export analytics data for external analysis
   */
  async exportAnalytics(): Promise<string> {
    try {
      const report = await this.getLatestAnalyticsReport();
      const deliveryMetrics = await this.getStoredMetrics('delivery');
      const actionMetrics = await this.getStoredMetrics('action');
      const adherenceMetrics = await this.getStoredMetrics('adherence');
      const permissionMetrics = await this.getPermissionMetrics();

      const exportData = {
        report,
        metrics: {
          delivery: deliveryMetrics,
          action: actionMetrics,
          adherence: adherenceMetrics,
          permission: permissionMetrics,
        },
        exportedAt: new Date().toISOString(),
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting analytics:', error);
      throw error;
    }
  }
}

/**
 * Singleton instance for app-wide use
 */
export const notificationAnalytics = NotificationAnalytics.getInstance();
