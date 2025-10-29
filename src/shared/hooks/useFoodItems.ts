import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, Query, ID } from '../../infrastructure/api/appwrite';
import type {
  FoodItem,
  FodmapGroup,
  CreateFoodItemInput,
  UpdateFoodItemInput,
} from '../types/entities';

/**
 * Hook to fetch all food items
 */
export function useFoodItems() {
  return useQuery({
    queryKey: queryKeys.foodItems.all,
    queryFn: async (): Promise<FoodItem[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.FOOD_ITEMS,
        queries: [Query.orderAsc('name')],
      });

      return rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })) as unknown as FoodItem[];
    },
  });
}

/**
 * Hook to fetch a single food item by ID
 */
export function useFoodItem(id: string) {
  return useQuery({
    queryKey: queryKeys.foodItems.byId(id),
    queryFn: async (): Promise<FoodItem | null> => {
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.FOOD_ITEMS,
          rowId: id,
        });

        return {
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        } as unknown as FoodItem;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch food items filtered by FODMAP group
 */
export function useFoodItemsByGroup(group: FodmapGroup) {
  return useQuery({
    queryKey: queryKeys.foodItems.byFodmapGroup(group),
    queryFn: async (): Promise<FoodItem[]> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.FOOD_ITEMS,
        queries: [Query.equal('fodmapGroup', [group]), Query.orderAsc('name')],
      });

      return rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })) as unknown as FoodItem[];
    },
    enabled: !!group,
  });
}

/**
 * Hook to create a new food item
 */
export function useCreateFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateFoodItemInput): Promise<FoodItem> => {
      const { id, ...rest } = data;

      const rowData = {
        ...rest,
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      };

      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.FOOD_ITEMS,
        rowId: id || ID.unique(),
        data: rowData,
      });

      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as unknown as FoodItem;
    },
    onSuccess: (newFoodItem) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.foodItems.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.foodItems.byFodmapGroup(newFoodItem.fodmapGroup),
      });
      queryClient.setQueryData(queryKeys.foodItems.byId(newFoodItem.id), newFoodItem);
    },
  });
}

/**
 * Hook to update an existing food item
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
      const rowData: any = { ...data };
      if (data.updatedAt) rowData.updatedAt = data.updatedAt.toISOString();

      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.FOOD_ITEMS,
        rowId: id,
        data: rowData,
      });

      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as unknown as FoodItem;
    },
    onSuccess: (updatedFoodItem, { id }) => {
      queryClient.setQueryData(queryKeys.foodItems.byId(id), updatedFoodItem);
      queryClient.invalidateQueries({ queryKey: queryKeys.foodItems.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.foodItems.byFodmapGroup(updatedFoodItem.fodmapGroup),
      });
    },
  });
}

/**
 * Hook to delete a food item
 */
export function useDeleteFoodItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.FOOD_ITEMS,
        rowId: id,
      });
    },
    onMutate: async (id) => {
      const foodItem = queryClient.getQueryData<FoodItem>(queryKeys.foodItems.byId(id));
      return { foodItem };
    },
    onSuccess: (_, id, context) => {
      queryClient.removeQueries({ queryKey: queryKeys.foodItems.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.foodItems.all });
      if (context?.foodItem) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.foodItems.byFodmapGroup(context.foodItem.fodmapGroup),
        });
      }
    },
  });
}
