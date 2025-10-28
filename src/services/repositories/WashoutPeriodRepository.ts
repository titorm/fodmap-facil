import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { washoutPeriods } from '../../db/schema';
import type {
  WashoutPeriod,
  CreateWashoutPeriodInput,
  UpdateWashoutPeriodInput,
  WashoutPeriodStatus,
} from '../../db/schema';

/**
 * WashoutPeriodRepository
 *
 * Repository for managing WashoutPeriod entities.
 * Provides CRUD operations and queries for washout period data.
 *
 * Implements:
 * - create: Create a new washout period
 * - findById: Find a washout period by ID
 * - findByProtocolRunId: Find all washout periods for a protocol run
 * - update: Update an existing washout period
 * - delete: Delete a washout period by ID
 */
export class WashoutPeriodRepository extends BaseRepository<WashoutPeriod> {
  /**
   * Create a new washout period
   *
   * Generates ID and timestamps automatically.
   * Validates that required fields are present and dates are valid.
   *
   * @param data - The washout period data to create
   * @returns Promise resolving to the created washout period
   * @throws {Error} If validation fails or database operation fails
   */
  async create(
    data: Omit<CreateWashoutPeriodInput, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<WashoutPeriod> {
    try {
      // Validate required fields
      if (!data.protocolRunId || !data.protocolRunId.trim()) {
        throw new Error('Protocol run ID is required');
      }

      if (!data.startDate) {
        throw new Error('Start date is required');
      }

      if (!data.endDate) {
        throw new Error('End date is required');
      }

      if (!data.status) {
        throw new Error('Status is required');
      }

      // Validate status is a valid value
      const validStatuses: WashoutPeriodStatus[] = ['pending', 'active', 'completed'];
      if (!validStatuses.includes(data.status as WashoutPeriodStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Validate date logic
      if (data.endDate <= data.startDate) {
        throw new Error('End date must be after start date');
      }

      // Create new washout period with generated ID and timestamps
      const newWashoutPeriod: CreateWashoutPeriodInput = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      await this.db.insert(washoutPeriods).values(newWashoutPeriod);

      return newWashoutPeriod as WashoutPeriod;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a washout period by ID
   *
   * @param id - The washout period ID to search for
   * @returns Promise resolving to the washout period or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<WashoutPeriod | null> {
    try {
      const result = await this.db
        .select()
        .from(washoutPeriods)
        .where(eq(washoutPeriods.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find all washout periods for a specific protocol run
   *
   * Returns washout periods ordered by start date.
   *
   * @param protocolRunId - The protocol run ID to search for
   * @returns Promise resolving to an array of washout periods
   * @throws {Error} If database operation fails
   */
  async findByProtocolRunId(protocolRunId: string): Promise<WashoutPeriod[]> {
    try {
      const result = await this.db
        .select()
        .from(washoutPeriods)
        .where(eq(washoutPeriods.protocolRunId, protocolRunId))
        .orderBy(washoutPeriods.startDate);

      return result;
    } catch (error) {
      this.handleError(error, 'findByProtocolRunId');
    }
  }

  /**
   * Update an existing washout period
   *
   * Updates the specified fields and automatically updates the updatedAt timestamp.
   * Only provided fields will be updated.
   *
   * @param id - The ID of the washout period to update
   * @param data - The fields to update
   * @returns Promise resolving to the updated washout period
   * @throws {Error} If washout period not found or database operation fails
   */
  async update(id: string, data: UpdateWashoutPeriodInput): Promise<WashoutPeriod> {
    try {
      // Check if washout period exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`WashoutPeriod with id ${id} not found`);
      }

      // Validate status if being updated
      if (data.status) {
        const validStatuses: WashoutPeriodStatus[] = ['pending', 'active', 'completed'];
        if (!validStatuses.includes(data.status as WashoutPeriodStatus)) {
          throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      // Validate date logic if dates are being updated
      const startDate = data.startDate || existing.startDate;
      const endDate = data.endDate || existing.endDate;
      if (endDate <= startDate) {
        throw new Error('End date must be after start date');
      }

      // Update with new timestamp
      const updateData = {
        ...data,
        updatedAt: this.now(),
      };

      await this.db.update(washoutPeriods).set(updateData).where(eq(washoutPeriods.id, id));

      // Fetch and return updated washout period
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated washout period');
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete a washout period by ID
   *
   * @param id - The ID of the washout period to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If washout period not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if washout period exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`WashoutPeriod with id ${id} not found`);
      }

      await this.db.delete(washoutPeriods).where(eq(washoutPeriods.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
