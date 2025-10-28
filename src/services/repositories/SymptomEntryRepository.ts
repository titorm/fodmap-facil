import { eq, and, gte, lte } from 'drizzle-orm';
import { BaseRepository } from './BaseRepository';
import { symptomEntries } from '../../db/schema';
import type { SymptomEntry, CreateSymptomEntryInput, SymptomType } from '../../db/schema';

/**
 * SymptomEntryRepository
 *
 * Repository for managing SymptomEntry entities.
 * Provides CRUD operations and queries for symptom entry data.
 *
 * Implements:
 * - create: Create a new symptom entry
 * - findById: Find a symptom entry by ID
 * - findByTestStepId: Find all symptom entries for a test step (uses test_step_id index)
 * - findByDateRange: Find symptom entries within a date range (uses composite index)
 * - delete: Delete a symptom entry by ID
 */
export class SymptomEntryRepository extends BaseRepository<SymptomEntry> {
  /**
   * Create a new symptom entry
   *
   * Generates ID and timestamp automatically.
   * Validates that required fields are present and within valid ranges.
   *
   * @param data - The symptom entry data to create
   * @returns Promise resolving to the created symptom entry
   * @throws {Error} If validation fails or database operation fails
   */
  async create(data: Omit<CreateSymptomEntryInput, 'id' | 'createdAt'>): Promise<SymptomEntry> {
    try {
      // Validate required fields
      if (!data.testStepId || !data.testStepId.trim()) {
        throw new Error('Test step ID is required');
      }

      if (!data.symptomType) {
        throw new Error('Symptom type is required');
      }

      if (data.severity === undefined || data.severity === null) {
        throw new Error('Severity is required');
      }

      if (!data.timestamp) {
        throw new Error('Timestamp is required');
      }

      // Validate symptom type is a valid value
      const validSymptomTypes: SymptomType[] = [
        'bloating',
        'pain',
        'gas',
        'diarrhea',
        'constipation',
      ];
      if (!validSymptomTypes.includes(data.symptomType as SymptomType)) {
        throw new Error(`Invalid symptom type. Must be one of: ${validSymptomTypes.join(', ')}`);
      }

      // Validate severity is within 1-10 range
      if (data.severity < 1 || data.severity > 10) {
        throw new Error('Severity must be between 1 and 10');
      }

      // Create new symptom entry with generated ID and timestamp
      const newSymptomEntry: CreateSymptomEntryInput = {
        ...data,
        id: this.generateId(),
        createdAt: this.now(),
      };

      await this.db.insert(symptomEntries).values(newSymptomEntry);

      return newSymptomEntry as SymptomEntry;
    } catch (error) {
      this.handleError(error, 'create');
    }
  }

  /**
   * Find a symptom entry by ID
   *
   * @param id - The symptom entry ID to search for
   * @returns Promise resolving to the symptom entry or null if not found
   * @throws {Error} If database operation fails
   */
  async findById(id: string): Promise<SymptomEntry | null> {
    try {
      const result = await this.db
        .select()
        .from(symptomEntries)
        .where(eq(symptomEntries.id, id))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      this.handleError(error, 'findById');
    }
  }

  /**
   * Find all symptom entries for a specific test step
   *
   * Uses the test_step_id index for efficient lookup.
   * Returns symptom entries ordered by timestamp (most recent first).
   *
   * @param testStepId - The test step ID to search for
   * @returns Promise resolving to an array of symptom entries
   * @throws {Error} If database operation fails
   */
  async findByTestStepId(testStepId: string): Promise<SymptomEntry[]> {
    try {
      const result = await this.db
        .select()
        .from(symptomEntries)
        .where(eq(symptomEntries.testStepId, testStepId))
        .orderBy(symptomEntries.timestamp);

      return result;
    } catch (error) {
      this.handleError(error, 'findByTestStepId');
    }
  }

  /**
   * Find symptom entries within a date range for a specific test step
   *
   * Uses the composite index (test_step_id, timestamp) for efficient lookup.
   * Returns symptom entries ordered by timestamp.
   *
   * @param testStepId - The test step ID to search for
   * @param startDate - The start date of the range (inclusive)
   * @param endDate - The end date of the range (inclusive)
   * @returns Promise resolving to an array of symptom entries
   * @throws {Error} If database operation fails or invalid date range
   */
  async findByDateRange(
    testStepId: string,
    startDate: Date,
    endDate: Date
  ): Promise<SymptomEntry[]> {
    try {
      // Validate date range
      if (startDate > endDate) {
        throw new Error('Start date must be before or equal to end date');
      }

      const result = await this.db
        .select()
        .from(symptomEntries)
        .where(
          and(
            eq(symptomEntries.testStepId, testStepId),
            gte(symptomEntries.timestamp, startDate),
            lte(symptomEntries.timestamp, endDate)
          )
        )
        .orderBy(symptomEntries.timestamp);

      return result;
    } catch (error) {
      this.handleError(error, 'findByDateRange');
    }
  }

  /**
   * Delete a symptom entry by ID
   *
   * @param id - The ID of the symptom entry to delete
   * @returns Promise that resolves when deletion is complete
   * @throws {Error} If symptom entry not found or database operation fails
   */
  async delete(id: string): Promise<void> {
    try {
      // Check if symptom entry exists
      const existing = await this.findById(id);
      if (!existing) {
        throw new Error(`SymptomEntry with id ${id} not found`);
      }

      await this.db.delete(symptomEntries).where(eq(symptomEntries.id, id));
    } catch (error) {
      this.handleError(error, 'delete');
    }
  }
}
