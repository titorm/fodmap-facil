import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { groupResults } from '../../db/schema';
import type {
  GroupResult,
  CreateGroupResultInput,
  UpdateGroupResultInput,
  FodmapGroup,
  ToleranceLevel,
} from '../../db/schema';

/**
 * GroupResultRepository
 *
 * Repository for managing GroupResult entities.
 * Provides CRUD operations and queries for group result data.
 *
 * Implements:
 * - create: Create a new group result
 * - findById: Find a group result by ID
 * - findByProtocolRunId: Find all group results for a protocol run
 * - update: Update an existing group result
 * - delete: Delete a group result by ID
 */
export class GroupResultRepository extends BaseRepository<GroupResult> {
  /**
   * Create a new group result
   *
   * Generates ID and timestamps automatically.
   * Validates that required fields are present and values are valid.
   *
   * @param data - The group result data to create
   * @returns Promise resolving to the created group result
   * @throws {Error} If validation fails or database operation fails
   */
  async create(
    data: Omit<CreateGroupResultInput, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<GroupResult> {
    try {
      // Validate required fields
      if (!data.protocolRunId || !data.protocolRunId.trim()) {
        throw new Error('Protocol run ID is required');
      }

      if (!data.fodmapGroup) {
        throw new Error('FODMAP group is required');
      }

      if (!data.toleranceLevel) {
        throw new Error('Tolerance level is required');
      }

      // Validate FODMAP group is a valid value
      const validGroups: FodmapGroup[] = [
        'oligosaccharides',
        'disaccharides',
        'monosaccharides',
        'polyols',
      ];
      if (!validGroups.includes(data.fodmapGroup as FodmapGroup)) {
        throw new Error(`Invalid FODMAP group. Must be one of: ${validGroups.join(', ')}`);
      }

      // Validate tolerance level is a valid value
      const validLevels: ToleranceLevel[] = ['high', 'moderate', 'low', 'none'];
      if (!validLevels.includes(data.toleranceLevel as ToleranceLevel)) {
        throw new Error(`Invalid tolerance level. Must be one of: ${validLevels.join(', ')}`);
      }

      // Create new group result with generated ID and timestamps
      const newGroupResult: CreateGroupResultInput = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      await this.db.insert(groupResults).values(newGroupResult);

      return newGroupResult as GroupResult;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a group result by ID
   *
   * @param id - The group result ID to search for
   * @returns Promise resolving to the group result or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<GroupResult | null> {
    try {
      const result = await this.db
        .select()
        .from(groupResults)
        .where(eq(groupResults.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find all group results for a specific protocol run
   *
   * Returns group results ordered by FODMAP group.
   *
   * @param protocolRunId - The protocol run ID to search for
   * @returns Promise resolving to an array of group results
   * @throws {Error} If database operation fails
   */
  async findByProtocolRunId(protocolRunId: string): Promise<GroupResult[]> {
    try {
      const result = await this.db
        .select()
        .from(groupResults)
        .where(eq(groupResults.protocolRunId, protocolRunId))
        .orderBy(groupResults.fodmapGroup);

      return result;
    } catch (error) {
      this.handleError(error, 'findByProtocolRunId');
    }
  }

  /**
   * Update an existing group result
   *
   * Updates the specified fields and automatically updates the updatedAt timestamp.
   * Only provided fields will be updated.
   *
   * @param id - The ID of the group result to update
   * @param data - The fields to update
   * @returns Promise resolving to the updated group result
   * @throws {Error} If group result not found or database operation fails
   */
  async update(id: string, data: UpdateGroupResultInput): Promise<GroupResult> {
    try {
      // Check if group result exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`GroupResult with id ${id} not found`);
      }

      // Validate FODMAP group if being updated
      if (data.fodmapGroup) {
        const validGroups: FodmapGroup[] = [
          'oligosaccharides',
          'disaccharides',
          'monosaccharides',
          'polyols',
        ];
        if (!validGroups.includes(data.fodmapGroup as FodmapGroup)) {
          throw new Error(`Invalid FODMAP group. Must be one of: ${validGroups.join(', ')}`);
        }
      }

      // Validate tolerance level if being updated
      if (data.toleranceLevel) {
        const validLevels: ToleranceLevel[] = ['high', 'moderate', 'low', 'none'];
        if (!validLevels.includes(data.toleranceLevel as ToleranceLevel)) {
          throw new Error(`Invalid tolerance level. Must be one of: ${validLevels.join(', ')}`);
        }
      }

      // Update with new timestamp
      const updateData = {
        ...data,
        updatedAt: this.now(),
      };

      await this.db.update(groupResults).set(updateData).where(eq(groupResults.id, id));

      // Fetch and return updated group result
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated group result');
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete a group result by ID
   *
   * @param id - The ID of the group result to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If group result not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if group result exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`GroupResult with id ${id} not found`);
      }

      await this.db.delete(groupResults).where(eq(groupResults.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
