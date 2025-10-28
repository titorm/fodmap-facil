import { ReintroductionEngine } from '../ReintroductionEngine';
import {
  FODMAPGroup,
  TestPhase,
  SymptomSeverity,
  ReintroductionTest,
} from '../../domain/entities/ReintroductionTest';

describe('ReintroductionEngine', () => {
  const mockTest: ReintroductionTest = {
    id: '1',
    userId: 'user1',
    fodmapGroup: FODMAPGroup.FRUCTOSE,
    phase: TestPhase.REINTRODUCTION,
    dayNumber: 1,
    foodItem: 'Honey',
    portionSize: '1 tsp',
    symptoms: [],
    startDate: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('getProtocol', () => {
    it('should return protocol for fructose group', () => {
      const protocol = ReintroductionEngine.getProtocol(FODMAPGroup.FRUCTOSE);

      expect(protocol.fodmapGroup).toBe(FODMAPGroup.FRUCTOSE);
      expect(protocol.testDuration).toBe(3);
      expect(protocol.washoutPeriod).toBe(3);
      expect(protocol.recommendedFoods).toContain('Honey');
    });
  });

  describe('canProgressToNextGroup', () => {
    it('should allow progression with no symptoms', () => {
      const canProgress = ReintroductionEngine.canProgressToNextGroup(mockTest);
      expect(canProgress).toBe(true);
    });

    it('should allow progression with mild symptoms', () => {
      const testWithMildSymptoms = {
        ...mockTest,
        symptoms: [
          {
            id: 's1',
            type: 'bloating',
            severity: SymptomSeverity.MILD,
            timestamp: new Date(),
          },
        ],
      };

      const canProgress = ReintroductionEngine.canProgressToNextGroup(testWithMildSymptoms);
      expect(canProgress).toBe(true);
    });

    it('should not allow progression with moderate symptoms', () => {
      const testWithModerateSymptoms = {
        ...mockTest,
        symptoms: [
          {
            id: 's1',
            type: 'pain',
            severity: SymptomSeverity.MODERATE,
            timestamp: new Date(),
          },
        ],
      };

      const canProgress = ReintroductionEngine.canProgressToNextGroup(testWithModerateSymptoms);
      expect(canProgress).toBe(false);
    });
  });

  describe('determineTolerance', () => {
    it('should determine tolerance correctly', () => {
      const tests = [
        { ...mockTest, dayNumber: 1, symptoms: [] },
        { ...mockTest, dayNumber: 2, symptoms: [] },
        {
          ...mockTest,
          dayNumber: 3,
          symptoms: [
            {
              id: 's1',
              type: 'pain',
              severity: SymptomSeverity.MODERATE,
              timestamp: new Date(),
            },
          ],
        },
      ];

      const tolerance = ReintroductionEngine.determineTolerance(tests);

      expect(tolerance?.tolerated).toBe(true);
      expect(tolerance?.maxToleratedPortion).toBe('2 tsp');
    });
  });

  describe('getSuggestedPortion', () => {
    it('should suggest correct portion for day 1', () => {
      const portion = ReintroductionEngine.getSuggestedPortion(FODMAPGroup.FRUCTOSE, 1);
      expect(portion).toBe('1 tsp');
    });

    it('should return null for invalid day', () => {
      const portion = ReintroductionEngine.getSuggestedPortion(FODMAPGroup.FRUCTOSE, 5);
      expect(portion).toBeNull();
    });
  });

  describe('validateTestProtocol', () => {
    it('should validate correct test', () => {
      const result = ReintroductionEngine.validateTestProtocol(mockTest);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect invalid phase', () => {
      const invalidTest = { ...mockTest, phase: TestPhase.ELIMINATION };
      const result = ReintroductionEngine.validateTestProtocol(invalidTest);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Test must be in reintroduction phase');
    });
  });
});
