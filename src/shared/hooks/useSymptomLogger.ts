import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, ID } from '../../infrastructure/api/appwrite';
import type { SymptomEntry, SymptomType } from '../types/entities';
import { notificationService } from '../../services/notifications/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LogSymptomInput {
  testStepId?: string;
  symptomType: SymptomType | 'nausea' | 'other';
  severity: 0 | 1 | 2 | 3; // none, mild, moderate, severe
  notes?: string;
}

export interface UseSymptomLoggerReturn {
  logSymptom: (input: LogSymptomInput) => Promise<SymptomEntry>;
  recentSymptoms: SymptomEntry[];
  isLogging: boolean;
  error: Error | null;
}

/**
 * Hook to manage symptom logging
 */
export function useSymptomLogger(testStepId?: string): UseSymptomLoggerReturn {
  const queryClient = useQueryClient();

  // Fetch recent symptoms
  const { data: recentSymptoms = [] } = useQuery({
    queryKey: queryKeys.symptomEntries.recent,
    queryFn: async (): Promise<SymptomEntry[]> => {
      if (!testStepId) return [];

      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [
          // Query.equal('testStepId', [testStepId]),
          // Query.orderDesc('timestamp'),
          // Query.limit(20),
        ],
      });

      return rows.map((row) => ({
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as SymptomEntry[];
    },
    enabled: !!testStepId,
  });

  // Mutation for logging symptoms
  const mutation = useMutation({
    mutationFn: async (input: LogSymptomInput): Promise<SymptomEntry> => {
      // Map extended symptom types to database types
      const mappedSymptomType: SymptomType =
        input.symptomType === 'nausea' || input.symptomType === 'other'
          ? 'pain'
          : (input.symptomType as SymptomType);

      // Map severity (0-3) to database severity (1-10)
      const severityMap: Record<number, number> = {
        0: 1,
        1: 3,
        2: 6,
        3: 9,
      };
      const mappedSeverity = severityMap[input.severity];

      const finalTestStepId = input.testStepId || testStepId;

      if (!finalTestStepId) {
        throw new Error('Test step ID is required to log symptoms');
      }

      const now = new Date();
      const rowData = {
        testStepId: finalTestStepId,
        symptomType: mappedSymptomType,
        severity: mappedSeverity,
        timestamp: now.toISOString(),
        notes: input.notes,
        createdAt: now.toISOString(),
        syncStatus: 'synced',
      };

      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        rowId: ID.unique(),
        data: rowData,
      });

      return {
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      } as SymptomEntry;
    },
    onSuccess: async (newSymptomEntry) => {
      // Invalidate queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.byTestStepId(newSymptomEntry.testStepId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.recent,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.all,
      });
      queryClient.setQueryData(queryKeys.symptomEntries.byId(newSymptomEntry.id), newSymptomEntry);

      // ============================================================================
      // NOTIFICATION INTEGRATION (Task 11.1)
      // ============================================================================

      try {
        // 1. Cancel daily reminder for today since symptoms were logged
        // Requirements: 1.2
        await notificationService.cancelDailyReminderForToday();

        // 2. Track symptom logging for adherence analysis
        // Requirements: 6.1
        const userId = await AsyncStorage.getItem('@auth:userId');
        if (userId) {
          // Update adherence score after logging
          // Requirements: 6.1
          await notificationService.adjustNotificationFrequency(userId);
        }
      } catch (error) {
        // Don't throw - notification integration is non-critical
        console.error('Error integrating with notification service:', error);
      }
    },
  });

  return {
    logSymptom: mutation.mutateAsync,
    recentSymptoms,
    isLogging: mutation.isPending,
    error: mutation.error,
  };
}
