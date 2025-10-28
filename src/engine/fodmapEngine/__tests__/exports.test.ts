/**
 * Test suite to verify public API exports
 * Ensures that all required functions, types, and constants are exported
 * and that internal implementation details are NOT exported
 */

import * as FodmapEngine from '../index';

describe('FODMAP Engine Public API Exports', () => {
  describe('Main Entry Point', () => {
    it('should export calculateNextAction function', () => {
      expect(FodmapEngine.calculateNextAction).toBeDefined();
      expect(typeof FodmapEngine.calculateNextAction).toBe('function');
    });
  });

  describe('Zod Schemas', () => {
    it('should export all Zod schemas', () => {
      expect(FodmapEngine.FODMAPGroupSchema).toBeDefined();
      expect(FodmapEngine.SymptomSeveritySchema).toBeDefined();
      expect(FodmapEngine.ToleranceStatusSchema).toBeDefined();
      expect(FodmapEngine.ProtocolPhaseSchema).toBeDefined();
      expect(FodmapEngine.SymptomRecordSchema).toBeDefined();
      expect(FodmapEngine.DoseRecordSchema).toBeDefined();
      expect(FodmapEngine.FoodTestResultSchema).toBeDefined();
      expect(FodmapEngine.WashoutPeriodSchema).toBeDefined();
      expect(FodmapEngine.ProtocolStateSchema).toBeDefined();
      expect(FodmapEngine.NextActionSchema).toBeDefined();
    });
  });

  describe('Configuration Constants', () => {
    it('should export STANDARD_GROUP_SEQUENCE', () => {
      expect(FodmapEngine.STANDARD_GROUP_SEQUENCE).toBeDefined();
      expect(Array.isArray(FodmapEngine.STANDARD_GROUP_SEQUENCE)).toBe(true);
      expect(FodmapEngine.STANDARD_GROUP_SEQUENCE).toEqual([
        'fructose',
        'lactose',
        'fructans',
        'galactans',
        'polyols',
      ]);
    });

    it('should export RECOMMENDED_FOODS', () => {
      expect(FodmapEngine.RECOMMENDED_FOODS).toBeDefined();
      expect(typeof FodmapEngine.RECOMMENDED_FOODS).toBe('object');
      expect(FodmapEngine.RECOMMENDED_FOODS.fructose).toBeDefined();
    });

    it('should export PORTION_PROGRESSION', () => {
      expect(FodmapEngine.PORTION_PROGRESSION).toBeDefined();
      expect(typeof FodmapEngine.PORTION_PROGRESSION).toBe('object');
      expect(FodmapEngine.PORTION_PROGRESSION.fructose).toBeDefined();
    });

    it('should export WASHOUT_DURATION', () => {
      expect(FodmapEngine.WASHOUT_DURATION).toBeDefined();
      expect(typeof FodmapEngine.WASHOUT_DURATION).toBe('object');
      expect(FodmapEngine.WASHOUT_DURATION.none).toBe(3);
      expect(FodmapEngine.WASHOUT_DURATION.severe).toBe(7);
    });
  });

  describe('Utility Functions', () => {
    it('should export symptom analysis functions', () => {
      expect(FodmapEngine.analyzeSymptoms).toBeDefined();
      expect(typeof FodmapEngine.analyzeSymptoms).toBe('function');
      expect(FodmapEngine.shouldStopTest).toBeDefined();
      expect(typeof FodmapEngine.shouldStopTest).toBe('function');
    });

    it('should export tolerance classification function', () => {
      expect(FodmapEngine.classifyTolerance).toBeDefined();
      expect(typeof FodmapEngine.classifyTolerance).toBe('function');
    });

    it('should export washout functions', () => {
      expect(FodmapEngine.calculateWashout).toBeDefined();
      expect(typeof FodmapEngine.calculateWashout).toBe('function');
      expect(FodmapEngine.checkWashoutStatus).toBeDefined();
      expect(typeof FodmapEngine.checkWashoutStatus).toBe('function');
    });

    it('should export sequence management functions', () => {
      expect(FodmapEngine.getGroupSequence).toBeDefined();
      expect(typeof FodmapEngine.getGroupSequence).toBe('function');
      expect(FodmapEngine.getNextGroup).toBeDefined();
      expect(typeof FodmapEngine.getNextGroup).toBe('function');
      expect(FodmapEngine.getRecommendedFoods).toBeDefined();
      expect(typeof FodmapEngine.getRecommendedFoods).toBe('function');
      expect(FodmapEngine.getPortionForDay).toBeDefined();
      expect(typeof FodmapEngine.getPortionForDay).toBe('function');
    });

    it('should export validation function', () => {
      expect(FodmapEngine.validateProtocolState).toBeDefined();
      expect(typeof FodmapEngine.validateProtocolState).toBe('function');
    });
  });

  describe('Internal Functions Should NOT Be Exported', () => {
    it('should NOT export handleWashoutPeriod', () => {
      expect((FodmapEngine as any).handleWashoutPeriod).toBeUndefined();
    });

    it('should NOT export handleCurrentTest', () => {
      expect((FodmapEngine as any).handleCurrentTest).toBeUndefined();
    });

    it('should NOT export determineNextTest', () => {
      expect((FodmapEngine as any).determineNextTest).toBeUndefined();
    });

    it('should NOT export generateSummary', () => {
      expect((FodmapEngine as any).generateSummary).toBeUndefined();
    });
  });

  describe('Public API Usage', () => {
    it('should allow creating a valid protocol state using exported schemas', () => {
      const state = {
        userId: 'test-user',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing' as const,
      };

      // Should not throw
      const validated = FodmapEngine.ProtocolStateSchema.parse(state);
      expect(validated).toBeDefined();
    });

    it('should allow calling calculateNextAction with exported types', () => {
      const state: FodmapEngine.ProtocolState = {
        userId: 'test-user',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
      };

      const now = new Date('2024-01-01T00:00:00Z');
      const action = FodmapEngine.calculateNextAction(state, now);

      expect(action).toBeDefined();
      expect(action.action).toBe('start_next_group');
    });

    it('should allow using utility functions independently', () => {
      const symptoms: FodmapEngine.SymptomRecord[] = [
        {
          timestamp: '2024-01-01T12:00:00Z',
          severity: 'mild',
          type: 'bloating',
        },
      ];

      const severity = FodmapEngine.analyzeSymptoms(symptoms);
      expect(severity).toBe('mild');

      const shouldStop = FodmapEngine.shouldStopTest(severity, 1);
      expect(shouldStop).toBe(false);
    });
  });
});
