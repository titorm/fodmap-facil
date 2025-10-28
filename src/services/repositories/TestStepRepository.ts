import { eq } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { testSteps } from '../../db/schema';
import type {
  TestStep,
  CreateTestStepInput,
  UpdateTestStepInput,
  TestStepStatus,
} from '../../db/schema';

/**
 * TestStepRepository
 *
 * Repository for managing TestStep entities.
 * Provides CRUD operations and queries for test step data.
 *
 * Implements:
 * - create: Create a new test step
 * - findById: Find a test step by ID
 * - findByProtocolRunId: Find all test steps for a protocol run (uses protocol_run_id index)
 * - findByStatus: Find all test steps with a specific status (uses status index)
 * - update: Update an existing test step
 * - delete: Delete a test step by ID
 */
export class TestStepRepository extends BaseRepository<TestStep> {
  /**
   * Create a new test step
   *
   * Generates ID and timestamps automatically.
   * Validates that required fields are present.
   *
   * @param data - The test step data to create
   * @returns Promise resolving to the created test step
   * @throws {Error} If validation fails or database operation fails
   */
  async create(
    data: Omit<CreateTestStepInput, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<TestStep> {
    try {
      // Validate required fields
      if (!data.protocolRunId || !data.protocolRunId.trim()) {
        throw new Error('Protocol run ID is required');
      }

      if (!data.foodItemId || !data.foodItemId.trim()) {
        throw new Error('Food item ID is required');
      }

      if (data.sequenceNumber === undefined || data.sequenceNumber === null) {
        throw new Error('Sequence number is required');
      }

      if (data.sequenceNumber < 0) {
        throw new Error('Sequence number must be non-negative');
      }

      if (!data.status) {
        throw new Error('Status is required');
      }

      if (!data.scheduledDate) {
        throw new Error('Scheduled date is required');
      }

      // Validate status is a valid value
      const validStatuses: TestStepStatus[] = ['pending', 'in_progress', 'completed', 'skipped'];
      if (!validStatuses.includes(data.status as TestStepStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      // Create new test step with generated ID and timestamps
      const newTestStep: CreateTestStepInput = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
        updatedAt: this.now(),
      };

      await this.db.insert(testSteps).values(newTestStep);

      return newTestStep as TestStep;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a test step by ID
   *
   * @param id - The test step ID to search for
   * @returns Promise resolving to the test step or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<TestStep | null> {
    try {
      const result = await this.db.select().from(testSteps).where(eq(testSteps.id, id)).limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find all test steps for a specific protocol run
   *
   * Uses the protocol_run_id index for efficient lookup.
   * Returns test steps ordered by sequence number.
   *
   * @param protocolRunId - The protocol run ID to search for
   * @returns Promise resolving to an array of test steps
   * @throws {Error} If database operation fails
   */
  async findByProtocolRunId(protocolRunId: string): Promise<TestStep[]> {
    try {
      const result = await this.db
        .select()
        .from(testSteps)
        .where(eq(testSteps.protocolRunId, protocolRunId))
        .orderBy(testSteps.sequenceNumber);

      return result;
    } catch (error) {
      this.handleError(error, 'findByProtocolRunId');
    }
  }

  /**
   * Find all test steps with a specific status
   *
   * Uses the status index for efficient lookup.
   * Returns test steps ordered by scheduled date.
   *
   * @param status - The status to filter by
   * @returns Promise resolving to an array of test steps
   * @throws {Error} If database operation fails
   */
  async findByStatus(status: TestStepStatus): Promise<TestStep[]> {
    try {
      // Validate status is a valid value
      const validStatuses: TestStepStatus[] = ['pending', 'in_progress', 'completed', 'skipped'];
      if (!validStatuses.includes(status)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const result = await this.db
        .select()
        .from(testSteps)
        .where(eq(testSteps.status, status))
        .orderBy(testSteps.scheduledDate);

      return result;
    } catch (error) {
      this.handleError(error, 'findByStatus');
    }
  }

  /**
   * Update an existing test step
   *
   * Updates the specified fields and automatically updates the updatedAt timestamp.
   * Only provided fields will be updated.
   *
   * @param id - The ID of the test step to update
   * @param data - The fields to update
   * @returns Promise resolving to the updated test step
   * @throws {Error} If test step not found or database operation fails
   */
  async update(id: string, data: UpdateTestStepInput): Promise<TestStep> {
    try {
      // Check if test step exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`TestStep with id ${id} not found`);
      }

      // Validate status if being updated
      if (data.status) {
        const validStatuses: TestStepStatus[] = ['pending', 'in_progress', 'completed', 'skipped'];
        if (!validStatuses.includes(data.status as TestStepStatus)) {
          throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
        }
      }

      // Validate sequence number if being updated
      if (data.sequenceNumber !== undefined && data.sequenceNumber < 0) {
        throw new Error('Sequence number must be non-negative');
      }

      // Update with new timestamp
      const updateData = {
        ...data,
        updatedAt: this.now(),
      };

      await this.db.update(testSteps).set(updateData).where(eq(testSteps.id, id));

      // Fetch and return updated test step
      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Failed to retrieve updated test step');
      }

      return updated;
    } catch (error) {
      this.handleError(error, 'update');
    }
  }

  /**
   * Delete a test step by ID
   *
   * Note: This will fail if there are related records (symptom entries, notification schedules)
   * due to foreign key constraints. Consider implementing soft delete or cascade delete
   * based on business requirements.
   *
   * @param id - The ID of the test step to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If test step not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if test step exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`TestStep with id ${id} not found`);
      }

      await this.db.delete(testSteps).where(eq(testSteps.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
