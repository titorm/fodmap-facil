import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { TestStepRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import type {
  TestStep,
  TestStepStatus,
  CreateTestStepInput,
  UpdateTestStepInput,
} from '../../db/schema';

// Create repository instance
const testStepRepository = new TestStepRepository(db);

/**
 * Hook to fetch all test steps for a specific protocol run
 *
 * @param protocolRunId - The protocol run ID to fetch test steps for
 * @returns Query result with array of test steps, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: testSteps, isLoading, error } = useTestSteps(protocolRunId);
 * ```
 */
export function useTestSteps(protocolRunId: string) {
  return useQuery({
    queryKey: queryKeys.testSteps.byProtocolRunId(protocolRunId),
    queryFn: async (): Promise<TestStep[]> => {
      return await testStepRepository.findByProtocolRunId(protocolRunId);
    },
    enabled: !!protocolRunId,
  });
}

/**
 * Hook to fetch a single test step by ID
 *
 * @param id - The test step ID to fetch
 * @returns Query result with test step data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: testStep, isLoading, error } = useTestStep(testStepId);
 * ```
 */
export function useTestStep(id: string) {
  return useQuery({
    queryKey: queryKeys.testSteps.byId(id),
    queryFn: async (): Promise<TestStep | null> => {
      return await testStepRepository.findById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch test steps filtered by status
 *
 * @param status - The status to filter test steps by
 * @returns Query result with array of test steps, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: pendingSteps, isLoading, error } = useTestStepsByStatus('pending');
 * ```
 */
export function useTestStepsByStatus(status: TestStepStatus) {
  return useQuery({
    queryKey: queryKeys.testSteps.byStatus(status),
    queryFn: async (): Promise<TestStep[]> => {
      return await testStepRepository.findByStatus(status);
    },
    enabled: !!status,
  });
}

/**
 * Hook to create a new test step
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const createMutation = useCreateTestStep();
 * await createMutation.mutateAsync({
 *   protocolRunId: 'protocol-123',
 *   foodItemId: 'food-456',
 *   sequenceNumber: 1,
 *   status: 'pending',
 *   scheduledDate: new Date()
 * });
 * ```
 */
export function useCreateTestStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTestStepInput): Promise<TestStep> => {
      return await testStepRepository.create(data);
    },
    onSuccess: (newTestStep) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSteps.byProtocolRunId(newTestStep.protocolRunId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.testSteps.byStatus(newTestStep.status),
      });

      // Set the new test step in cache
      queryClient.setQueryData(queryKeys.testSteps.byId(newTestStep.id), newTestStep);
    },
  });
}

/**
 * Hook to update an existing test step
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateTestStep();
 * await updateMutation.mutateAsync({
 *   id: 'step-123',
 *   data: { status: 'completed', completedDate: new Date() }
 * });
 * ```
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
      return await testStepRepository.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.testSteps.byId(id) });

      // Snapshot previous value
      const previousTestStep = queryClient.getQueryData<TestStep>(queryKeys.testSteps.byId(id));

      // Optimistically update
      if (previousTestStep) {
        queryClient.setQueryData(queryKeys.testSteps.byId(id), {
          ...previousTestStep,
          ...data,
          updatedAt: new Date(),
        });
      }

      return { previousTestStep };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousTestStep) {
        queryClient.setQueryData(queryKeys.testSteps.byId(id), context.previousTestStep);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.byId(id) });

      // Also invalidate protocol run's test steps and status queries
      if (data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.testSteps.byProtocolRunId(data.protocolRunId),
        });
        queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.byStatus(data.status) });
      }
    },
  });
}

/**
 * Hook to delete a test step
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteTestStep();
 * await deleteMutation.mutateAsync('step-123');
 * ```
 */
export function useDeleteTestStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await testStepRepository.delete(id);
    },
    onMutate: async (id) => {
      // Get the test step before deletion to know which caches to invalidate
      const testStep = queryClient.getQueryData<TestStep>(queryKeys.testSteps.byId(id));
      return { testStep };
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.testSteps.byId(id) });

      // Invalidate related queries
      if (context?.testStep) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.testSteps.byProtocolRunId(context.testStep.protocolRunId),
        });
        queryClient.invalidateQueries({
          queryKey: queryKeys.testSteps.byStatus(context.testStep.status),
        });
      }

      // Invalidate all test steps
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.all });
    },
  });
}
