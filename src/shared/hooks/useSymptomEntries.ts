import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { SymptomEntryRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import type { SymptomEntry, CreateSymptomEntryInput } from '../../db/schema';

// Create repository instance
const symptomEntryRepository = new SymptomEntryRepository(db);

/**
 * Hook to fetch all symptom entries for a specific test step
 *
 * @param testStepId - The test step ID to fetch symptom entries for
 * @returns Query result with array of symptom entries, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: symptomEntries, isLoading, error } = useSymptomEntries(testStepId);
 * ```
 */
export function useSymptomEntries(testStepId: string) {
  return useQuery({
    queryKey: queryKeys.symptomEntries.byTestStepId(testStepId),
    queryFn: async (): Promise<SymptomEntry[]> => {
      return await symptomEntryRepository.findByTestStepId(testStepId);
    },
    enabled: !!testStepId,
  });
}

/**
 * Hook to fetch a single symptom entry by ID
 *
 * @param id - The symptom entry ID to fetch
 * @returns Query result with symptom entry data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: symptomEntry, isLoading, error } = useSymptomEntry(symptomEntryId);
 * ```
 */
export function useSymptomEntry(id: string) {
  return useQuery({
    queryKey: queryKeys.symptomEntries.byId(id),
    queryFn: async (): Promise<SymptomEntry | null> => {
      return await symptomEntryRepository.findById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch symptom entries within a date range for a specific test step
 *
 * @param testStepId - The test step ID to fetch symptom entries for
 * @param startDate - The start date of the range (inclusive)
 * @param endDate - The end date of the range (inclusive)
 * @returns Query result with array of symptom entries, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: symptomEntries, isLoading, error } = useSymptomEntriesByDateRange(
 *   testStepId,
 *   new Date('2024-01-01'),
 *   new Date('2024-01-31')
 * );
 * ```
 */
export function useSymptomEntriesByDateRange(testStepId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: queryKeys.symptomEntries.byDateRange(testStepId, startDate, endDate),
    queryFn: async (): Promise<SymptomEntry[]> => {
      return await symptomEntryRepository.findByDateRange(testStepId, startDate, endDate);
    },
    enabled: !!testStepId && !!startDate && !!endDate,
  });
}

/**
 * Hook to create a new symptom entry
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const createMutation = useCreateSymptomEntry();
 * await createMutation.mutateAsync({
 *   testStepId: 'step-123',
 *   symptomType: 'bloating',
 *   severity: 7,
 *   timestamp: new Date(),
 *   notes: 'Felt bloated after lunch'
 * });
 * ```
 */
export function useCreateSymptomEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSymptomEntryInput): Promise<SymptomEntry> => {
      return await symptomEntryRepository.create(data);
    },
    onSuccess: (newSymptomEntry) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.byTestStepId(newSymptomEntry.testStepId),
      });

      // Set the new symptom entry in cache
      queryClient.setQueryData(queryKeys.symptomEntries.byId(newSymptomEntry.id), newSymptomEntry);

      // Invalidate all symptom entries
      queryClient.invalidateQueries({ queryKey: queryKeys.symptomEntries.all });
    },
  });
}

/**
 * Hook to delete a symptom entry
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteSymptomEntry();
 * await deleteMutation.mutateAsync('symptom-123');
 * ```
 */
export function useDeleteSymptomEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await symptomEntryRepository.delete(id);
    },
    onMutate: async (id) => {
      // Get the symptom entry before deletion to know which caches to invalidate
      const symptomEntry = queryClient.getQueryData<SymptomEntry>(
        queryKeys.symptomEntries.byId(id)
      );
      return { symptomEntry };
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.symptomEntries.byId(id) });

      // Invalidate related queries
      if (context?.symptomEntry) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.symptomEntries.byTestStepId(context.symptomEntry.testStepId),
        });
      }

      // Invalidate all symptom entries
      queryClient.invalidateQueries({ queryKey: queryKeys.symptomEntries.all });
    },
  });
}
