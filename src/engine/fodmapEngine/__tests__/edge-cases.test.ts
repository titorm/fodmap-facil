import { z } from 'zod';
import {
  calculateNextAction,
  ProtocolStateSchema,
  DoseRecordSchema,
  WashoutPeriodSchema,
  FoodTestResultSchema,
  SymptomRecordSchema,
} from '../index';
import { getPortionForDay } from '../sequence';
import { ProtocolState } from '../types';

describe('Edge Cases', () => {
  describe('Zod Schema Validation', () => {
    it('should throw validation error for invalid FODMAP group', () => {
      const invalidState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'invalid_group',
          doses: [],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T00:00:00Z',
        },
      };

      expect(() => ProtocolStateSchema.parse(invalidState)).toThrow(z.ZodError);
    });

    it('should throw validation error for invalid symptom severity', () => {
      const invalidSymptom = {
        timestamp: '2024-01-01T12:00:00Z',
        severity: 'extreme',
        type: 'pain',
      };

      expect(() => SymptomRecordSchema.parse(invalidSymptom)).toThrow(z.ZodError);
    });

    it('should throw validation error for invalid tolerance status', () => {
      const invalidTest = {
        foodItem: 'Honey',
        fodmapGroup: 'fructose',
        doses: [
          {
            date: '2024-01-01T00:00:00Z',
            dayNumber: 1,
            foodItem: 'Honey',
            portionSize: '1 tsp',
            portionAmount: 5,
            symptoms: [],
          },
        ],
        toleranceStatus: 'unknown',
        startDate: '2024-01-01T00:00:00Z',
      };

      expect(() => FoodTestResultSchema.parse(invalidTest)).toThrow(z.ZodError);
    });

    it('should throw validation error for invalid protocol phase', () => {
      const invalidState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'paused',
      };

      expect(() => ProtocolStateSchema.parse(invalidState)).toThrow(z.ZodError);
    });

    it('should throw validation error for non-datetime string', () => {
      const invalidState = {
        userId: 'user123',
        startDate: 'not-a-date',
        completedTests: [],
        phase: 'testing',
      };

      expect(() => ProtocolStateSchema.parse(invalidState)).toThrow(z.ZodError);
    });

    it('should throw validation error for missing required fields', () => {
      const invalidState = {
        userId: 'user123',
        completedTests: [],
        phase: 'testing',
      };

      expect(() => ProtocolStateSchema.parse(invalidState)).toThrow(z.ZodError);
    });

    it('should throw validation error for negative portion amount', () => {
      const invalidDose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: -5,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(invalidDose)).toThrow(z.ZodError);
    });

    it('should throw validation error for zero portion amount', () => {
      const invalidDose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: 0,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(invalidDose)).toThrow(z.ZodError);
    });
  });

  describe('Boundary Conditions - Day Numbers', () => {
    it('should throw validation error for day number 0', () => {
      const invalidDose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: 0,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: 5,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(invalidDose)).toThrow(z.ZodError);
    });

    it('should throw validation error for day number 4', () => {
      const invalidDose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: 4,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: 5,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(invalidDose)).toThrow(z.ZodError);
    });

    it('should throw validation error for negative day number', () => {
      const invalidDose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: -1,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: 5,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(invalidDose)).toThrow(z.ZodError);
    });

    it('should throw error when getPortionForDay called with day 0', () => {
      expect(() => getPortionForDay('fructose', 0)).toThrow(
        'Invalid day number: 0. Must be 1, 2, or 3.'
      );
    });

    it('should throw error when getPortionForDay called with day 4', () => {
      expect(() => getPortionForDay('fructose', 4)).toThrow(
        'Invalid day number: 4. Must be 1, 2, or 3.'
      );
    });

    it('should throw error when getPortionForDay called with negative day', () => {
      expect(() => getPortionForDay('fructose', -1)).toThrow(
        'Invalid day number: -1. Must be 1, 2, or 3.'
      );
    });
  });

  describe('Boundary Conditions - Washout Duration', () => {
    it('should throw validation error for washout duration less than 3 days', () => {
      const invalidWashout = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-03T00:00:00Z',
        durationDays: 2,
        reason: 'Test',
      };

      expect(() => WashoutPeriodSchema.parse(invalidWashout)).toThrow(z.ZodError);
    });

    it('should throw validation error for washout duration more than 7 days', () => {
      const invalidWashout = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-09T00:00:00Z',
        durationDays: 8,
        reason: 'Test',
      };

      expect(() => WashoutPeriodSchema.parse(invalidWashout)).toThrow(z.ZodError);
    });

    it('should accept washout duration of exactly 3 days', () => {
      const validWashout = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-04T00:00:00Z',
        durationDays: 3,
        reason: 'Mild symptoms',
      };

      expect(() => WashoutPeriodSchema.parse(validWashout)).not.toThrow();
    });

    it('should accept washout duration of exactly 7 days', () => {
      const validWashout = {
        startDate: '2024-01-01T00:00:00Z',
        endDate: '2024-01-08T00:00:00Z',
        durationDays: 7,
        reason: 'Severe symptoms',
      };

      expect(() => WashoutPeriodSchema.parse(validWashout)).not.toThrow();
    });
  });

  describe('Boundary Conditions - Dose Arrays', () => {
    it('should throw validation error for empty doses array in FoodTestResult', () => {
      const invalidTest = {
        foodItem: 'Honey',
        fodmapGroup: 'fructose',
        doses: [],
        toleranceStatus: 'untested',
        startDate: '2024-01-01T00:00:00Z',
      };

      expect(() => FoodTestResultSchema.parse(invalidTest)).toThrow(z.ZodError);
    });

    it('should throw validation error for more than 3 doses', () => {
      const invalidTest = {
        foodItem: 'Honey',
        fodmapGroup: 'fructose',
        doses: [
          {
            date: '2024-01-01T00:00:00Z',
            dayNumber: 1,
            foodItem: 'Honey',
            portionSize: '1 tsp',
            portionAmount: 5,
            symptoms: [],
          },
          {
            date: '2024-01-02T00:00:00Z',
            dayNumber: 2,
            foodItem: 'Honey',
            portionSize: '2 tsp',
            portionAmount: 10,
            symptoms: [],
          },
          {
            date: '2024-01-03T00:00:00Z',
            dayNumber: 3,
            foodItem: 'Honey',
            portionSize: '1 tbsp',
            portionAmount: 15,
            symptoms: [],
          },
          {
            date: '2024-01-04T00:00:00Z',
            dayNumber: 4,
            foodItem: 'Honey',
            portionSize: '2 tbsp',
            portionAmount: 30,
            symptoms: [],
          },
        ],
        toleranceStatus: 'untested',
        startDate: '2024-01-01T00:00:00Z',
      };

      expect(() => FoodTestResultSchema.parse(invalidTest)).toThrow(z.ZodError);
    });
  });

  describe('Date Boundary Conditions', () => {
    it('should handle leap year dates correctly', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-02-28T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2024-02-28T00:00:00Z',
          endDate: '2024-03-06T00:00:00Z',
          durationDays: 7,
          reason: 'Severe symptoms',
        },
      };

      const now = new Date('2024-02-29T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBeGreaterThan(0);
    });

    it('should handle month boundary transitions', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-30T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2024-01-30T00:00:00Z',
          endDate: '2024-02-06T00:00:00Z',
          durationDays: 7,
          reason: 'Moderate symptoms',
        },
      };

      const now = new Date('2024-01-31T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBeGreaterThan(0);
    });

    it('should handle year boundary transitions', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2023-12-29T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2023-12-29T00:00:00Z',
          endDate: '2024-01-05T00:00:00Z',
          durationDays: 7,
          reason: 'Severe symptoms',
        },
      };

      const now = new Date('2023-12-31T23:59:59Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBeGreaterThan(0);
    });

    it('should handle dates at end of month correctly', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-03-31T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2024-03-31T00:00:00Z',
          endDate: '2024-04-07T00:00:00Z',
          durationDays: 7,
          reason: 'Test',
        },
      };

      const now = new Date('2024-04-01T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBeGreaterThan(0);
    });
  });

  describe('Maximum Values', () => {
    it('should handle many completed tests', () => {
      const completedTests = Array.from({ length: 50 }, (_, i) => {
        const dayNum = (i % 28) + 1;
        const monthNum = Math.floor(i / 28) + 1;
        return {
          foodItem: `Food${i}`,
          fodmapGroup: (['fructose', 'lactose', 'fructans', 'galactans', 'polyols'] as const)[
            i % 5
          ],
          doses: [
            {
              date: `2024-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}T00:00:00Z`,
              dayNumber: 1,
              foodItem: `Food${i}`,
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [],
            },
          ],
          toleranceStatus: 'tolerated' as const,
          startDate: `2024-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}T00:00:00Z`,
          endDate: `2024-${String(monthNum).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}T00:00:00Z`,
        };
      });

      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests,
        phase: 'completed',
      };

      const now = new Date('2024-04-10T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('protocol_complete');
      expect(action.summary?.totalTestsCompleted).toBe(50);
      expect(action.summary?.toleratedFoods.length).toBe(50);
    });

    it('should handle protocol state with all FODMAP groups completed multiple times', () => {
      const completedTests = [
        'fructose',
        'lactose',
        'fructans',
        'galactans',
        'polyols',
        'fructose',
        'lactose',
      ].map((group, i) => ({
        foodItem: `Food${i}`,
        fodmapGroup: group as any,
        doses: [
          {
            date: `2024-01-0${i + 1}T00:00:00Z`,
            dayNumber: 1,
            foodItem: `Food${i}`,
            portionSize: '1 tsp',
            portionAmount: 5,
            symptoms: [],
          },
        ],
        toleranceStatus: 'tolerated' as const,
        startDate: `2024-01-0${i + 1}T00:00:00Z`,
        endDate: `2024-01-0${i + 1}T00:00:00Z`,
      }));

      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests,
        phase: 'completed',
      };

      const now = new Date('2024-01-10T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('protocol_complete');
      expect(action.summary?.groupsCompleted.length).toBe(5);
    });

    it('should handle very long washout period at maximum duration', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2024-01-01T00:00:00Z',
          endDate: '2024-01-08T00:00:00Z',
          durationDays: 7,
          reason: 'Severe symptoms',
        },
      };

      const now = new Date('2024-01-01T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBe(7);
    });
  });

  describe('Empty and Minimal States', () => {
    it('should handle empty completed tests array', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'fructose',
          doses: [
            {
              date: '2024-01-01T00:00:00Z',
              dayNumber: 1,
              foodItem: 'Honey',
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T00:00:00Z',
        },
      };

      const now = new Date('2024-01-02T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('start_dose');
      expect(action.currentDayNumber).toBe(2);
    });

    it('should start first group when no tests completed and no current test', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'completed',
      };

      const now = new Date('2024-01-01T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('start_next_group');
      expect(action.currentGroup).toBe('fructose');
    });

    it('should handle empty symptoms array in dose', () => {
      const state: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'fructose',
          doses: [
            {
              date: '2024-01-01T00:00:00Z',
              dayNumber: 1,
              foodItem: 'Honey',
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T00:00:00Z',
        },
      };

      const now = new Date('2024-01-02T00:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('start_dose');
      expect(action.currentDayNumber).toBe(2);
    });
  });

  describe('Fractional and Decimal Values', () => {
    it('should accept fractional portion amounts', () => {
      const dose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '0.5 tsp',
        portionAmount: 2.5,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(dose)).not.toThrow();
    });

    it('should accept very small positive portion amounts', () => {
      const dose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '0.1 tsp',
        portionAmount: 0.001,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(dose)).not.toThrow();
    });

    it('should accept very large portion amounts', () => {
      const dose = {
        date: '2024-01-01T00:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '10 cups',
        portionAmount: 10000,
        symptoms: [],
      };

      expect(() => DoseRecordSchema.parse(dose)).not.toThrow();
    });
  });
});
