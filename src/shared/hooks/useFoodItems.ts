import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { FoodItemRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import type {
  FoodItem,
  FodmapGroup,
  CreateFoodItemInput,
  UpdateFoodItemInput,
} from '../../db/schema';

// Create repository instance
const foodItemRepository = new FoodItemRepository(db);

/**
 * Hook to fetch all food items
 *
 * @returns Query result with array of all food items, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: foodItems, isLoading, error } = useFoodItems();
 * ```
 */
export function useFoodItems() {
  return useQuery({
    queryKey: queryKeys.foodItems.all,
    queryFn: async (): Promise<FoodItem[]> => {
      return await foodItemRepository.findAll();
    },
  });
}

/**
 * Hook to fetch a single food item by ID
 *
 * @param id - The food item ID to fetch
 * @returns Query result with food item data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: foodItem, isLoading, error } = useFoodItem(foodItemId);
 * ```
 */
export function useFoodItem(id: string) {
  return useQuery({
    queryKey: queryKeys.foodItems.byId(id),
    queryFn: async (): Promise<FoodItem | null> => {
      return await foodItemRepository.findById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch food items filtered by FODMAP group
 *
 * @param group - The FODMAP group to filter by
 * @returns Query result with array of food items, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: oligosaccharides, isLoading, error } = useFoodItemsByGroup('oligosaccharides');
 * ```
 */
export function useFoodItemsByGroup(group: FodmapGroup) {
  return useQuery({
    queryKey: queryKeys.foodItems.byFodmapGroup(group),
    queryFn: async (): Promise<FoodItem[]> => {
      return await foodItemRepository.findByFodmapGroup(group);
    },
    enabled: !!group,
  });
}

/**
 * Hook to create a new food item
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const createMutation = useCreateFoodItem();
 * await createMutation.mutateAsync({
 *   name: 'Wheat bread',
 *   fodmapGroup: 'oligosaccharides',
 *   fodmapType: 'fructans',
 *   servingSize: '1 slice (35g)',
 *   description: 'Common wheat bread for fructan testing'
 * });
 * ```
 */
export function useCreateFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFoodItemInput): Promise<FoodItem> => {
      return await foodItemRepository.create(data);
    },
    onSuccess: (newFoodItem) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.foodItems.all,
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.foodItems.byFodmapGroup(newFoodItem.fodmapGroup),
      });

      // Set the new food item in cache
      queryClient.setQueryData(queryKeys.foodItems.byId(newFoodItem.id), newFoodItem);
    },
  });
}

/**
 * Hook to update an existing food item
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateFoodItem();
 * await updateMutation.mutateAsync({
 *   id: 'food-123',
 *   data: { servingSize: '2 slices (70g)' }
 * });
 * ```
 */
export function useUpdateFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateFoodItemInput;
    }): Promise<FoodItem> => {
      return await foodItemRepository.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.foodItems.byId(id) });

      // Snapshot previous value
      const previousFoodItem = queryClient.getQueryData<FoodItem>(queryKeys.foodItems.byId(id));

      // Optimistically update
      if (previousFoodItem) {
        queryClient.setQueryData(queryKeys.foodItems.byId(id), {
          ...previousFoodItem,
          ...data,
          updatedAt: new Date(),
        });
      }

      return { previousFoodItem };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousFoodItem) {
        queryClient.setQueryData(queryKeys.foodItems.byId(id), context.previousFoodItem);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.foodItems.byId(id) });

      // Also invalidate all food items and group queries
      queryClient.invalidateQueries({ queryKey: queryKeys.foodItems.all });
      if (data) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.foodItems.byFodmapGroup(data.fodmapGroup),
        });
      }
    },
  });
}

/**
 * Hook to delete a food item
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteFoodItem();
 * await deleteMutation.mutateAsync('food-123');
 * ```
 */
export function useDeleteFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await foodItemRepository.delete(id);
    },
    onMutate: async (id) => {
      // Get the food item before deletion to know which caches to invalidate
      const foodItem = queryClient.getQueryData<FoodItem>(queryKeys.foodItems.byId(id));
      return { foodItem };
    },
    onSuccess: (_, id, context) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.foodItems.byId(id) });

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.foodItems.all });
      if (context?.foodItem) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.foodItems.byFodmapGroup(context.foodItem.fodmapGroup),
        });
      }
    },
  });
}
