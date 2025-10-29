/**
 * ContentRepository Interface
 *
 * Abstract repository interface for educational content storage.
 * This interface allows for different implementations (local JSON, Supabase, etc.)
 * without changing the business logic that depends on it.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4
 */

import { ContentCategory, EducationalContent } from '../../../content/education/types';

/**
 * Repository interface for managing educational content
 */
export interface ContentRepository {
  /**
   * Load all available educational content
   * @returns Promise resolving to array of all content items
   * @throws Error if content loading fails
   */
  loadAll(): Promise<EducationalContent[]>;

  /**
   * Find a specific content item by its ID
   * @param id - Unique identifier of the content
   * @returns Promise resolving to content item or null if not found
   */
  findById(id: string): Promise<EducationalContent | null>;

  /**
   * Find all content items in a specific category
   * @param category - Content category to filter by
   * @returns Promise resolving to array of matching content items
   */
  findByCategory(category: ContentCategory): Promise<EducationalContent[]>;

  /**
   * Find content items that have any of the specified tags
   * @param tags - Array of tags to search for
   * @returns Promise resolving to array of matching content items
   */
  findByTags(tags: string[]): Promise<EducationalContent[]>;
}
