import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tablesDB, DATABASE_ID, TABLES, ID, Query } from '../../infrastructure/api/appwrite';
import { ReintroductionTest } from '../../core/domain/entities/ReintroductionTest';

/**
 * Query keys para cache
 */
export const testQueryKeys = {
  all: ['reintroduction-tests'] as const,
  byUser: (userId: string) => [...testQueryKeys.all, 'user', userId] as const,
  byId: (id: string) => [...testQueryKeys.all, 'id', id] as const,
  byGroup: (userId: string, group: string) =>
    [...testQueryKeys.byUser(userId), 'group', group] as const,
};

/**
 * Hook para buscar testes de um usuário
 */
export function useReintroductionTests(userId: string) {
  return useQuery({
    queryKey: testQueryKeys.byUser(userId),
    queryFn: async () => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TESTS,
        queries: [Query.equal('userId', [userId]), Query.orderDesc('createdAt')],
      });
      return rows as unknown as ReintroductionTest[];
    },
    enabled: !!userId,
  });
}

/**
 * Hook para buscar um teste específico
 */
export function useReintroductionTest(testId: string) {
  return useQuery({
    queryKey: testQueryKeys.byId(testId),
    queryFn: async () => {
      const row = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TESTS,
        rowId: testId,
      });
      return row as unknown as ReintroductionTest;
    },
    enabled: !!testId,
  });
}

/**
 * Hook para criar um teste
 */
export function useCreateReintroductionTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (test: Omit<ReintroductionTest, 'id' | 'createdAt' | 'updatedAt'>) => {
      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TESTS,
        rowId: ID.unique(),
        data: {
          ...test,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });
      return row as unknown as ReintroductionTest;
    },
    onSuccess: (data) => {
      // Invalida cache de testes do usuário
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.byUser(data.userId),
      });
    },
  });
}

/**
 * Hook para atualizar um teste
 */
export function useUpdateReintroductionTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<ReintroductionTest> }) => {
      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TESTS,
        rowId: id,
        data: {
          ...updates,
          updatedAt: new Date().toISOString(),
        },
      });
      return row as unknown as ReintroductionTest;
    },
    onSuccess: (data) => {
      // Atualiza cache do teste específico
      queryClient.setQueryData(testQueryKeys.byId(data.id), data);

      // Invalida cache de testes do usuário
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.byUser(data.userId),
      });
    },
  });
}

/**
 * Hook para deletar um teste
 */
export function useDeleteReintroductionTest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (testId: string) => {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TESTS,
        rowId: testId,
      });
    },
    onSuccess: (_, testId) => {
      // Remove do cache
      queryClient.removeQueries({
        queryKey: testQueryKeys.byId(testId),
      });

      // Invalida cache de todos os testes
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.all,
      });
    },
  });
}

/**
 * Hook para adicionar sintoma a um teste
 */
export function useAddSymptom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (symptom: {
      testId: string;
      type: string;
      severity: number;
      notes?: string;
      timestamp: Date;
    }) => {
      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOMS,
        rowId: ID.unique(),
        data: {
          ...symptom,
          timestamp: symptom.timestamp.toISOString(),
          createdAt: new Date().toISOString(),
        },
      });
      return row;
    },
    onSuccess: (_, variables) => {
      // Invalida cache do teste para recarregar com novo sintoma
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.byId(variables.testId),
      });
    },
  });
}
