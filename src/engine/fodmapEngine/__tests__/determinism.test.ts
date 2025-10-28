import { calculateNextAction } from '../index';
import type { ProtocolState, NextAction } from '../types';

describe('FODMAP Engine Determinism Tests', () => {
  describe('calculateNextAction returns identical output for same inputs', () => {
    it('should return identical results for starting protocol', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        phase: 'testing',
      };
      const now = new Date('2024-01-01T08:00:00Z');

      const result1 = calculateNextAction(state, now);
      const result2 = calculateNextAction(state, now);

      expect(result1).toEqual(result2);
    });

    it('should return identical results for test in progress', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'fructose',
          doses: [
            {
              date: '2024-01-01T08:00:00Z',
              dayNumber: 1,
              foodItem: 'Honey',
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T08:00:00Z',
        },
        phase: 'testing',
      };
      const now = new Date('2024-01-02T08:00:00Z');

      const result1 = calculateNextAction(state, now);
      const result2 = calculateNextAction(state, now);

      expect(result1).toEqual(result2);
    });

    it('should return identical results for washout period', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentWashout: {
          startDate: '2024-01-04T08:00:00Z',
          endDate: '2024-01-07T08:00:00Z',
          durationDays: 3,
          reason: 'none symptoms require 3-day washout',
        },
        phase: 'washout',
      };
      const now = new Date('2024-01-05T08:00:00Z');

      const result1 = calculateNextAction(state, now);
      const result2 = calculateNextAction(state, now);

      expect(result1).toEqual(result2);
    });

    it('should return identical results for protocol completion', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [
          {
            foodItem: 'Honey',
            fodmapGroup: 'fructose',
            doses: [
              {
                date: '2024-01-01T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Honey',
                portionSize: '1 tsp',
                portionAmount: 5,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-01T08:00:00Z',
          },
          {
            foodItem: 'Milk',
            fodmapGroup: 'lactose',
            doses: [
              {
                date: '2024-01-10T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Milk',
                portionSize: '1/4 cup',
                portionAmount: 60,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-10T08:00:00Z',
          },
          {
            foodItem: 'Wheat bread',
            fodmapGroup: 'fructans',
            doses: [
              {
                date: '2024-01-20T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Wheat bread',
                portionSize: '1 slice',
                portionAmount: 30,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-20T08:00:00Z',
          },
          {
            foodItem: 'Chickpeas',
            fodmapGroup: 'galactans',
            doses: [
              {
                date: '2024-01-30T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Chickpeas',
                portionSize: '1/4 cup',
                portionAmount: 40,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-30T08:00:00Z',
          },
          {
            foodItem: 'Avocado',
            fodmapGroup: 'polyols',
            doses: [
              {
                date: '2024-02-05T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Avocado',
                portionSize: '1/4 cup',
                portionAmount: 50,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-02-05T08:00:00Z',
          },
        ],
        phase: 'completed',
      };
      const now = new Date('2024-02-10T08:00:00Z');

      const result1 = calculateNextAction(state, now);
      const result2 = calculateNextAction(state, now);

      expect(result1).toEqual(result2);
    });
  });

  describe('Time injection works correctly (no system clock access)', () => {
    it('should use injected time for washout calculations', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentWashout: {
          startDate: '2024-01-04T08:00:00Z',
          endDate: '2024-01-07T08:00:00Z',
          durationDays: 3,
          reason: 'none symptoms require 3-day washout',
        },
        phase: 'washout',
      };

      // Test with different injected times
      const day1 = new Date('2024-01-04T08:00:00Z');
      const day2 = new Date('2024-01-05T08:00:00Z');
      const day3 = new Date('2024-01-06T08:00:00Z');

      const result1 = calculateNextAction(state, day1);
      const result2 = calculateNextAction(state, day2);
      const result3 = calculateNextAction(state, day3);

      expect(result1.washoutDaysRemaining).toBe(3);
      expect(result2.washoutDaysRemaining).toBe(2);
      expect(result3.washoutDaysRemaining).toBe(1);
    });

    it('should produce different results for different injected times', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentWashout: {
          startDate: '2024-01-04T08:00:00Z',
          endDate: '2024-01-07T08:00:00Z',
          durationDays: 3,
          reason: 'none symptoms require 3-day washout',
        },
        phase: 'washout',
      };

      const beforeWashout = new Date('2024-01-05T08:00:00Z');
      const afterWashout = new Date('2024-01-08T08:00:00Z');

      const resultBefore = calculateNextAction(state, beforeWashout);

      // Update state to reflect washout completion
      const stateAfter: ProtocolState = {
        ...state,
        currentWashout: undefined,
        phase: 'testing',
      };
      const resultAfter = calculateNextAction(stateAfter, afterWashout);

      expect(resultBefore.action).toBe('continue_washout');
      expect(resultAfter.action).toBe('start_next_group');
    });

    it('should not depend on system time', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        phase: 'testing',
      };

      // Use a fixed time from the past
      const fixedTime = new Date('2024-01-01T08:00:00Z');

      const result = calculateNextAction(state, fixedTime);

      // Result should be consistent regardless of when test runs
      expect(result.action).toBe('start_next_group');
      expect(result.currentGroup).toBe('fructose');
    });
  });

  describe('Date calculations are deterministic', () => {
    it('should calculate washout end dates consistently', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'fructose',
          doses: [
            {
              date: '2024-01-01T08:00:00Z',
              dayNumber: 1,
              foodItem: 'Honey',
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [
                {
                  timestamp: '2024-01-01T12:00:00Z',
                  severity: 'severe',
                  type: 'pain',
                },
              ],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T08:00:00Z',
        },
        phase: 'testing',
      };
      const now = new Date('2024-01-02T08:00:00Z');

      const result1 = calculateNextAction(state, now);
      const result2 = calculateNextAction(state, now);

      expect(result1.nextMilestone?.date).toBe(result2.nextMilestone?.date);
      expect(result1.washoutDaysRemaining).toBe(result2.washoutDaysRemaining);
    });

    it('should handle month boundaries correctly', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentWashout: {
          startDate: '2024-01-29T08:00:00Z',
          endDate: '2024-02-05T08:00:00Z',
          durationDays: 7,
          reason: 'severe symptoms require 7-day washout',
        },
        phase: 'washout',
      };

      const jan31 = new Date('2024-01-31T08:00:00Z');
      const feb1 = new Date('2024-02-01T08:00:00Z');
      const feb2 = new Date('2024-02-02T08:00:00Z');

      const result1 = calculateNextAction(state, jan31);
      const result2 = calculateNextAction(state, feb1);
      const result3 = calculateNextAction(state, feb2);

      expect(result1.washoutDaysRemaining).toBe(5);
      expect(result2.washoutDaysRemaining).toBe(4);
      expect(result3.washoutDaysRemaining).toBe(3);
    });

    it('should handle leap year correctly', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-02-01T08:00:00Z',
        completedTests: [],
        currentWashout: {
          startDate: '2024-02-27T08:00:00Z',
          endDate: '2024-03-05T08:00:00Z',
          durationDays: 7,
          reason: 'severe symptoms require 7-day washout',
        },
        phase: 'washout',
      };

      const feb28 = new Date('2024-02-28T08:00:00Z');
      const feb29 = new Date('2024-02-29T08:00:00Z');
      const mar1 = new Date('2024-03-01T08:00:00Z');

      const result1 = calculateNextAction(state, feb28);
      const result2 = calculateNextAction(state, feb29);
      const result3 = calculateNextAction(state, mar1);

      expect(result1.washoutDaysRemaining).toBe(6);
      expect(result2.washoutDaysRemaining).toBe(5);
      expect(result3.washoutDaysRemaining).toBe(4);
    });
  });

  describe('No randomness in any function', () => {
    it('should produce identical group sequences', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        phase: 'testing',
      };
      const now = new Date('2024-01-01T08:00:00Z');

      const groups: string[] = [];
      for (let i = 0; i < 10; i++) {
        const result = calculateNextAction(state, now);
        groups.push(result.currentGroup || '');
      }

      // All results should be identical
      expect(new Set(groups).size).toBe(1);
      expect(groups[0]).toBe('fructose');
    });

    it('should produce identical food recommendations', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        phase: 'testing',
      };
      const now = new Date('2024-01-01T08:00:00Z');

      const foods: string[] = [];
      for (let i = 0; i < 10; i++) {
        const result = calculateNextAction(state, now);
        foods.push(result.currentFood || '');
      }

      // All results should be identical
      expect(new Set(foods).size).toBe(1);
      expect(foods[0]).toBe('Honey');
    });

    it('should produce identical portion recommendations', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'fructose',
          doses: [
            {
              date: '2024-01-01T08:00:00Z',
              dayNumber: 1,
              foodItem: 'Honey',
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T08:00:00Z',
        },
        phase: 'testing',
      };
      const now = new Date('2024-01-02T08:00:00Z');

      const portions: string[] = [];
      for (let i = 0; i < 10; i++) {
        const result = calculateNextAction(state, now);
        portions.push(result.recommendedPortion || '');
      }

      // All results should be identical
      expect(new Set(portions).size).toBe(1);
      expect(portions[0]).toBe('2 tsp');
    });
  });

  describe('Run same test 100 times and verify identical results', () => {
    it('should return identical results for starting protocol (100 iterations)', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        phase: 'testing',
      };
      const now = new Date('2024-01-01T08:00:00Z');

      const results: NextAction[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(calculateNextAction(state, now));
      }

      // All results should be identical
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(firstResult);
      }
    });

    it('should return identical results for washout period (100 iterations)', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentWashout: {
          startDate: '2024-01-04T08:00:00Z',
          endDate: '2024-01-07T08:00:00Z',
          durationDays: 3,
          reason: 'none symptoms require 3-day washout',
        },
        phase: 'washout',
      };
      const now = new Date('2024-01-05T08:00:00Z');

      const results: NextAction[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(calculateNextAction(state, now));
      }

      // All results should be identical
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(firstResult);
      }
    });

    it('should return identical results for test progression (100 iterations)', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'fructose',
          doses: [
            {
              date: '2024-01-01T08:00:00Z',
              dayNumber: 1,
              foodItem: 'Honey',
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [],
            },
            {
              date: '2024-01-02T08:00:00Z',
              dayNumber: 2,
              foodItem: 'Honey',
              portionSize: '2 tsp',
              portionAmount: 10,
              symptoms: [],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T08:00:00Z',
        },
        phase: 'testing',
      };
      const now = new Date('2024-01-03T08:00:00Z');

      const results: NextAction[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(calculateNextAction(state, now));
      }

      // All results should be identical
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(firstResult);
      }
    });

    it('should return identical results for protocol completion (100 iterations)', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [
          {
            foodItem: 'Honey',
            fodmapGroup: 'fructose',
            doses: [
              {
                date: '2024-01-01T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Honey',
                portionSize: '1 tsp',
                portionAmount: 5,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-01T08:00:00Z',
          },
          {
            foodItem: 'Milk',
            fodmapGroup: 'lactose',
            doses: [
              {
                date: '2024-01-10T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Milk',
                portionSize: '1/4 cup',
                portionAmount: 60,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-10T08:00:00Z',
          },
          {
            foodItem: 'Wheat bread',
            fodmapGroup: 'fructans',
            doses: [
              {
                date: '2024-01-20T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Wheat bread',
                portionSize: '1 slice',
                portionAmount: 30,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-20T08:00:00Z',
          },
          {
            foodItem: 'Chickpeas',
            fodmapGroup: 'galactans',
            doses: [
              {
                date: '2024-01-30T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Chickpeas',
                portionSize: '1/4 cup',
                portionAmount: 40,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-30T08:00:00Z',
          },
          {
            foodItem: 'Avocado',
            fodmapGroup: 'polyols',
            doses: [
              {
                date: '2024-02-05T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Avocado',
                portionSize: '1/4 cup',
                portionAmount: 50,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-02-05T08:00:00Z',
          },
        ],
        phase: 'completed',
      };
      const now = new Date('2024-02-10T08:00:00Z');

      const results: NextAction[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(calculateNextAction(state, now));
      }

      // All results should be identical
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(firstResult);
      }

      // Verify summary is consistent
      expect(firstResult.summary?.totalTestsCompleted).toBe(5);
      expect(firstResult.summary?.toleratedFoods).toHaveLength(5);
    });

    it('should return identical results with complex state (100 iterations)', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [
          {
            foodItem: 'Honey',
            fodmapGroup: 'fructose',
            doses: [
              {
                date: '2024-01-01T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Honey',
                portionSize: '1 tsp',
                portionAmount: 5,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            maxToleratedPortion: '1 tsp',
            startDate: '2024-01-01T08:00:00Z',
          },
          {
            foodItem: 'Milk',
            fodmapGroup: 'lactose',
            doses: [
              {
                date: '2024-01-10T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Milk',
                portionSize: '1/4 cup',
                portionAmount: 60,
                symptoms: [
                  {
                    timestamp: '2024-01-10T12:00:00Z',
                    severity: 'moderate',
                    type: 'bloating',
                  },
                ],
              },
            ],
            toleranceStatus: 'sensitive',
            triggerPortion: '1/4 cup',
            startDate: '2024-01-10T08:00:00Z',
          },
        ],
        currentWashout: {
          startDate: '2024-01-15T08:00:00Z',
          endDate: '2024-01-22T08:00:00Z',
          durationDays: 7,
          reason: 'moderate symptoms require 7-day washout',
        },
        phase: 'washout',
      };
      const now = new Date('2024-01-18T08:00:00Z');

      const results: NextAction[] = [];
      for (let i = 0; i < 100; i++) {
        results.push(calculateNextAction(state, now));
      }

      // All results should be identical
      const firstResult = results[0];
      for (let i = 1; i < results.length; i++) {
        expect(results[i]).toEqual(firstResult);
      }

      // Verify washout calculation is consistent
      expect(firstResult.washoutDaysRemaining).toBe(4);
    });
  });
});
