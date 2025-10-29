import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, Query, ID } from '../../infrastructure/api/appwrite';
import type { SymptomEntry, CreateSymptomEntryInput } from '../types/entities';

/**
 * Hook to fetch all symptom entries for a specific test step
 */
export function useSymptomEntries(testStepId: string) {
  return useQuery({
    queryKey: queryKeys.symptomEntries.byTestStepId(testStepId),
    queryFn: async (): Promise<SymptomEntry[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [Query.equal('testStepId', [testStepId]), Query.orderDesc('timestamp')],
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
}

/**
 * Hook to fetch a single symptom entry by ID
 */
export function useSymptomEntry(id: string) {
  return useQuery({
    queryKey: queryKeys.symptomEntries.byId(id),
    queryFn: async (): Promise<SymptomEntry | null> => {
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.SYMPTOM_ENTRIES,
          rowId: id,
        });

        return {
          ...row,
          timestamp: new Date(row.timestamp),
          createdAt: new Date(row.createdAt),
          lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
        } as SymptomEntry;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch symptom entries within a date range for a specific test step
 */
export function useSymptomEntriesByDateRange(testStepId: string, startDate: Date, endDate: Date) {
  return useQuery({
    queryKey: queryKeys.symptomEntries.byDateRange(testStepId, startDate, endDate),
    queryFn: async (): Promise<SymptomEntry[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [
          Query.equal('testStepId', [testStepId]),
          Query.greaterThanEqual('timestamp', startDate.toISOString()),
          Query.lessThanEqual('timestamp', endDate.toISOString()),
          Query.orderDesc('timestamp'),
        ],
      });

      return rows.map((row) => ({
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as SymptomEntry[];
    },
    enabled: !!testStepId && !!startDate && !!endDate,
  });
}

/**
 * Hook to create a new symptom entry
 */
export function useCreateSymptomEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSymptomEntryInput): Promise<SymptomEntry> => {
      const { id, ...rest } = data;

      const rowData = {
        ...rest,
        timestamp: data.timestamp.toISOString(),
        createdAt: data.createdAt.toISOString(),
        lastSyncAttempt: data.lastSyncAttempt?.toISOString(),
        syncStatus: data.syncStatus || 'pending',
      };

      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        rowId: id || ID.unique(),
        data: rowData,
      });

      return {
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      } as SymptomEntry;
    },
    onSuccess: (newSymptomEntry) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.byTestStepId(newSymptomEntry.testStepId),
      });
      queryClient.setQueryData(queryKeys.symptomEntries.byId(newSymptomEntry.id), newSymptomEntry);
      queryClient.invalidateQueries({ queryKey: queryKeys.symptomEntries.all });
    },
  });
}

/**
 * Hook to delete a symptom entry
 */
export function useDeleteSymptomEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        rowId: id,
      });
    },
    onMutate: async (id) => {
      const symptomEntry = queryClient.getQueryData<SymptomEntry>(
        queryKeys.symptomEntries.byId(id)
      );
      return { symptomEntry };
    },
    onSuccess: (_, id, context) => {
      queryClient.removeQueries({ queryKey: queryKeys.symptomEntries.byId(id) });
      if (context?.symptomEntry) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.symptomEntries.byTestStepId(context.symptomEntry.testStepId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.symptomEntries.all });
    },
  });
}
