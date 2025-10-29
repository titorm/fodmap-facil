/**
 * useReportData - React Query hook for fetching report data
 */

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { reportService } from '../../../services/reporting/ReportService';
import type {
  ToleranceProfile,
  TestHistoryItem,
  SymptomTimelineData,
  ReportMetrics,
  FullReportData,
  DateRange,
} from '../types';

const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
const STALE_TIME = 2 * 60 * 1000; // 2 minutes

/**
 * Hook to fetch tolerance profile
 */
export function useToleranceProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'tolerance', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return reportService.getToleranceProfile(userId);
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });
}

/**
 * Hook to fetch test history
 */
export function useTestHistory(userId: string | undefined, options?: { limit?: number }) {
  return useQuery({
    queryKey: ['reports', 'history', userId, options],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return reportService.getTestHistory(userId, options);
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });
}

/**
 * Hook to fetch symptom timeline
 */
export function useSymptomTimeline(userId: string | undefined, dateRange?: DateRange) {
  return useQuery({
    queryKey: ['reports', 'timeline', userId, dateRange],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return reportService.getSymptomTimeline(userId, dateRange);
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });
}

/**
 * Hook to fetch report metrics
 */
export function useReportMetrics(protocolRunId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'metrics', protocolRunId],
    queryFn: () => {
      if (!protocolRunId) throw new Error('Protocol run ID is required');
      return reportService.calculateMetrics(protocolRunId);
    },
    enabled: !!protocolRunId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });
}

/**
 * Hook to fetch full report data (for PDF export)
 */
export function useFullReport(userId: string | undefined) {
  return useQuery({
    queryKey: ['reports', 'full', userId],
    queryFn: () => {
      if (!userId) throw new Error('User ID is required');
      return reportService.getFullReport(userId);
    },
    enabled: !!userId,
    staleTime: STALE_TIME,
    gcTime: CACHE_TIME,
    retry: 2,
  });
}

/**
 * Combined hook for all report data
 */
export function useReportData(userId: string | undefined) {
  const toleranceQuery = useToleranceProfile(userId);
  const historyQuery = useTestHistory(userId);
  const timelineQuery = useSymptomTimeline(userId);
  const fullReportQuery = useFullReport(userId);

  const isLoading = toleranceQuery.isLoading || historyQuery.isLoading || timelineQuery.isLoading;
  const isError = toleranceQuery.isError || historyQuery.isError || timelineQuery.isError;
  const error = toleranceQuery.error || historyQuery.error || timelineQuery.error || null;

  return {
    tolerance: {
      data: toleranceQuery.data,
      isLoading: toleranceQuery.isLoading,
      isError: toleranceQuery.isError,
      error: toleranceQuery.error,
      refetch: toleranceQuery.refetch,
    },
    history: {
      data: historyQuery.data,
      isLoading: historyQuery.isLoading,
      isError: historyQuery.isError,
      error: historyQuery.error,
      refetch: historyQuery.refetch,
    },
    timeline: {
      data: timelineQuery.data,
      isLoading: timelineQuery.isLoading,
      isError: timelineQuery.isError,
      error: timelineQuery.error,
      refetch: timelineQuery.refetch,
    },
    fullReport: {
      data: fullReportQuery.data,
      isLoading: fullReportQuery.isLoading,
      isError: fullReportQuery.isError,
      error: fullReportQuery.error,
      refetch: fullReportQuery.refetch,
    },
    isLoading,
    isError,
    error,
    refetchAll: async () => {
      await Promise.all([
        toleranceQuery.refetch(),
        historyQuery.refetch(),
        timelineQuery.refetch(),
      ]);
    },
  };
}

/**
 * Hook to invalidate report cache
 * Use this when data changes that should trigger report updates
 */
export function useInvalidateReports() {
  const queryClient = useQueryClient();

  return {
    // Invalidate all report data
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
    },

    // Invalidate specific report sections
    invalidateTolerance: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'tolerance', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
    },

    invalidateHistory: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'history', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
    },

    invalidateTimeline: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'timeline', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
    },

    // Invalidate on symptom entry (affects timeline and metrics)
    invalidateOnSymptomEntry: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'timeline', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
    },

    // Invalidate on test completion (affects all sections)
    invalidateOnTestCompletion: (userId: string) => {
      queryClient.invalidateQueries({ queryKey: ['reports', 'tolerance', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'history', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'timeline', userId] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'metrics'] });
      queryClient.invalidateQueries({ queryKey: ['reports', 'full', userId] });
    },
  };
}
