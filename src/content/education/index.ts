/**
 * Educational Content Module
 *
 * Exports type definitions and repositories for educational content used during
 * washout periods in the FODMAP reintroduction protocol.
 */

export type { ContentCategory, DifficultyLevel, AnxietyLevel, EducationalContent } from './types';

// Re-export repositories from washout feature
export { ContentRepository } from '../../features/washout/repositories/ContentRepository';
export { LocalJsonContentRepository } from '../../features/washout/repositories/LocalJsonContentRepository';
export { SupabaseContentRepository } from '../../features/washout/repositories/SupabaseContentRepository';
