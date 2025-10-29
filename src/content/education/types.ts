/**
 * Educational Content Type Definitions
 *
 * These types define the structure for educational content displayed
 * during washout periods in the FODMAP reintroduction protocol.
 */

/**
 * Categories of educational content
 */
export type ContentCategory = 'social-tips' | 'recipes' | 'fodmap-guidance' | 'anxiety-support';

/**
 * Difficulty levels for content targeting different experience levels
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

/**
 * Anxiety levels that content can target
 */
export type AnxietyLevel = 'low' | 'medium' | 'high';

/**
 * Educational content item structure
 */
export interface EducationalContent {
  /** Unique identifier for the content */
  id: string;

  /** Title of the content (max 100 characters) */
  title: string;

  /** Brief summary of the content (max 200 characters) */
  summary: string;

  /** Full content in Markdown format */
  content: string;

  /** Category classification */
  category: ContentCategory;

  /** Tags for content filtering and search */
  tags: string[];

  /** Difficulty level for experience-based filtering */
  difficultyLevel: DifficultyLevel;

  /** Target anxiety levels this content is appropriate for */
  targetAnxietyLevels: AnxietyLevel[];

  /** Flag indicating if content might be stressful for anxious users */
  potentiallyStressful: boolean;

  /** Estimated reading time in minutes */
  estimatedReadTimeMinutes: number;

  /** ISO 8601 timestamp of content creation */
  createdAt: string;

  /** ISO 8601 timestamp of last update */
  updatedAt: string;

  /** Optional author name */
  author?: string;

  /** Optional image URL */
  imageUrl?: string;
}
