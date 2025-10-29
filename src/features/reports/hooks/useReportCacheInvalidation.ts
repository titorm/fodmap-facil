/**
 * useReportCacheInvalidation - Automatic cache invalidation for reports
 *
 * This hook provides utilities to automatically invalidate report cache
 * when related data changes (symptoms, test completions, etc.)
 */

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface UseReportCacheInvalidationOptions {
  userId?: string;
  enabled?: boolean;
}

/**
 * Hook to automatically invalidate report cache based on data changes
 */
export function useReportCacheInvalidation(options: UseReportCacheInvalidationOptions = {}) {
  const { userId, enabled = true } = options;
  const queryClient = useQueryClient();

  // Set up automatic invalidation on symptom entry mutations
  useEffect(() => {
    if (!enabled || !userId) return;

    // Listen for symptom entry mutations
    const unsubscribe = queryClient.getMutationCache().subscribe((event) => {
      if (event?.type === 'success') {
        const mutation = event.mutation;

        // Check if this is a symptom entry mutation
        if (mutation.options.mutationKey?.[0] === 'createSymptomEntry') {
          console.log('[ReportCache] Invalidating timeline on symptom entry');
          queryClient.invalidateQueries({ queryKey: ['reports', 'timeline', userId] });
          queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
        }

        // Check if this is a test completion mutation
        if (
          mutation.options.mutationKey?.[0] === 'updateTestStep' ||
          mutation.options.mutationKey?.[0] === 'completeTest'
        ) {
          console.log('[ReportCache] Invalidating all reports on test completion');
          queryClient.invalidateQueries({ queryKey: ['reports', 'tolerance', userId] });
          queryClient.invalidateQueries({ queryKey: ['reports', 'history', userId] });
          queryClient.invalidateQueries({ queryKey: ['reports', 'timeline', userId] });
          queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [enabled, userId, queryClient]);

  return {
    // Manual invalidation methods
    invalidateOnSymptomEntry: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ['reports', 'timeline', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
    },

    invalidateOnTestCompletion: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ['reports', 'tolerance', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'history', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'timeline', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
    },

    invalidateAll: () => {
      if (!userId) return;
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },
  };
}

/**
 * Hook to prefetch report data for better performance
 */
export function usePrefetchReports(userId: string | undefined) {
  const queryClient = useQueryClient();

  const prefetchTolerance = () => {
    if (!userId) return;
    queryClient.prefetchQuery({
      queryKey: ['reports', 'tolerance', userId],
      staleTime: 5 * 60 * 1000, // 5 minutes
    });
  };

  const prefetchHistory = () => {
    if (!userId) return;
    queryClient.prefetchQuery({
      queryKey: ['reports', 'history', userId],
      staleTime: 5 * 60 * 1000,
    });
  };

  const prefetchTimeline = () => {
    if (!userId) return;
    queryClient.prefetchQuery({
      queryKey: ['reports', 'timeline', userId],
      staleTime: 5 * 60 * 1000,
    });
  };

  return {
    prefetchTolerance,
    prefetchHistory,
    prefetchTimeline,
    prefetchAll: () => {
      prefetchTolerance();
      prefetchHistory();
      prefetchTimeline();
    },
  };
}
