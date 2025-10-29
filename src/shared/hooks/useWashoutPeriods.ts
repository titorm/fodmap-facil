import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, Query, ID } from '../../infrastructure/api/appwrite';
import type {
  WashoutPeriod,
  CreateWashoutPeriodInput,
  UpdateWashoutPeriodInput,
} from '../types/entities';

/**
 * Hook to fetch all washout periods for a specific protocol run
 */
export function useWashoutPeriods(protocolRunId: string) {
  return useQuery({
    queryKey: queryKeys.washoutPeriods.byProtocolRunId(protocolRunId),
    queryFn: async (): Promise<WashoutPeriod[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.WASHOUT_PERIODS,
        queries: [Query.equal('protocolRunId', [protocolRunId]), Query.orderDesc('startDate')],
      });

      return rows.map((row) => ({
        ...row,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })) as WashoutPeriod[];
    },
    enabled: !!protocolRunId,
  });
}

/**
 * Hook to fetch a single washout period by ID
 */
export function useWashoutPeriod(id: string) {
  return useQuery({
    queryKey: queryKeys.washoutPeriods.byId(id),
    queryFn: async (): Promise<WashoutPeriod | null> => {
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.WASHOUT_PERIODS,
          rowId: id,
        });

        return {
          ...row,
          startDate: new Date(row.startDate),
          endDate: new Date(row.endDate),
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        } as WashoutPeriod;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch the active washout period for a specific protocol run
 */
export function useActiveWashoutPeriod(protocolRunId: string) {
  return useQuery({
    queryKey: queryKeys.washoutPeriods.active(protocolRunId),
    queryFn: async (): Promise<WashoutPeriod | null> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.WASHOUT_PERIODS,
        queries: [
          Query.equal('protocolRunId', [protocolRunId]),
          Query.equal('status', ['active']),
          Query.limit(1),
        ],
      });

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        ...row,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as WashoutPeriod;
    },
    enabled: !!protocolRunId,
  });
}

/**
 * Hook to create a new washout period
 */
export function useCreateWashoutPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWashoutPeriodInput): Promise<WashoutPeriod> => {
      const { id, ...rest } = data;

      const rowData = {
        ...rest,
        startDate: data.startDate.toISOString(),
        endDate: data.endDate.toISOString(),
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      };

      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.WASHOUT_PERIODS,
        rowId: id || ID.unique(),
        data: rowData,
      });

      return {
        ...row,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as WashoutPeriod;
    },
    onSuccess: (newWashoutPeriod) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.washoutPeriods.byProtocolRunId(newWashoutPeriod.protocolRunId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.washoutPeriods.active(newWashoutPeriod.protocolRunId),
      });
      queryClient.setQueryData(
        queryKeys.washoutPeriods.byId(newWashoutPeriod.id),
        newWashoutPeriod
      );
    },
  });
}

/**
 * Hook to update an existing washout period
 */
export function useUpdateWashoutPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateWashoutPeriodInput;
    }): Promise<WashoutPeriod> => {
      const rowData: any = { ...data };
      if (data.updatedAt) rowData.updatedAt = data.updatedAt.toISOString();

      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.WASHOUT_PERIODS,
        rowId: id,
        data: rowData,
      });

      return {
        ...row,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as WashoutPeriod;
    },
    onSuccess: (updatedWashoutPeriod, { id }) => {
      queryClient.setQueryData(queryKeys.washoutPeriods.byId(id), updatedWashoutPeriod);
      queryClient.invalidateQueries({
        queryKey: queryKeys.washoutPeriods.byProtocolRunId(updatedWashoutPeriod.protocolRunId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.washoutPeriods.active(updatedWashoutPeriod.protocolRunId),
      });
    },
  });
}

/**
 * Hook to delete a washout period
 */
export function useDeleteWashoutPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.WASHOUT_PERIODS,
        rowId: id,
      });
    },
    onMutate: async (id) => {
      const washoutPeriod = queryClient.getQueryData<WashoutPeriod>(
        queryKeys.washoutPeriods.byId(id)
      );
      return { washoutPeriod };
    },
    onSuccess: (_, id, context) => {
      queryClient.removeQueries({ queryKey: queryKeys.washoutPeriods.byId(id) });
      if (context?.washoutPeriod) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.washoutPeriods.byProtocolRunId(context.washoutPeriod.protocolRunId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.washoutPeriods.active(context.washoutPeriod.protocolRunId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.washoutPeriods.all });
    },
  });
}
