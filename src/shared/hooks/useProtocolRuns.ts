import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, Query, ID } from '../../infrastructure/api/appwrite';
import type {
  ProtocolRun,
  CreateProtocolRunInput,
  UpdateProtocolRunInput,
} from '../types/entities';
import { notificationService } from '../../services/notifications/NotificationService';

/**
 * Hook to fetch all protocol runs for a specific user
 */
export function useProtocolRuns(userId: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.byUserId(userId),
    queryFn: async (): Promise<ProtocolRun[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        queries: [Query.equal('userId', [userId]), Query.orderDesc('createdAt')],
      });

      return rows.map((row) => ({
        ...row,
        startDate: new Date(row.startDate),
        endDate: row.endDate ? new Date(row.endDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as ProtocolRun[];
    },
    enabled: !!userId,
  });
}

/**
 * Hook to fetch a single protocol run by ID
 */
export function useProtocolRun(id: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.byId(id),
    queryFn: async (): Promise<ProtocolRun | null> => {
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.PROTOCOL_RUNS,
          rowId: id,
        });

        return {
          ...row,
          startDate: new Date(row.startDate),
          endDate: row.endDate ? new Date(row.endDate) : undefined,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
        } as ProtocolRun;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch the active protocol run for a specific user
 */
export function useActiveProtocolRun(userId: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.active(userId),
    queryFn: async (): Promise<ProtocolRun | null> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        queries: [
          Query.equal('userId', [userId]),
          Query.equal('status', ['active']),
          Query.limit(1),
        ],
      });

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        ...row,
        startDate: new Date(row.startDate),
        endDate: row.endDate ? new Date(row.endDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      } as ProtocolRun;
    },
    enabled: !!userId,
  });
}

/**
 * Hook to create a new protocol run
 */
export function useCreateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProtocolRunInput): Promise<ProtocolRun> => {
      const { id, ...rest } = data;

      const rowData = {
        ...rest,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate?.toISOString(),
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
        lastSyncAttempt: data.lastSyncAttempt?.toISOString(),
        syncStatus: data.syncStatus || 'pending',
      };

      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        rowId: id || ID.unique(),
        data: rowData,
      });

      return {
        ...row,
        startDate: new Date(row.startDate),
        endDate: row.endDate ? new Date(row.endDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      } as ProtocolRun;
    },
    onSuccess: (newProtocolRun) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.byUserId(newProtocolRun.userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.active(newProtocolRun.userId),
      });
      queryClient.setQueryData(queryKeys.protocolRuns.byId(newProtocolRun.id), newProtocolRun);
    },
  });
}

/**
 * Hook to update an existing protocol run
 */
export function useUpdateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
      previousStatus,
    }: {
      id: string;
      data: UpdateProtocolRunInput;
      previousStatus?: string;
    }): Promise<ProtocolRun> => {
      const rowData: any = { ...data };
      if (data.endDate) rowData.endDate = data.endDate.toISOString();
      if (data.updatedAt) rowData.updatedAt = data.updatedAt.toISOString();
      if (data.lastSyncAttempt) rowData.lastSyncAttempt = data.lastSyncAttempt.toISOString();

      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        rowId: id,
        data: rowData,
      });

      return {
        ...row,
        startDate: new Date(row.startDate),
        endDate: row.endDate ? new Date(row.endDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
        previousStatus,
      } as ProtocolRun & { previousStatus?: string };
    },
    onSuccess: async (updatedProtocolRun, { id, data, previousStatus }) => {
      queryClient.setQueryData(queryKeys.protocolRuns.byId(id), updatedProtocolRun);
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.byUserId(updatedProtocolRun.userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.active(updatedProtocolRun.userId),
      });

      // ============================================================================
      // NOTIFICATION INTEGRATION (Task 11.3)
      // ============================================================================

      try {
        // Handle protocol pause/resume
        // Requirements: 4.4, 4.5

        // If protocol was paused, cancel test start reminders
        if (data.status === 'paused' && previousStatus === 'active') {
          await notificationService.disableTestStartRemindersForProtocol(id);
        }

        // If protocol was resumed, re-enable test start reminders
        if (data.status === 'active' && previousStatus === 'paused') {
          // Fetch pending test steps for this protocol
          const { rows: testSteps } = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLES.TEST_STEPS,
            queries: [
              Query.equal('protocolRunId', [id]),
              Query.equal('status', ['pending']),
              Query.orderAsc('scheduledDate'),
            ],
          });

          // Map test steps to the format expected by the notification service
          const pendingTests = testSteps.map((step: any) => ({
            id: step.id,
            foodItemId: step.foodItemId,
            foodName: step.foodName,
            protocolRunId: id,
            availableDate: step.scheduledDate ? new Date(step.scheduledDate) : new Date(),
          }));

          await notificationService.enableTestStartRemindersForProtocol(id, pendingTests);
        }

        // Update schedules when protocol state changes
        // Requirements: 4.1
        if (data.status === 'active' && previousStatus !== 'active') {
          // Protocol became active - schedule test start reminders for pending tests
          const { rows: testSteps } = await tablesDB.listRows({
            databaseId: DATABASE_ID,
            tableId: TABLES.TEST_STEPS,
            queries: [
              Query.equal('protocolRunId', [id]),
              Query.equal('status', ['pending']),
              Query.orderAsc('scheduledDate'),
            ],
          });

          for (const step of testSteps) {
            await notificationService.scheduleTestStartReminder({
              id: step.id,
              foodItemId: step.foodItemId,
              foodName: step.foodName,
              protocolRunId: id,
              availableDate: step.scheduledDate ? new Date(step.scheduledDate) : new Date(),
            });
          }
        }
      } catch (error) {
        // Don't throw - notification integration is non-critical
        console.error('Error integrating with notification service:', error);
      }
    },
  });
}

/**
 * Hook to delete a protocol run
 */
export function useDeleteProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        rowId: id,
      });
    },
    onMutate: async (id) => {
      const protocolRun = queryClient.getQueryData<ProtocolRun>(queryKeys.protocolRuns.byId(id));
      return { protocolRun };
    },
    onSuccess: (_, id, context) => {
      queryClient.removeQueries({ queryKey: queryKeys.protocolRuns.byId(id) });
      if (context?.protocolRun) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocolRuns.byUserId(context.protocolRun.userId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocolRuns.active(context.protocolRun.userId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.all });
    },
  });
}
