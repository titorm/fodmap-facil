import { eq, and } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { protocolRuns } from '../../db/schema';
import type {
  ProtocolRun,
  CreateProtocolRunInput,
  UpdateProtocolRunInput,
  ProtocolRunStatus,
} from '../../db/schema';

/**
 * ProtocolRunRepository
 *
 * Repository for managing ProtocolRun entities.
 * Provides CRUD operations and queries for protocol run data.
 *
 * Implements:
 * - create: Create a new protocol run
 * - findById: Find a protocol run by ID
 * - findByUserId: Find all protocol runs for a user (uses user_id index)
 * - findActive: Find the active protocol run for a user
 * - update: Update an existing protocol run
 * - delete: Delete a protocol run by ID
 */
export class ProtocolRunRepository extends BaseRepository<ProtocolRun> {
  /**
   * Create a new protocol run
   *
   * Generates ID and timestamps automatically.
   * Validates that required fields are present.
   *
   * @param data - The protocol run data to create
   * @returns Promise resolving to the created protocol run
   * @throws {Error} If validation fails or database operation fails
   */
  async create(
    data: Omit<CreateProtocolRunInput, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ProtocolRun> {
    try {
      // Validate required fields
      if (!data.userId || !data.userId.trim()) {
        throw new Error('User ID is required');
      }

      if (!data.status) {
        throw new Error('Status is required');
      }

      if (!data.startDate) {
        throw new Error('Start date is required');
      }

      // Validate status is a valid value
      const validStatuses: ProtocolRunStatus[] = ['planned', 'active', 'paused', 'completed'];
      if (!validStatuses.includes(data.status as ProtocolRunStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Create new protocol run with generated ID and timestamps
      const newProtocolRun: CreateProtocolRunInput = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      await this.db.insert(protocolRuns).values(newProtocolRun);

      return newProtocolRun as ProtocolRun;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a protocol run by ID
   *
   * @param id - The protocol run ID to search for
   * @returns Promise resolving to the protocol run or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<ProtocolRun | null> {
    try {
      const result = await this.db
        .select()
        .from(protocolRuns)
        .where(eq(protocolRuns.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find all protocol runs for a specific user
   *
   * Uses the user_id index for efficient lookup.
   * Returns protocol runs ordered by start date (most recent first).
   *
   * @param userId - The user ID to search for
   * @returns Promise resolving to an array of protocol runs
   * @throws {Error} If database operation fails
   */
  async findByUserId(userId: string): Promise<ProtocolRun[]> {
    try {
      const result = await this.db
        .select()
        .from(protocolRuns)
        .where(eq(protocolRuns.userId, userId))
        .orderBy(protocolRuns.startDate);

      return result;
    } catch (error) {
      this.handleError(error, 'findByUserId');
    }
  }

  /**
   * Find the active protocol run for a specific user
   *
   * Filters by status='active' and user_id.
   * Returns only the first active protocol run found.
   * In a well-designed system, there should only be one active protocol run per user.
   *
   * @param userId - The user ID to search for
   * @returns Promise resolving to the active protocol run or null if not found
   * @throws {Error} If database operation fails
   */
  async findActive(userId: string): Promise<ProtocolRun | null> {
    try {
      const result = await this.db
        .select()
        .from(protocolRuns)
        .where(and(eq(protocolRuns.userId, userId), eq(protocolRuns.status, 'active')))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findActive');
    }
  }

  /**
   * Update an existing protocol run
   *
   * Updates the specified fields and automatically updates the updatedAt timestamp.
   * Only provided fields will be updated.
   *
   * @param id - The ID of the protocol run to update
   * @param data - The fields to update
   * @returns Promise resolving to the updated protocol run
   * @throws {Error} If protocol run not found or database operation fails
   */
  async update(id: string, data: UpdateProtocolRunInput): Promise<ProtocolRun> {
    try {
      // Check if protocol run exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`ProtocolRun with id ${id} not found`);
      }

      // Validate status if being updated
      if (data.status) {
        const validStatuses: ProtocolRunStatus[] = ['planned', 'active', 'paused', 'completed'];
        if (!validStatuses.includes(data.status as ProtocolRunStatus)) {
          throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      // Update with new timestamp
      const updateData = {
        ...data,
        updatedAt: this.now(),
      };

      await this.db.update(protocolRuns).set(updateData).where(eq(protocolRuns.id, id));

      // Fetch and return updated protocol run
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated protocol run');
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete a protocol run by ID
   *
   * Note: This will fail if there are related records (test steps, washout periods, group results)
   * due to foreign key constraints. Consider implementing soft delete or cascade delete
   * based on business requirements.
   *
   * @param id - The ID of the protocol run to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If protocol run not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if protocol run exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`ProtocolRun with id ${id} not found`);
      }

      await this.db.delete(protocolRuns).where(eq(protocolRuns.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
