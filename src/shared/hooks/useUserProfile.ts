import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, Query, ID } from '../../infrastructure/api/appwrite';
import type {
  UserProfile,
  CreateUserProfileInput,
  UpdateUserProfileInput,
} from '../types/entities';

/**
 * Hook to fetch a user profile by ID
 */
export function useUserProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.userProfiles.byId(id),
    queryFn: async (): Promise<UserProfile | null> => {
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.USER_PROFILES,
          rowId: id,
        });

        return {
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        } as UserProfile;
      } catch {
        return null;
      }
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch a user profile by email
 */
export function useUserProfileByEmail(email: string) {
  return useQuery({
    queryKey: queryKeys.userProfiles.byEmail(email),
    queryFn: async (): Promise<UserProfile | null> => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.USER_PROFILES,
        queries: [Query.equal('email', [email]), Query.limit(1)],
      });

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as UserProfile;
    },
    enabled: !!email,
  });
}

/**
 * Hook to create a new user profile
 */
export function useCreateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserProfileInput): Promise<UserProfile> => {
      const { id, ...rest } = data;

      const rowData = {
        ...rest,
        languagePreference: data.languagePreference || 'pt',
        themePreference: data.themePreference || 'system',
        createdAt: data.createdAt.toISOString(),
        updatedAt: data.updatedAt.toISOString(),
      };

      const row = await tablesDB.createRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.USER_PROFILES,
        rowId: id || ID.unique(),
        data: rowData,
      });

      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as UserProfile;
    },
    onSuccess: (newUserProfile) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfiles.all });
      queryClient.setQueryData(queryKeys.userProfiles.byId(newUserProfile.id), newUserProfile);
      queryClient.setQueryData(
        queryKeys.userProfiles.byEmail(newUserProfile.email),
        newUserProfile
      );
    },
  });
}

/**
 * Hook to update an existing user profile
 */
export function useUpdateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateUserProfileInput;
    }): Promise<UserProfile> => {
      const rowData: any = { ...data };
      if (data.updatedAt) rowData.updatedAt = data.updatedAt.toISOString();

      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.USER_PROFILES,
        rowId: id,
        data: rowData,
      });

      return {
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as UserProfile;
    },
    onSuccess: (updatedUserProfile, { id }) => {
      queryClient.setQueryData(queryKeys.userProfiles.byId(id), updatedUserProfile);
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfiles.byEmail(updatedUserProfile.email),
      });
    },
  });
}

/**
 * Hook to delete a user profile
 */
export function useDeleteUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      await tablesDB.deleteRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.USER_PROFILES,
        rowId: id,
      });
    },
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: queryKeys.userProfiles.byId(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfiles.all });
    },
  });
}
