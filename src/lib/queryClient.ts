import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query Client Configuration
 *
 * Configured with offline-first strategy:
 * - 5 minute staleTime for data freshness
 * - 10 minute gcTime for inactive query cleanup
 * - 3 retry attempts with exponential backoff
 * - Automatic refetch on window focus and reconnect
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000, // 5 minutes

      // Inactive queries are garbage collected after 10 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)

      // Retry failed queries 3 times with exponential backoff
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch when app returns to foreground for data freshness
      refetchOnWindowFocus: true,

      // Refetch when network reconnects for offline recovery
      refetchOnReconnect: true,

      // Refetch when component mounts
      refetchOnMount: true,
    },
    mutations: {
      // Retry mutations once on failure
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Query Key Factory
 *
 * Provides consistent, type-safe query keys for all entities.
 * Uses hierarchical structure for efficient cache invalidation.
 *
 * Example usage:
 * - queryKeys.userProfiles.all - Invalidates all user profile queries
 * - queryKeys.userProfiles.byId(id) - Specific user profile
 * - queryKeys.protocolRuns.byUserId(userId) - All protocol runs for a user
 */
export const queryKeys = {
  /**
   * User Profile query keys
   */
  userProfiles: {
    all: ['userProfiles'] as const,
    byId: (id: string) => [...queryKeys.userProfiles.all, id] as const,
    byEmail: (email: string) => [...queryKeys.userProfiles.all, 'email', email] as const,
  },

  /**
   * Protocol Run query keys
   */
  protocolRuns: {
    all: ['protocolRuns'] as const,
    byId: (id: string) => [...queryKeys.protocolRuns.all, id] as const,
    byUserId: (userId: string) => [...queryKeys.protocolRuns.all, 'user', userId] as const,
    active: (userId: string) => [...queryKeys.protocolRuns.all, 'active', userId] as const,
  },

  /**
   * Test Step query keys
   */
  testSteps: {
    all: ['testSteps'] as const,
    byId: (id: string) => [...queryKeys.testSteps.all, id] as const,
    byProtocolRunId: (protocolRunId: string) =>
      [...queryKeys.testSteps.all, 'protocolRun', protocolRunId] as const,
    byStatus: (status: string) => [...queryKeys.testSteps.all, 'status', status] as const,
  },

  /**
   * Symptom Entry query keys
   */
  symptomEntries: {
    all: ['symptomEntries'] as const,
    byId: (id: string) => [...queryKeys.symptomEntries.all, id] as const,
    byTestStepId: (testStepId: string) =>
      [...queryKeys.symptomEntries.all, 'testStep', testStepId] as const,
    byDateRange: (testStepId: string, startDate: Date, endDate: Date) =>
      [
        ...queryKeys.symptomEntries.all,
        'testStep',
        testStepId,
        'dateRange',
        startDate.toISOString(),
        endDate.toISOString(),
      ] as const,
    recent: ['symptomEntries', 'recent'] as const,
  },

  /**
   * Washout Period query keys
   */
  washoutPeriods: {
    all: ['washoutPeriods'] as const,
    byId: (id: string) => [...queryKeys.washoutPeriods.all, id] as const,
    byProtocolRunId: (protocolRunId: string) =>
      [...queryKeys.washoutPeriods.all, 'protocolRun', protocolRunId] as const,
    active: (protocolRunId: string) =>
      [...queryKeys.washoutPeriods.all, 'active', protocolRunId] as const,
  },

  /**
   * Food Item query keys
   */
  foodItems: {
    all: ['foodItems'] as const,
    byId: (id: string) => [...queryKeys.foodItems.all, id] as const,
    byFodmapGroup: (group: string) => [...queryKeys.foodItems.all, 'group', group] as const,
  },

  /**
   * Group Result query keys
   */
  groupResults: {
    all: ['groupResults'] as const,
    byId: (id: string) => [...queryKeys.groupResults.all, id] as const,
    byProtocolRunId: (protocolRunId: string) =>
      [...queryKeys.groupResults.all, 'protocolRun', protocolRunId] as const,
  },

  /**
   * Notification Schedule query keys
   */
  notificationSchedules: {
    all: ['notificationSchedules'] as const,
    byId: (id: string) => [...queryKeys.notificationSchedules.all, id] as const,
    byTestStepId: (testStepId: string) =>
      [...queryKeys.notificationSchedules.all, 'testStep', testStepId] as const,
    pending: ['notificationSchedules', 'pending'] as const,
  },
};
