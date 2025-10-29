/**
 * Notification Service Exports
 *
 * Central export point for notification infrastructure
 */

export * from './types';
export * from './NotificationConfig';
export * from './NotificationListeners';
export * from './NotificationService';
export * from './NotificationScheduler';
export * from './QuietHoursManager';
export * from './AdherenceAnalyzer';
export * from './NotificationHistoryRepository';
export * from './NotificationRetryQueue';
export * from './NotificationSync';
export * from './NotificationActionHandlers';
export * from './useNotificationSetup';
export * from './NotificationBatchScheduler';
export * from './NotificationStorageOptimizer';
export * from './NotificationAnalytics';
export {
  initializeNotifications,
  setupNotificationChannels,
  setupNotificationCategories,
  setupNotificationHandler,
} from './NotificationConfig';
export { notificationListeners, NotificationListeners } from './NotificationListeners';
export { notificationService, NotificationService } from './NotificationService';
export { notificationScheduler, NotificationScheduler } from './NotificationScheduler';
export { quietHoursManager, QuietHoursManager } from './QuietHoursManager';
export { AdherenceAnalyzer } from './AdherenceAnalyzer';
export {
  notificationHistoryRepository,
  NotificationHistoryRepository,
} from './NotificationHistoryRepository';
export { notificationRetryQueue, NotificationRetryQueue } from './NotificationRetryQueue';
export { syncNotificationPreferences, loadNotificationPreferences } from './NotificationSync';
export {
  notificationActionHandlers,
  NotificationActionHandlers,
} from './NotificationActionHandlers';
export {
  notificationBatchScheduler,
  NotificationBatchScheduler,
} from './NotificationBatchScheduler';
export {
  notificationStorageOptimizer,
  NotificationStorageOptimizer,
} from './NotificationStorageOptimizer';
export { notificationAnalytics, NotificationAnalytics } from './NotificationAnalytics';
