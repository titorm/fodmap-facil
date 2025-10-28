import { calculateNextAction } from '../index';
import type { ProtocolState } from '../types';

describe('FODMAP Engine Integration Tests', () => {
  describe('Complete protocol from start to finish with no symptoms (success scenario)', () => {
    it('should guide user through entire protocol with all foods tolerated', () => {
      // Start with a minimal valid state - no current test means we're between tests
      let state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentTest: undefined,
        currentWashout: undefined,
        phase: 'testing',
      };

      // Start protocol - should begin with fructose group
      let now = new Date('2024-01-01T08:00:00Z');
      let action = calculateNextAction(state, now);

      expect(action.action).toBe('start_next_group');
      expect(action.currentGroup).toBe('fructose');
      expect(action.currentFood).toBe('Honey');
      expect(action.currentDayNumber).toBe(1);
      expect(action.recommendedPortion).toBe('1 tsp');

      // Day 1 - Honey
      state.currentTest = {
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
      };

      // Day 2 - Honey
      now = new Date('2024-01-02T08:00:00Z');
      action = calculateNextAction(state, now);

      expect(action.action).toBe('start_dose');
      expect(action.currentDayNumber).toBe(2);
      expect(action.recommendedPortion).toBe('2 tsp');

      state.currentTest.doses.push({
        date: '2024-01-02T08:00:00Z',
        dayNumber: 2,
        foodItem: 'Honey',
        portionSize: '2 tsp',
        portionAmount: 10,
        symptoms: [],
      });

      // Day 3 - Honey
      now = new Date('2024-01-03T08:00:00Z');
      action = calculateNextAction(state, now);

      expect(action.action).toBe('start_dose');
      expect(action.currentDayNumber).toBe(3);
      expect(action.recommendedPortion).toBe('1 tbsp');

      state.currentTest.doses.push({
        date: '2024-01-03T08:00:00Z',
        dayNumber: 3,
        foodItem: 'Honey',
        portionSize: '1 tbsp',
        portionAmount: 15,
        symptoms: [],
      });

      // After day 3 - should start washout
      now = new Date('2024-01-04T08:00:00Z');
      action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBe(3);

      // Complete test and move to washout
      state.completedTests.push({
        ...state.currentTest,
        toleranceStatus: 'tolerated',
        maxToleratedPortion: '1 tbsp',
        endDate: '2024-01-04T08:00:00Z',
      });
      state.currentTest = undefined;
      state.currentWashout = {
        startDate: '2024-01-04T08:00:00Z',
        endDate: '2024-01-07T08:00:00Z',
        durationDays: 3,
        reason: 'none symptoms require 3-day washout',
      };

      // During washout
      now = new Date('2024-01-05T08:00:00Z');
      action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBe(2);

      // After washout - should start next group (lactose)
      now = new Date('2024-01-07T08:00:00Z');
      state.currentWashout = undefined;
      action = calculateNextAction(state, now);

      expect(action.action).toBe('start_next_group');
      expect(action.currentGroup).toBe('lactose');
      expect(action.currentFood).toBe('Milk');

      // Complete all remaining groups (lactose, fructans, galactans, polyols)
      const groups = ['lactose', 'fructans', 'galactans', 'polyols'];
      const foods = ['Milk', 'Wheat bread', 'Chickpeas', 'Avocado'];

      for (let i = 0; i < groups.length; i++) {
        state.completedTests.push({
          foodItem: foods[i],
          fodmapGroup: groups[i] as any,
          doses: [
            {
              date: `2024-01-${10 + i * 5}T08:00:00Z`,
              dayNumber: 1,
              foodItem: foods[i],
              portionSize: '1 portion',
              portionAmount: 100,
              symptoms: [],
            },
          ],
          toleranceStatus: 'tolerated',
          maxToleratedPortion: '1 portion',
          startDate: `2024-01-${10 + i * 5}T08:00:00Z`,
          endDate: `2024-01-${10 + i * 5}T08:00:00Z`,
        });
      }

      state.phase = 'completed';

      // Protocol complete
      now = new Date('2024-01-30T08:00:00Z');
      action = calculateNextAction(state, now);

      expect(action.action).toBe('protocol_complete');
      expect(action.summary?.totalTestsCompleted).toBe(5);
      expect(action.summary?.groupsCompleted).toHaveLength(5);
      expect(action.summary?.toleratedFoods).toHaveLength(5);
      expect(action.summary?.sensitiveFoods).toHaveLength(0);
      expect(action.summary?.triggerFoods).toHaveLength(0);
    });
  });

  describe('Protocol with dose-dependent symptoms', () => {
    it('should handle tolerated day 1, moderate symptoms on day 2', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentTest: {
          foodItem: 'Milk',
          fodmapGroup: 'lactose',
          doses: [
            {
              date: '2024-01-01T08:00:00Z',
              dayNumber: 1,
              foodItem: 'Milk',
              portionSize: '1/4 cup',
              portionAmount: 60,
              symptoms: [],
            },
            {
              date: '2024-01-02T08:00:00Z',
              dayNumber: 2,
              foodItem: 'Milk',
              portionSize: '1/2 cup',
              portionAmount: 120,
              symptoms: [
                {
                  timestamp: '2024-01-02T12:00:00Z',
                  severity: 'moderate',
                  type: 'bloating',
                },
              ],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T08:00:00Z',
        },
        phase: 'testing',
      };

      const now = new Date('2024-01-03T08:00:00Z');
      const action = calculateNextAction(state, now);

      // Should continue to day 3 (moderate on day 2 doesn't stop test)
      expect(action.action).toBe('start_dose');
      expect(action.currentDayNumber).toBe(3);
      expect(action.recommendedPortion).toBe('1 cup');
    });

    it('should classify food as sensitive after completing test with moderate symptoms', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [
          {
            foodItem: 'Milk',
            fodmapGroup: 'lactose',
            doses: [
              {
                date: '2024-01-01T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Milk',
                portionSize: '1/4 cup',
                portionAmount: 60,
                symptoms: [],
              },
              {
                date: '2024-01-02T08:00:00Z',
                dayNumber: 2,
                foodItem: 'Milk',
                portionSize: '1/2 cup',
                portionAmount: 120,
                symptoms: [
                  {
                    timestamp: '2024-01-02T12:00:00Z',
                    severity: 'moderate',
                    type: 'bloating',
                  },
                ],
              },
              {
                date: '2024-01-03T08:00:00Z',
                dayNumber: 3,
                foodItem: 'Milk',
                portionSize: '1 cup',
                portionAmount: 240,
                symptoms: [],
              },
            ],
            toleranceStatus: 'sensitive',
            maxToleratedPortion: '1/4 cup',
            triggerPortion: '1/2 cup',
            startDate: '2024-01-01T08:00:00Z',
            endDate: '2024-01-04T08:00:00Z',
          },
        ],
        phase: 'testing',
      };

      const now = new Date('2024-01-10T08:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('start_next_group');
      // Standard sequence is: fructose, lactose, fructans, galactans, polyols
      // Since only lactose is completed, next should be fructose (first in sequence)
      expect(action.currentGroup).toBe('fructose');
    });
  });

  describe('Protocol with early interruption (severe symptoms on day 1)', () => {
    it('should stop test immediately after severe symptoms on day 1', () => {
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
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.phase).toBe('washout');
      expect(action.washoutDaysRemaining).toBe(7); // Severe symptoms require 7-day washout
      expect(action.message).toContain('severe symptoms');
    });

    it('should classify food as trigger after severe symptoms', () => {
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
                symptoms: [
                  {
                    timestamp: '2024-01-01T12:00:00Z',
                    severity: 'severe',
                    type: 'pain',
                  },
                ],
              },
            ],
            toleranceStatus: 'trigger',
            triggerPortion: '1 tsp',
            startDate: '2024-01-01T08:00:00Z',
            endDate: '2024-01-02T08:00:00Z',
          },
        ],
        phase: 'testing',
      };

      const now = new Date('2024-01-10T08:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('start_next_group');
      expect(action.currentGroup).toBe('lactose');
    });
  });

  describe('Protocol with extended washout (moderate symptoms requiring 7 days)', () => {
    it('should require 7-day washout for moderate symptoms', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentTest: {
          foodItem: 'Wheat bread',
          fodmapGroup: 'fructans',
          doses: [
            {
              date: '2024-01-01T08:00:00Z',
              dayNumber: 1,
              foodItem: 'Wheat bread',
              portionSize: '1 slice',
              portionAmount: 30,
              symptoms: [
                {
                  timestamp: '2024-01-01T12:00:00Z',
                  severity: 'moderate',
                  type: 'bloating',
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
      const action = calculateNextAction(state, now);

      // Moderate symptoms on day 1 should stop test
      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBe(7);
    });

    it('should track washout progress over 7 days', () => {
      let state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        currentWashout: {
          startDate: '2024-01-02T08:00:00Z',
          endDate: '2024-01-09T08:00:00Z',
          durationDays: 7,
          reason: 'moderate symptoms require 7-day washout',
        },
        phase: 'washout',
      };

      // Day 1 of washout
      let now = new Date('2024-01-02T08:00:00Z');
      let action = calculateNextAction(state, now);
      expect(action.washoutDaysRemaining).toBe(7);

      // Day 4 of washout
      now = new Date('2024-01-05T08:00:00Z');
      action = calculateNextAction(state, now);
      expect(action.washoutDaysRemaining).toBe(4);

      // Day 7 of washout (last day)
      now = new Date('2024-01-08T08:00:00Z');
      action = calculateNextAction(state, now);
      expect(action.washoutDaysRemaining).toBe(1);

      // After washout complete - update state properly
      now = new Date('2024-01-09T08:00:00Z');
      state = {
        ...state,
        currentWashout: undefined,
        phase: 'testing', // Change phase to testing when no current test or washout
      };
      action = calculateNextAction(state, now);
      expect(action.action).toBe('start_next_group');
    });
  });

  describe('Protocol with custom group sequence', () => {
    it('should follow custom group sequence instead of standard', () => {
      const customSequence = ['polyols', 'lactose', 'fructose', 'galactans', 'fructans'] as const;
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        groupSequence: [...customSequence],
        completedTests: [],
        phase: 'testing',
      };

      const now = new Date('2024-01-01T08:00:00Z');
      const action = calculateNextAction(state, now);

      // Should start with polyols (first in custom sequence)
      expect(action.action).toBe('start_next_group');
      expect(action.currentGroup).toBe('polyols');
      expect(action.currentFood).toBe('Avocado');
    });

    it('should progress through custom sequence in order', () => {
      const customSequence = ['polyols', 'lactose', 'fructose', 'galactans', 'fructans'] as const;
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        groupSequence: [...customSequence],
        completedTests: [
          {
            foodItem: 'Avocado',
            fodmapGroup: 'polyols',
            doses: [
              {
                date: '2024-01-01T08:00:00Z',
                dayNumber: 1,
                foodItem: 'Avocado',
                portionSize: '1/4 cup',
                portionAmount: 50,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-01T08:00:00Z',
          },
        ],
        phase: 'testing',
      };

      const now = new Date('2024-01-05T08:00:00Z');
      const action = calculateNextAction(state, now);

      // Should move to lactose (second in custom sequence)
      expect(action.action).toBe('start_next_group');
      expect(action.currentGroup).toBe('lactose');
    });
  });

  describe('Protocol resumption after interruption', () => {
    it('should resume from current test in progress', () => {
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
        ],
        currentTest: {
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
          toleranceStatus: 'untested',
          startDate: '2024-01-10T08:00:00Z',
        },
        phase: 'testing',
      };

      const now = new Date('2024-01-11T08:00:00Z');
      const action = calculateNextAction(state, now);

      // Should continue with day 2 of current test
      expect(action.action).toBe('start_dose');
      expect(action.currentGroup).toBe('lactose');
      expect(action.currentFood).toBe('Milk');
      expect(action.currentDayNumber).toBe(2);
    });

    it('should resume from washout period in progress', () => {
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
        ],
        currentWashout: {
          startDate: '2024-01-05T08:00:00Z',
          endDate: '2024-01-08T08:00:00Z',
          durationDays: 3,
          reason: 'none symptoms require 3-day washout',
        },
        phase: 'washout',
      };

      const now = new Date('2024-01-06T08:00:00Z');
      const action = calculateNextAction(state, now);

      // Should continue washout
      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBe(2);
    });
  });

  describe('Test all FODMAP groups in sequence', () => {
    it('should test all 5 FODMAP groups in standard sequence', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T08:00:00Z',
        completedTests: [],
        phase: 'testing',
      };

      const groups = ['fructose', 'lactose', 'fructans', 'galactans', 'polyols'];
      const expectedFoods = ['Honey', 'Milk', 'Wheat bread', 'Chickpeas', 'Avocado'];

      let now = new Date('2024-01-01T08:00:00Z');

      for (let i = 0; i < groups.length; i++) {
        const action = calculateNextAction(state, now);

        expect(action.action).toBe('start_next_group');
        expect(action.currentGroup).toBe(groups[i]);
        expect(action.currentFood).toBe(expectedFoods[i]);
        expect(action.currentDayNumber).toBe(1);

        // Simulate completing the test
        state.completedTests.push({
          foodItem: expectedFoods[i],
          fodmapGroup: groups[i] as any,
          doses: [
            {
              date: now.toISOString(),
              dayNumber: 1,
              foodItem: expectedFoods[i],
              portionSize: '1 portion',
              portionAmount: 100,
              symptoms: [],
            },
          ],
          toleranceStatus: 'tolerated',
          startDate: now.toISOString(),
        });

        // Move to next test date
        now = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      }

      // After all groups completed
      state.phase = 'completed';
      const finalAction = calculateNextAction(state, now);

      expect(finalAction.action).toBe('protocol_complete');
      expect(finalAction.summary?.groupsCompleted).toEqual(groups);
      expect(finalAction.summary?.totalTestsCompleted).toBe(5);
    });

    it('should handle mixed tolerance results across all groups', () => {
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
                symptoms: [
                  {
                    timestamp: '2024-01-20T12:00:00Z',
                    severity: 'severe',
                    type: 'pain',
                  },
                ],
              },
            ],
            toleranceStatus: 'trigger',
            triggerPortion: '1 slice',
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
            maxToleratedPortion: '1/4 cup',
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
            maxToleratedPortion: '1/4 cup',
            startDate: '2024-02-05T08:00:00Z',
          },
        ],
        phase: 'completed',
      };

      const now = new Date('2024-02-10T08:00:00Z');
      const action = calculateNextAction(state, now);

      expect(action.action).toBe('protocol_complete');
      expect(action.summary?.totalTestsCompleted).toBe(5);
      expect(action.summary?.groupsCompleted).toHaveLength(5);
      expect(action.summary?.toleratedFoods).toEqual(['Honey', 'Chickpeas', 'Avocado']);
      expect(action.summary?.sensitiveFoods).toEqual(['Milk']);
      expect(action.summary?.triggerFoods).toEqual(['Wheat bread']);
    });
  });
});
