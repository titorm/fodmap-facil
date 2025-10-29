import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { SymptomEntryRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import { SyncQueue } from '../../services/SyncQueue';
import type { SymptomEntry, SymptomType } from '../../db/schema';

// Create repository instance
const symptomEntryRepository = new SymptomEntryRepository(db);

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
 * Hook to manage symptom logging with offline support
 *
 * Features:
 * - Auto-generates IDs for new symptom entries
 * - Saves to SQLite immediately
 * - Queues for Supabase sync when online (future implementation)
 * - Associates symptoms with current test step if provided
 * - Updates protocol state if severe symptoms detected (future implementation)
 * - Fetches recent symptoms for display
 *
 * @param testStepId - Optional test step ID to associate symptoms with
 * @returns Object with logSymptom function, recent symptoms, loading state, and error
 *
 * @example
 * ```tsx
 * const { logSymptom, recentSymptoms, isLogging } = useSymptomLogger(currentTestStepId);
 *
 * await logSymptom({
 *   symptomType: 'bloating',
 *   severity: 2,
 *   notes: 'Felt bloated after lunch'
 * });
 * ```
 */
export function useSymptomLogger(testStepId?: string): UseSymptomLoggerReturn {
  const queryClient = useQueryClient();

  // Fetch recent symptoms (last 20)
  const { data: recentSymptoms = [] } = useQuery({
    queryKey: queryKeys.symptomEntries.recent,
    queryFn: async (): Promise<SymptomEntry[]> => {
      if (!testStepId) return [];
      return await symptomEntryRepository.findByTestStepId(testStepId);
    },
    enabled: !!testStepId,
  });

  // Mutation for logging symptoms
  const mutation = useMutation({
    mutationFn: async (input: LogSymptomInput): Promise<SymptomEntry> => {
      // Map extended symptom types to database types
      // For now, map 'nausea' and 'other' to 'pain' as they're not in the schema
      // TODO: Update schema to include all symptom types
      const mappedSymptomType: SymptomType =
        input.symptomType === 'nausea' || input.symptomType === 'other'
          ? 'pain'
          : (input.symptomType as SymptomType);

      // Map severity (0-3) to database severity (1-10)
      // 0 (none) -> 1, 1 (mild) -> 3-4, 2 (moderate) -> 5-7, 3 (severe) -> 8-10
      const severityMap: Record<number, number> = {
        0: 1,
        1: 3,
        2: 6,
        3: 9,
      };
      const mappedSeverity = severityMap[input.severity];

      // Use provided testStepId or the one from hook parameter
      const finalTestStepId = input.testStepId || testStepId;

      if (!finalTestStepId) {
        throw new Error('Test step ID is required to log symptoms');
      }

      // Create symptom entry
      const symptomEntry = await symptomEntryRepository.create({
        testStepId: finalTestStepId,
        symptomType: mappedSymptomType,
        severity: mappedSeverity,
        timestamp: new Date(),
        notes: input.notes,
      });

      // Queue for Supabase sync when online
      await SyncQueue.enqueue({
        type: 'symptom_entry',
        entityId: symptomEntry.id,
        operation: 'create',
        data: symptomEntry,
      });

      // TODO: Update protocol state if severe symptoms detected (severity === 3)

      return symptomEntry;
    },
    onSuccess: (newSymptomEntry) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.byTestStepId(newSymptomEntry.testStepId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.recent,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.all,
      });

      // Set the new symptom entry in cache
      queryClient.setQueryData(queryKeys.symptomEntries.byId(newSymptomEntry.id), newSymptomEntry);
    },
  });

  return {
    logSymptom: mutation.mutateAsync,
    recentSymptoms,
    isLogging: mutation.isPending,
    error: mutation.error,
  };
}
