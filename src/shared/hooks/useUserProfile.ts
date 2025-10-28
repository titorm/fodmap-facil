import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../lib/queryClient';
import { UserProfileRepository } from '../../services/repositories';
import { db } from '../../infrastructure/database/client';
import type { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '../../db/schema';

// Create repository instance
const userProfileRepository = new UserProfileRepository(db);

/**
 * Hook to fetch a user profile by ID
 *
 * @param id - The user profile ID to fetch
 * @returns Query result with user profile data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: userProfile, isLoading, error } = useUserProfile(userId);
 * ```
 */
export function useUserProfile(id: string) {
  return useQuery({
    queryKey: queryKeys.userProfiles.byId(id),
    queryFn: async (): Promise<UserProfile | null> => {
      return await userProfileRepository.findById(id);
    },
    enabled: !!id,
  });
}

/**
 * Hook to fetch a user profile by email
 *
 * @param email - The email address to search for
 * @returns Query result with user profile data, loading state, and error
 *
 * @example
 * ```tsx
 * const { data: userProfile, isLoading, error } = useUserProfileByEmail('user@example.com');
 * ```
 */
export function useUserProfileByEmail(email: string) {
  return useQuery({
    queryKey: queryKeys.userProfiles.byEmail(email),
    queryFn: async (): Promise<UserProfile | null> => {
      return await userProfileRepository.findByEmail(email);
    },
    enabled: !!email,
  });
}

/**
 * Hook to create a new user profile
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const createMutation = useCreateUserProfile();
 * await createMutation.mutateAsync({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   languagePreference: 'en',
 *   themePreference: 'dark'
 * });
 * ```
 */
export function useCreateUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateUserProfileInput): Promise<UserProfile> => {
      return await userProfileRepository.create(data);
    },
    onSuccess: (newUserProfile) => {
      // Invalidate all user profile queries to refetch
      queryClient.invalidateQueries({
        queryKey: queryKeys.userProfiles.all,
      });

      // Set the new user profile in cache
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
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const updateMutation = useUpdateUserProfile();
 * await updateMutation.mutateAsync({
 *   id: 'user-123',
 *   data: { name: 'Jane Doe' }
 * });
 * ```
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
      return await userProfileRepository.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.userProfiles.byId(id) });

      // Snapshot previous value
      const previousUserProfile = queryClient.getQueryData<UserProfile>(
        queryKeys.userProfiles.byId(id)
      );

      // Optimistically update
      if (previousUserProfile) {
        queryClient.setQueryData(queryKeys.userProfiles.byId(id), {
          ...previousUserProfile,
          ...data,
          updatedAt: new Date(),
        });
      }

      return { previousUserProfile };
    },
    onError: (err, { id }, context) => {
      // Rollback on error
      if (context?.previousUserProfile) {
        queryClient.setQueryData(queryKeys.userProfiles.byId(id), context.previousUserProfile);
      }
    },
    onSettled: (data, error, { id }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfiles.byId(id) });

      // Also invalidate email query if email was updated
      if (data) {
        queryClient.invalidateQueries({ queryKey: queryKeys.userProfiles.byEmail(data.email) });
      }
    },
  });
}

/**
 * Hook to delete a user profile
 *
 * @returns Mutation result with mutate function, loading state, and error
 *
 * @example
 * ```tsx
 * const deleteMutation = useDeleteUserProfile();
 * await deleteMutation.mutateAsync('user-123');
 * ```
 */
export function useDeleteUserProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      return await userProfileRepository.delete(id);
    },
    onSuccess: (_, id) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: queryKeys.userProfiles.byId(id) });

      // Invalidate all user profile queries
      queryClient.invalidateQueries({ queryKey: queryKeys.userProfiles.all });
    },
  });
}
