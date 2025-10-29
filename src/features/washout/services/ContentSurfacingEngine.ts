/**
 * ContentSurfacingEngine
 *
 * Service for selecting and ranking educational content based on user state.
 * Implements a scoring algorithm to personalize content delivery during
 * washout periods in the FODMAP reintroduction protocol.
 *
 * Requirements: 3.1, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3
 */

import type { EducationalContent } from '../../../content/education/types';
import type { ContentRepository } from '../repositories/ContentRepository';
import type { UserState } from '../utils/userStateUtils';

/**
 * Scored content item with relevance score
 */
interface ScoredContent {
  content: EducationalContent;
  score: number;
}

/**
 * ContentSurfacingEngine class
 *
 * Selects and ranks educational content based on user state attributes
 * including experience level, anxiety level, and viewing history.
 */
export class ContentSurfacingEngine {
  constructor(private contentRepository: ContentRepository) {}

  /**
   * Select personalized educational content for a user
   *
   * Algorithm:
   * 1. Load all available content from repository
   * 2. Filter content based on user state (experience, anxiety, viewed history)
   * 3. Rank filtered content by relevance score
   * 4. Return top N items (default 2-5)
   *
   * @param userState - Current user state for personalization
   * @param count - Number of content items to return (default: 5, min: 2, max: 10)
   * @returns Promise resolving to array of personalized content items
   * @throws {Error} If content loading fails
   */
  async selectContent(userState: UserState, count: number = 5): Promise<EducationalContent[]> {
    // Validate count parameter
    const validCount = Math.max(2, Math.min(10, count));

    // Load all available content
    const allContent = await this.contentRepository.loadAll();

    // Filter content based on user state
    const filteredContent = this.filterContent(allContent, userState);

    // If we have no filtered content, return empty array
    if (filteredContent.length === 0) {
      return [];
    }

    // Rank content by relevance
    const rankedContent = this.rankContent(filteredContent, userState);

    // Return top N items
    return rankedContent.slice(0, validCount);
  }

  /**
   * Filter content based on user state
   *
   * Filtering rules:
   * - Experience level: Prioritize matching difficulty level
   * - Anxiety level: Exclude potentially stressful content for high anxiety users
   * - Anxiety level: Include content targeting user's anxiety level
   * - Previously viewed: Exclude if sufficient new content exists (>50% unviewed)
   *
   * @param content - Array of all available content
   * @param userState - Current user state
   * @returns Filtered array of content items
   */
  private filterContent(content: EducationalContent[], userState: UserState): EducationalContent[] {
    let filtered = content;

    // Filter out potentially stressful content for high anxiety users
    if (userState.anxietyLevel === 'high') {
      filtered = filtered.filter((item) => !item.potentiallyStressful);
    }

    // Filter to include content targeting user's anxiety level
    filtered = filtered.filter((item) => item.targetAnxietyLevels.includes(userState.anxietyLevel));

    // Filter out previously viewed content if we have enough unviewed content
    const unviewedContent = filtered.filter(
      (item) => !userState.previouslyViewedContentIds.includes(item.id)
    );

    // If we have more than 50% unviewed content, exclude viewed content
    if (unviewedContent.length > filtered.length * 0.5) {
      filtered = unviewedContent;
    }

    return filtered;
  }

  /**
   * Rank content by relevance score
   *
   * Scoring algorithm:
   * - Exact match on experience level (difficulty): +10 points
   * - Anxiety-support category when anxiety is high: +15 points
   * - Content not viewed before: +5 points
   * - Recency of content creation: +0-3 points (newer = higher)
   *
   * @param content - Array of filtered content
   * @param userState - Current user state
   * @returns Array of content sorted by relevance score (highest first)
   */
  rankContent(content: EducationalContent[], userState: UserState): EducationalContent[] {
    // Calculate scores for each content item
    const scoredContent: ScoredContent[] = content.map((item) => ({
      content: item,
      score: this.calculateRelevanceScore(item, userState),
    }));

    // Sort by score (highest first), then by creation date (newest first) as tiebreaker
    scoredContent.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return new Date(b.content.createdAt).getTime() - new Date(a.content.createdAt).getTime();
    });

    // Return sorted content items
    return scoredContent.map((scored) => scored.content);
  }

  /**
   * Calculate relevance score for a content item
   *
   * @param content - Content item to score
   * @param userState - Current user state
   * @returns Relevance score (higher = more relevant)
   */
  private calculateRelevanceScore(content: EducationalContent, userState: UserState): number {
    let score = 0;

    // Experience level match: +10 points
    if (this.matchesExperienceLevel(content.difficultyLevel, userState.experienceLevel)) {
      score += 10;
    }

    // Anxiety-support category for high anxiety users: +15 points
    if (userState.anxietyLevel === 'high' && content.category === 'anxiety-support') {
      score += 15;
    }

    // Content not viewed before: +5 points
    if (!userState.previouslyViewedContentIds.includes(content.id)) {
      score += 5;
    }

    // Recency score: +0-3 points based on content age
    score += this.calculateRecencyScore(content.createdAt);

    return score;
  }

  /**
   * Check if content difficulty matches user experience level
   *
   * Matching rules:
   * - novice → beginner
   * - intermediate → intermediate
   * - advanced → advanced
   *
   * @param difficulty - Content difficulty level
   * @param experienceLevel - User experience level
   * @returns True if difficulty matches experience level
   */
  private matchesExperienceLevel(difficulty: string, experienceLevel: string): boolean {
    const matchMap: Record<string, string> = {
      novice: 'beginner',
      intermediate: 'intermediate',
      advanced: 'advanced',
    };

    return matchMap[experienceLevel] === difficulty;
  }

  /**
   * Calculate recency score based on content creation date
   *
   * Scoring:
   * - Content created within last 30 days: +3 points
   * - Content created within last 90 days: +2 points
   * - Content created within last 180 days: +1 point
   * - Older content: +0 points
   *
   * @param createdAt - ISO 8601 timestamp of content creation
   * @returns Recency score (0-3)
   */
  private calculateRecencyScore(createdAt: string): number {
    const now = new Date();
    const created = new Date(createdAt);
    const ageInDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 30) {
      return 3;
    } else if (ageInDays <= 90) {
      return 2;
    } else if (ageInDays <= 180) {
      return 1;
    } else {
      return 0;
    }
  }
}
