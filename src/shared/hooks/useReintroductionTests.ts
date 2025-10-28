import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../infrastructure/api/supabase';
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
      const { data, error } = await supabase
        .from('reintroduction_tests')
        .select('*, symptoms(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as ReintroductionTest[];
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
      const { data, error } = await supabase
        .from('reintroduction_tests')
        .select('*, symptoms(*)')
        .eq('id', testId)
        .single();

      if (error) throw error;
      return data as ReintroductionTest;
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
      const { data, error } = await supabase
        .from('reintroduction_tests')
        .insert(test)
        .select()
        .single();

      if (error) throw error;
      return data as ReintroductionTest;
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
      const { data, error } = await supabase
        .from('reintroduction_tests')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as ReintroductionTest;
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
      const { error } = await supabase.from('reintroduction_tests').delete().eq('id', testId);

      if (error) throw error;
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
      const { data, error } = await supabase.from('symptoms').insert(symptom).select().single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalida cache do teste para recarregar com novo sintoma
      queryClient.invalidateQueries({
        queryKey: testQueryKeys.byId(variables.testId),
      });
    },
  });
}
