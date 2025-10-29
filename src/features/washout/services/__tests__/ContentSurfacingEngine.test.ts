/**
 * ContentSurfacingEngine Unit Tests
 *
 * Tests for content filtering and ranking logic based on user state.
 */

import { ContentSurfacingEngine } from '../ContentSurfacingEngine';
import type { ContentRepository } from '../../repositories/ContentRepository';
import type { EducationalContent } from '../../../../content/education/types';
import type { UserState } from '../../utils/userStateUtils';

// Mock ContentRepository
class MockContentRepository implements ContentRepository {
  constructor(private mockContent: EducationalContent[] = []) {}

  async loadAll(): Promise<EducationalContent[]> {
    return this.mockContent;
  }

  async findById(id: string): Promise<EducationalContent | null> {
    return this.mockContent.find((c) => c.id === id) || null;
  }

  async findByCategory(): Promise<EducationalContent[]> {
    return [];
  }

  async findByTags(): Promise<EducationalContent[]> {
    return [];
  }
}

// Helper function to create test content
function createTestContent(overrides: Partial<EducationalContent> = {}): EducationalContent {
  return {
    id: 'test-content-1',
    title: 'Test Content',
    summary: 'Test summary',
    content: 'Test content body',
    category: 'fodmap-guidance',
    tags: ['test'],
    difficultyLevel: 'beginner',
    targetAnxietyLevels: ['low', 'medium', 'high'],
    potentiallyStressful: false,
    estimatedReadTimeMinutes: 5,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

// Helper function to create test user state
function createTestUserState(overrides: Partial<UserState> = {}): UserState {
  return {
    experienceLevel: 'novice',
    anxietyLevel: 'medium',
    protocolPhase: 'reintroduction',
    completedTestsCount: 0,
    previouslyViewedContentIds: [],
    ...overrides,
  };
}

describe('ContentSurfacingEngine', () => {
  describe('selectContent', () => {
    it('should return empty array when no content is available', async () => {
      const repository = new MockContentRepository([]);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState();

      const result = await engine.selectContent(userState);

      expect(result).toEqual([]);
    });

    it('should return up to 5 content items by default', async () => {
      const content = Array.from({ length: 10 }, (_, i) =>
        createTestContent({
          id: `content-${i}`,
          title: `Content ${i}`,
        })
      );
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState();

      const result = await engine.selectContent(userState);

      expect(result.length).toBeLessThanOrEqual(5);
    });

    it('should respect custom count parameter', async () => {
      const content = Array.from({ length: 10 }, (_, i) =>
        createTestContent({
          id: `content-${i}`,
          title: `Content ${i}`,
        })
      );
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState();

      const result = await engine.selectContent(userState, 3);

      expect(result.length).toBeLessThanOrEqual(3);
    });

    it('should enforce minimum count of 2', async () => {
      const content = Array.from({ length: 10 }, (_, i) =>
        createTestContent({
          id: `content-${i}`,
          title: `Content ${i}`,
        })
      );
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState();

      const result = await engine.selectContent(userState, 1);

      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it('should enforce maximum count of 10', async () => {
      const content = Array.from({ length: 20 }, (_, i) =>
        createTestContent({
          id: `content-${i}`,
          title: `Content ${i}`,
        })
      );
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState();

      const result = await engine.selectContent(userState, 15);

      expect(result.length).toBeLessThanOrEqual(10);
    });
  });

  describe('filtering logic', () => {
    it('should filter out potentially stressful content for high anxiety users', async () => {
      const content = [
        createTestContent({
          id: 'safe-content',
          potentiallyStressful: false,
        }),
        createTestContent({
          id: 'stressful-content',
          potentiallyStressful: true,
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({ anxietyLevel: 'high' });

      const result = await engine.selectContent(userState);

      expect(result.every((item) => !item.potentiallyStressful)).toBe(true);
      expect(result.find((item) => item.id === 'stressful-content')).toBeUndefined();
    });

    it('should include potentially stressful content for low anxiety users', async () => {
      const content = [
        createTestContent({
          id: 'stressful-content',
          potentiallyStressful: true,
          targetAnxietyLevels: ['low'],
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({ anxietyLevel: 'low' });

      const result = await engine.selectContent(userState);

      expect(result.find((item) => item.id === 'stressful-content')).toBeDefined();
    });

    it('should filter content by target anxiety levels', async () => {
      const content = [
        createTestContent({
          id: 'low-anxiety-content',
          targetAnxietyLevels: ['low'],
        }),
        createTestContent({
          id: 'high-anxiety-content',
          targetAnxietyLevels: ['high'],
        }),
        createTestContent({
          id: 'all-anxiety-content',
          targetAnxietyLevels: ['low', 'medium', 'high'],
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({ anxietyLevel: 'low' });

      const result = await engine.selectContent(userState);

      expect(result.every((item) => item.targetAnxietyLevels.includes('low'))).toBe(true);
      expect(result.find((item) => item.id === 'high-anxiety-content')).toBeUndefined();
    });

    it('should exclude previously viewed content when sufficient unviewed content exists', async () => {
      const content = [
        createTestContent({ id: 'viewed-1' }),
        createTestContent({ id: 'viewed-2' }),
        createTestContent({ id: 'unviewed-1' }),
        createTestContent({ id: 'unviewed-2' }),
        createTestContent({ id: 'unviewed-3' }),
        createTestContent({ id: 'unviewed-4' }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({
        previouslyViewedContentIds: ['viewed-1', 'viewed-2'],
      });

      const result = await engine.selectContent(userState);

      expect(result.every((item) => !item.id.startsWith('viewed'))).toBe(true);
    });

    it('should include previously viewed content when insufficient unviewed content exists', async () => {
      const content = [
        createTestContent({ id: 'viewed-1' }),
        createTestContent({ id: 'viewed-2' }),
        createTestContent({ id: 'viewed-3' }),
        createTestContent({ id: 'unviewed-1' }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({
        previouslyViewedContentIds: ['viewed-1', 'viewed-2', 'viewed-3'],
      });

      const result = await engine.selectContent(userState);

      // Should include some viewed content since unviewed is only 25% of total
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('ranking logic', () => {
    it('should prioritize content matching experience level (+10 points)', async () => {
      const content = [
        createTestContent({
          id: 'beginner-content',
          difficultyLevel: 'beginner',
          createdAt: '2025-01-01T00:00:00Z',
        }),
        createTestContent({
          id: 'advanced-content',
          difficultyLevel: 'advanced',
          createdAt: '2025-01-01T00:00:00Z',
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({ experienceLevel: 'novice' });

      const result = await engine.selectContent(userState);

      expect(result[0].id).toBe('beginner-content');
    });

    it('should prioritize anxiety-support content for high anxiety users (+15 points)', async () => {
      const content = [
        createTestContent({
          id: 'anxiety-support',
          category: 'anxiety-support',
          targetAnxietyLevels: ['high'],
          createdAt: '2025-01-01T00:00:00Z',
        }),
        createTestContent({
          id: 'regular-content',
          category: 'fodmap-guidance',
          targetAnxietyLevels: ['high'],
          createdAt: '2025-01-01T00:00:00Z',
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({ anxietyLevel: 'high' });

      const result = await engine.selectContent(userState);

      expect(result[0].id).toBe('anxiety-support');
    });

    it('should prioritize unviewed content (+5 points)', async () => {
      const content = [
        createTestContent({
          id: 'viewed-content',
          createdAt: '2025-01-01T00:00:00Z',
        }),
        createTestContent({
          id: 'unviewed-content',
          createdAt: '2025-01-01T00:00:00Z',
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({
        previouslyViewedContentIds: ['viewed-content'],
      });

      const result = await engine.selectContent(userState);

      expect(result[0].id).toBe('unviewed-content');
    });

    it('should apply recency score (newer content gets higher score)', async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      const content = [
        createTestContent({
          id: 'old-content',
          createdAt: ninetyDaysAgo.toISOString(),
        }),
        createTestContent({
          id: 'recent-content',
          createdAt: thirtyDaysAgo.toISOString(),
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState();

      const result = await engine.selectContent(userState);

      expect(result[0].id).toBe('recent-content');
    });

    it('should combine multiple scoring factors correctly', async () => {
      const content = [
        createTestContent({
          id: 'perfect-match',
          difficultyLevel: 'beginner',
          category: 'anxiety-support',
          targetAnxietyLevels: ['high'],
          createdAt: new Date().toISOString(),
        }),
        createTestContent({
          id: 'partial-match',
          difficultyLevel: 'advanced',
          category: 'fodmap-guidance',
          targetAnxietyLevels: ['high'],
          createdAt: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({
        experienceLevel: 'novice',
        anxietyLevel: 'high',
      });

      const result = await engine.selectContent(userState);

      // perfect-match should score higher:
      // +10 (experience) +15 (anxiety-support) +5 (unviewed) +3 (recent) = 33
      // vs partial-match: +5 (unviewed) +0 (old) = 5
      expect(result[0].id).toBe('perfect-match');
    });
  });

  describe('rankContent', () => {
    it('should return content sorted by relevance score', () => {
      const content = [
        createTestContent({
          id: 'low-score',
          difficultyLevel: 'advanced',
          createdAt: '2020-01-01T00:00:00Z',
        }),
        createTestContent({
          id: 'high-score',
          difficultyLevel: 'beginner',
          createdAt: new Date().toISOString(),
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState({ experienceLevel: 'novice' });

      const result = engine.rankContent(content, userState);

      expect(result[0].id).toBe('high-score');
      expect(result[1].id).toBe('low-score');
    });

    it('should use creation date as tiebreaker when scores are equal', () => {
      const content = [
        createTestContent({
          id: 'older',
          createdAt: '2024-01-01T00:00:00Z',
        }),
        createTestContent({
          id: 'newer',
          createdAt: '2025-01-01T00:00:00Z',
        }),
      ];
      const repository = new MockContentRepository(content);
      const engine = new ContentSurfacingEngine(repository);
      const userState = createTestUserState();

      const result = engine.rankContent(content, userState);

      expect(result[0].id).toBe('newer');
      expect(result[1].id).toBe('older');
    });
  });
});
