import type { Database } from '../../infrastructure/database/client';

/**
 * BaseRepository
 *
 * Abstract base class for all repository implementations.
 * Provides common utility methods for error handling, ID generation, and timestamp management.
 *
 * @template T - The entity type this repository manages
 */
export abstract class BaseRepository<T> {
  /**
   * Creates a new BaseRepository instance
   *
   * @param db - The Drizzle database instance
   */
  constructor(protected db: Database) {}

  /**
   * Handles errors consistently across all repository methods
   *
   * Logs the error to the console and throws a new Error with a descriptive message.
   * This ensures all repository errors follow the same format and are properly logged.
   *
   * @param error - The error that occurred
   * @param operation - The name of the operation that failed (e.g., 'create', 'findById')
   * @throws {Error} Always throws an error with a formatted message
   */
  protected handleError(error: unknown, operation: string): never {
    console.error(`${operation} failed:`, error);

    // Extract error message if available
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    throw new Error(`Database operation failed: ${operation} - ${errorMessage}`);
  }

  /**
   * Generates a unique ID for new entities
   *
   * Creates a unique identifier using a combination of timestamp and random string.
   * Format: {timestamp}-{random_string}
   *
   * Example: "1698765432100-x7k9m2p4q"
   *
   * @returns A unique string identifier
   */
  protected generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Returns the current timestamp
   *
   * Provides a consistent way to generate timestamps across all repositories.
   * This method can be easily mocked in tests for predictable timestamp values.
   *
   * @returns The current date and time as a Date object
   */
  protected now(): Date {
    return new Date();
  }
}
