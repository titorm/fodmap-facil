import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { ProtocolRunRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import type { ProtocolRun, CreateProtocolRunInput, UpdateProtocolRunInput } from '../../db/schema';

// Create repository instance
const protocolRunRepository = new ProtocolRunRepository(db);

/**
 * Hook to fetch all protocol runs for a specific user
 *
 * @param userId - The user ID to fetch protocol runs for
 * @returns Query result with array of protocol runs, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: protocolRuns, isLoading, error } = useProtocolRuns(userId);
 * ```
 */
export function useProtocolRuns(userId: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.byUserId(userId),
    queryFn: async (): Promise<ProtocolRun[]> => {
      return await protocolRunRepository.findByUserId(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Hook to fetch a single protocol run by ID
 *
 * @param id - The protocol run ID to fetch
 * @returns Query result with protocol run data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: protocolRun, isLoading, error } = useProtocolRun(protocolRunId);
 * ```
 */
export function useProtocolRun(id: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.byId(id),
    queryFn: async (): Promise<ProtocolRun | null> => {
      return await protocolRunRepository.findById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch the active protocol run for a specific user
 *
 * @param userId - The user ID to fetch the active protocol run for
 * @returns Query result with active protocol run data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: activeProtocolRun, isLoading, error } = useActiveProtocolRun(userId);
 * ```
 */
export function useActiveProtocolRun(userId: string) {
  return useQuery({
    queryKey: queryKeys.protocolRuns.active(userId),
    queryFn: async (): Promise<ProtocolRun | null> => {
      return await protocolRunRepository.findActive(userId);
    },
    enabled: !!userId,
  });
}

/**
 * Hook to create a new protocol run
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const createMutation = useCreateProtocolRun();
 * await createMutation.mutateAsync({
 *   userId: 'user-123',
 *   status: 'planned',
 *   startDate: new Date(),
 *   notes: 'Starting FODMAP reintroduction'
 * });
 * ```
 */
export function useCreateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateProtocolRunInput): Promise<ProtocolRun> => {
      return await protocolRunRepository.create(data);
    },
    onSuccess: (newProtocolRun) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.byUserId(newProtocolRun.userId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.protocolRuns.active(newProtocolRun.userId),
      });

      // Set the new protocol run in cache
      queryClient.setQueryData(queryKeys.protocolRuns.byId(newProtocolRun.id), newProtocolRun);
    },
  });
}

/**
 * Hook to update an existing protocol run
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateProtocolRun();
 * await updateMutation.mutateAsync({
 *   id: 'protocol-123',
 *   data: { status: 'active' }
 * });
 * ```
 */
export function useUpdateProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateProtocolRunInput;
    }): Promise<ProtocolRun> => {
      return await protocolRunRepository.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.protocolRuns.byId(id) });

      // Snapshot previous value
      const previousProtocolRun = queryClient.getQueryData<ProtocolRun>(
        queryKeys.protocolRuns.byId(id)
      );

      // Optimistically update
      if (previousProtocolRun) {
        queryClient.setQueryData(queryKeys.protocolRuns.byId(id), {
          ...previousProtocolRun,
          ...data,
          updatedAt: new Date(),
        });
      }

      return { previousProtocolRun };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousProtocolRun) {
        queryClient.setQueryData(queryKeys.protocolRuns.byId(id), context.previousProtocolRun);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.byId(id) });

      // Also invalidate user's protocol runs and active protocol run
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.byUserId(data.userId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.active(data.userId) });
      }
    },
  });
}

/**
 * Hook to delete a protocol run
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteProtocolRun();
 * await deleteMutation.mutateAsync('protocol-123');
 * ```
 */
export function useDeleteProtocolRun() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await protocolRunRepository.delete(id);
    },
    onMutate: async (id) => {
      // Get the protocol run before deletion to know which user's cache to invalidate
      const protocolRun = queryClient.getQueryData<ProtocolRun>(queryKeys.protocolRuns.byId(id));
      return { protocolRun };
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.protocolRuns.byId(id) });

      // Invalidate related queries
      if (context?.protocolRun) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocolRuns.byUserId(context.protocolRun.userId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.protocolRuns.active(context.protocolRun.userId),
        });
      }

      // Invalidate all protocol runs
      queryClient.invalidateQueries({ queryKey: queryKeys.protocolRuns.all });
    },
  });
}
