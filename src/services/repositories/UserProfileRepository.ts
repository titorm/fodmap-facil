import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { userProfiles } from '../../db/schema';
import type { UserProfile, CreateUserProfileInput, UpdateUserProfileInput } from '../../db/schema';

/**
 * UserProfileRepository
 *
 * Repository for managing UserProfile entities.
 * Provides CRUD operations and queries for user profile data.
 *
 * Implements:
 * - create: Create a new user profile with validation
 * - findById: Find a user profile by ID
 * - findByEmail: Find a user profile by email (uses email index)
 * - update: Update an existing user profile
 * - delete: Delete a user profile by ID
 */
export class UserProfileRepository extends BaseRepository<UserProfile> {
  /**
   * Create a new user profile
   *
   * Validates that required fields are present and generates ID and timestamps.
   * Email uniqueness is enforced by the database schema.
   *
   * @param data - The user profile data to create
   * @returns Promise resolving to the created user profile
   * @throws {Error} If validation fails or database operation fails
   */
  async create(
    data: Omit<CreateUserProfileInput, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<UserProfile> {
    try {
      // Validate required fields
      if (!data.email || !data.email.trim()) {
        throw new Error('Email is required');
      }

      if (!data.name || !data.name.trim()) {
        throw new Error('Name is required');
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new Error('Invalid email format');
      }

      // Create new user profile with generated ID and timestamps
      const newUserProfile: CreateUserProfileInput = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      await this.db.insert(userProfiles).values(newUserProfile);

      return newUserProfile as UserProfile;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a user profile by ID
   *
   * @param id - The user profile ID to search for
   * @returns Promise resolving to the user profile or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<UserProfile | null> {
    try {
      const result = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find a user profile by email
   *
   * Uses the email index for efficient lookup.
   *
   * @param email - The email address to search for
   * @returns Promise resolving to the user profile or null if not found
   * @throws {Error} If database operation fails
   */
  async findByEmail(email: string): Promise<UserProfile | null> {
    try {
      const result = await this.db
        .select()
        .from(userProfiles)
        .where(eq(userProfiles.email, email))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findByEmail');
    }
  }

  /**
   * Update an existing user profile
   *
   * Updates the specified fields and automatically updates the updatedAt timestamp.
   * Only provided fields will be updated.
   *
   * @param id - The ID of the user profile to update
   * @param data - The fields to update
   * @returns Promise resolving to the updated user profile
   * @throws {Error} If user profile not found or database operation fails
   */
  async update(id: string, data: UpdateUserProfileInput): Promise<UserProfile> {
    try {
      // Check if user profile exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`UserProfile with id ${id} not found`);
      }

      // Validate email format if email is being updated
      if (data.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(data.email)) {
          throw new Error('Invalid email format');
        }
      }

      // Validate name if being updated
      if (data.name !== undefined && (!data.name || !data.name.trim())) {
        throw new Error('Name cannot be empty');
      }

      // Update with new timestamp
      const updateData = {
        ...data,
        updatedAt: this.now(),
      };

      await this.db.update(userProfiles).set(updateData).where(eq(userProfiles.id, id));

      // Fetch and return updated user profile
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated user profile');
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete a user profile by ID
   *
   * Note: This will fail if there are related records (protocol runs) due to foreign key constraints.
   * Consider implementing soft delete or cascade delete based on business requirements.
   *
   * @param id - The ID of the user profile to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If user profile not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if user profile exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`UserProfile with id ${id} not found`);
      }

      await this.db.delete(userProfiles).where(eq(userProfiles.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
