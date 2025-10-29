/**
 * LocalJsonContentRepository
 *
 * JSON file-based implementation of ContentRepository.
 * Loads educational content from local JSON files, validates against schema,
 * and provides in-memory caching for performance.
 *
 * Requirements: 6.1, 6.2, 6.3, 8.2
 */

import { ContentCategory, EducationalContent } from '../../../content/education/types';
import { ContentRepository } from './ContentRepository';
import Ajv, { ValidateFunction } from 'ajv';
import addFormats from 'ajv-formats';

// Import JSON schema for validation
import contentSchema from '../../../content/education/schema.json';

/**
 * Local JSON file-based content repository implementation
 */
export class LocalJsonContentRepository implements ContentRepository {
  private contentCache: Map<string, EducationalContent> = new Map();
  private allContentCache: EducationalContent[] | null = null;
  private validator: ValidateFunction;
  private isInitialized = false;

  constructor() {
    // Initialize JSON schema validator
    const ajv = new Ajv({ allErrors: true });
    addFormats(ajv);
    this.validator = ajv.compile(contentSchema);
  }

  /**
   * Load all educational content from JSON files
   * Implements in-memory caching for performance (Requirement 6.2)
   */
  async loadAll(): Promise<EducationalContent[]> {
    if (this.allContentCache !== null) {
      return this.allContentCache;
    }

    await this.initializeContent();
    return this.allContentCache || [];
  }

  /**
   * Find content by ID
   * Uses in-memory cache for fast lookups
   */
  async findById(id: string): Promise<EducationalContent | null> {
    await this.ensureInitialized();
    return this.contentCache.get(id) || null;
  }

  /**
   * Find content by category
   * Filters cached content by category
   */
  async findByCategory(category: ContentCategory): Promise<EducationalContent[]> {
    const allContent = await this.loadAll();
    return allContent.filter((content) => content.category === category);
  }

  /**
   * Find content by tags
   * Returns content that has any of the specified tags
   */
  async findByTags(tags: string[]): Promise<EducationalContent[]> {
    if (tags.length === 0) {
      return [];
    }

    const allContent = await this.loadAll();
    const tagSet = new Set(tags.map((tag) => tag.toLowerCase()));

    return allContent.filter((content) =>
      content.tags.some((contentTag) => tagSet.has(contentTag.toLowerCase()))
    );
  }

  /**
   * Ensure content is initialized before operations
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initializeContent();
    }
  }

  /**
   * Initialize content from JSON files
   * Loads, validates, and caches all content
   * Requirements: 6.1, 6.2, 6.3
   */
  private async initializeContent(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // In React Native, we need to use require() to load JSON files
      // The content files should be in src/content/education/
      const contentFiles = this.getContentFiles();
      const validContent: EducationalContent[] = [];

      for (const contentData of contentFiles) {
        try {
          // Validate against JSON schema (Requirement 6.2)
          const isValid = this.validator(contentData);

          if (!isValid) {
            // Log validation errors and skip invalid items (Requirement 6.3)
            console.error(
              `Invalid content item with id "${contentData?.id || 'unknown'}":`,
              this.validator.errors
            );
            continue;
          }

          const content = contentData as EducationalContent;

          // Cache individual content item
          this.contentCache.set(content.id, content);
          validContent.push(content);
        } catch (error) {
          console.error('Error processing content item:', error);
          // Skip invalid items gracefully (Requirement 6.3)
          continue;
        }
      }

      // Cache all valid content (Requirement 6.2)
      this.allContentCache = validContent;
      this.isInitialized = true;

      console.log(`Loaded ${validContent.length} educational content items`);
    } catch (error) {
      console.error('Failed to initialize educational content:', error);
      // Set empty cache to prevent repeated initialization attempts
      this.allContentCache = [];
      this.isInitialized = true;
      throw new Error('Failed to load educational content');
    }
  }

  /**
   * Get content files from the education directory
   * This method uses require.context in React Native/Metro bundler
   * to dynamically load all JSON files from the content directory
   */
  private getContentFiles(): any[] {
    try {
      // For React Native, we need to explicitly require each file
      // or use a require.context equivalent
      // This is a placeholder that should be replaced with actual file loading
      // based on the project's bundler configuration

      // Example approach: Manually require known content files
      // In production, this could be generated or use Metro's require.context
      const contentFiles: any[] = [];

      // TODO: Add actual content file imports here
      // Example:
      // contentFiles.push(require('../../../content/education/social-tips-001.json'));
      // contentFiles.push(require('../../../content/education/recipes-001.json'));

      return contentFiles;
    } catch (error) {
      console.error('Error loading content files:', error);
      return [];
    }
  }

  /**
   * Clear the cache (useful for testing or forcing reload)
   */
  clearCache(): void {
    this.contentCache.clear();
    this.allContentCache = null;
    this.isInitialized = false;
  }
}
