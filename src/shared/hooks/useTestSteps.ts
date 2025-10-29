import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, Query, ID } from '../../infrastructure/api/appwrite';
import type {
  TestStep,
  TestStepStatus,
  CreateTestStepInput,
  UpdateTestStepInput,
} from '../types/entities';

/**
 * Hook to fetch all test steps for a specific protocol run
 */
export function useTestSteps(protocolRunId: string) {
  return useQuery({
    queryKey: queryKeys.testSteps.byProtocolRunId(protocolRunId),
    queryFn: async (): Promise<TestStep[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        queries: [Query.equal('protocolRunId', [protocolRunId]), Query.orderAsc('sequenceNumber')],
      });

      return rows.map((row) => ({
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as TestStep[];
    },
    enabled: !!protocolRunId,
  });
}

/**
 * Hook to fetch a single test step by ID
 */
export function useTestStep(id: string) {
  return useQuery({
    queryKey: queryKeys.testSteps.byId(id),
    queryFn: async (): Promise<TestStep | null> => {
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.TEST_STEPS,
          rowId: id,
        });

        return {
          ...row,
          scheduledDate: new Date(row.scheduledDate),
          completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
        } as TestStep;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch test steps filtered by status
 */
export function useTestStepsByStatus(status: TestStepStatus) {
  return useQuery({
    queryKey: queryKeys.testSteps.byStatus(status),
    queryFn: async (): Promise<TestStep[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        queries: [Query.equal('status', [status]), Query.orderAsc('scheduledDate')],
      });

      return rows.map((row) => ({
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as TestStep[];
    },
    enabled: !!status,
  });
}

/**
 * Hook to create a new test step
 */
export function useCreateTestStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTestStepInput): Promise<TestStep> => {
      const { id, ...rest } = data;

      const rowData = {
        ...rest,
        scheduledDate: data.scheduledDate.toISOString(),
        completedDate: data.completedDate?.toISOString(),
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
        lastSyncAttempt: data.lastSyncAttempt?.toISOString(),
        syncStatus: data.syncStatus || 'pending',
      };

      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        rowId: id || ID.unique(),
        data: rowData,
      });

      return {
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      } as TestStep;
    },
    onSuccess: (newTestStep) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSteps.byProtocolRunId(newTestStep.protocolRunId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSteps.byStatus(newTestStep.status),
      });
      queryClient.setQueryData(queryKeys.testSteps.byId(newTestStep.id), newTestStep);
    },
  });
}

/**
 * Hook to update an existing test step
 */
export function useUpdateTestStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTestStepInput;
    }): Promise<TestStep> => {
      const rowData: any = { ...data };
      if (data.completedDate) rowData.completedDate = data.completedDate.toISOString();
      if (data.updatedAt) rowData.updatedAt = data.updatedAt.toISOString();
      if (data.lastSyncAttempt) rowData.lastSyncAttempt = data.lastSyncAttempt.toISOString();

      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        rowId: id,
        data: rowData,
      });

      return {
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      } as TestStep;
    },
    onSuccess: (updatedTestStep, { id }) => {
      queryClient.setQueryData(queryKeys.testSteps.byId(id), updatedTestStep);
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSteps.byProtocolRunId(updatedTestStep.protocolRunId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSteps.byStatus(updatedTestStep.status),
      });
    },
  });
}

/**
 * Hook to delete a test step
 */
export function useDeleteTestStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        rowId: id,
      });
    },
    onMutate: async (id) => {
      const testStep = queryClient.getQueryData<TestStep>(queryKeys.testSteps.byId(id));
      return { testStep };
    },
    onSuccess: (_, id, context) => {
      queryClient.removeQueries({ queryKey: queryKeys.testSteps.byId(id) });
      if (context?.testStep) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.testSteps.byProtocolRunId(context.testStep.protocolRunId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.testSteps.byStatus(context.testStep.status),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.all });
    },
  });
}
