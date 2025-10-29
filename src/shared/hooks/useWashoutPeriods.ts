import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { WashoutPeriodRepository } from '../../services/repositories/WashoutPeriodRepository';
import { db } from '../../infrastructure/database/client';
import type {
  WashoutPeriod,
  CreateWashoutPeriodInput,
  UpdateWashoutPeriodInput,
} from '../../db/schema';

// Create repository instance
const washoutPeriodRepository = new WashoutPeriodRepository(db);

/**
 * Hook to fetch all washout periods for a specific protocol run
 *
 * @param protocolRunId - The protocol run ID to fetch washout periods for
 * @returns Query result with array of washout periods, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: washoutPeriods, isLoading, error } = useWashoutPeriods(protocolRunId);
 * ```
 */
export function useWashoutPeriods(protocolRunId: string) {
  return useQuery({
    queryKey: queryKeys.washoutPeriods.byProtocolRunId(protocolRunId),
    queryFn: async (): Promise<WashoutPeriod[]> => {
      return await washoutPeriodRepository.findByProtocolRun(protocolRunId);
    },
    enabled: !!protocolRunId,
  });
}

/**
 * Hook to fetch a single washout period by ID
 *
 * @param id - The washout period ID to fetch
 * @returns Query result with washout period data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: washoutPeriod, isLoading, error } = useWashoutPeriod(washoutPeriodId);
 * ```
 */
export function useWashoutPeriod(id: string) {
  return useQuery({
    queryKey: queryKeys.washoutPeriods.byId(id),
    queryFn: async (): Promise<WashoutPeriod | null> => {
      return await washoutPeriodRepository.findById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch the active washout period for a specific protocol run
 *
 * @param protocolRunId - The protocol run ID to fetch the active washout period for
 * @returns Query result with active washout period data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: activeWashout, isLoading, error } = useActiveWashoutPeriod(protocolRunId);
 * ```
 */
export function useActiveWashoutPeriod(protocolRunId: string) {
  return useQuery({
    queryKey: queryKeys.washoutPeriods.active(protocolRunId),
    queryFn: async (): Promise<WashoutPeriod | null> => {
      return await washoutPeriodRepository.findActive(protocolRunId);
    },
    enabled: !!protocolRunId,
  });
}

/**
 * Hook to create a new washout period
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const createMutation = useCreateWashoutPeriod();
 * await createMutation.mutateAsync({
 *   protocolRunId: 'protocol-123',
 *   startDate: new Date(),
 *   endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
 *   status: 'active'
 * });
 * ```
 */
export function useCreateWashoutPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      data: Omit<CreateWashoutPeriodInput, 'id' | 'createdAt' | 'updatedAt'>
    ): Promise<WashoutPeriod> => {
      return await washoutPeriodRepository.create(data);
    },
    onSuccess: (newWashoutPeriod) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.washoutPeriods.byProtocolRunId(newWashoutPeriod.protocolRunId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.washoutPeriods.active(newWashoutPeriod.protocolRunId),
      });

      // Set the new washout period in cache
      queryClient.setQueryData(
        queryKeys.washoutPeriods.byId(newWashoutPeriod.id),
        newWashoutPeriod
      );
    },
  });
}

/**
 * Hook to update an existing washout period
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateWashoutPeriod();
 * await updateMutation.mutateAsync({
 *   id: 'washout-123',
 *   data: { status: 'completed' }
 * });
 * ```
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
      return await washoutPeriodRepository.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.washoutPeriods.byId(id) });

      // Snapshot previous value
      const previousWashoutPeriod = queryClient.getQueryData<WashoutPeriod>(
        queryKeys.washoutPeriods.byId(id)
      );

      // Optimistically update
      if (previousWashoutPeriod) {
        queryClient.setQueryData(queryKeys.washoutPeriods.byId(id), {
          ...previousWashoutPeriod,
          ...data,
          updatedAt: new Date(),
        });
      }

      return { previousWashoutPeriod };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousWashoutPeriod) {
        queryClient.setQueryData(queryKeys.washoutPeriods.byId(id), context.previousWashoutPeriod);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.washoutPeriods.byId(id) });

      // Also invalidate protocol run's washout periods and active washout period
      if (data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.washoutPeriods.byProtocolRunId(data.protocolRunId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.washoutPeriods.active(data.protocolRunId),
        });
      }
    },
  });
}

/**
 * Hook to delete a washout period
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteWashoutPeriod();
 * await deleteMutation.mutateAsync('washout-123');
 * ```
 */
export function useDeleteWashoutPeriod() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await washoutPeriodRepository.delete(id);
    },
    onMutate: async (id) => {
      // Get the washout period before deletion to know which caches to invalidate
      const washoutPeriod = queryClient.getQueryData<WashoutPeriod>(
        queryKeys.washoutPeriods.byId(id)
      );
      return { washoutPeriod };
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.washoutPeriods.byId(id) });

      // Invalidate related queries
      if (context?.washoutPeriod) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.washoutPeriods.byProtocolRunId(context.washoutPeriod.protocolRunId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.washoutPeriods.active(context.washoutPeriod.protocolRunId),
        });
      }

      // Invalidate all washout periods
      queryClient.invalidateQueries({ queryKey: queryKeys.washoutPeriods.all });
    },
  });
}
