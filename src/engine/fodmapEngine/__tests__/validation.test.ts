import { validateProtocolState } from '../validation';
import { ProtocolState } from '../types';

describe('State Validation', () => {
  describe('validateProtocolState', () => {
    it('should return valid=true for correct state', () => {
      const validState: ProtocolState = {
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

      const result = validateProtocolState(validState);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should return valid=true for state with no current test or washout', () => {
      const validState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'completed',
      };

      const result = validateProtocolState(validState);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect conflicting currentTest and currentWashout', () => {
      const invalidState: ProtocolState = {
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
        currentWashout: {
          startDate: '2024-01-02T00:00:00Z',
          endDate: '2024-01-05T00:00:00Z',
          durationDays: 3,
          reason: 'Test washout',
        },
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Cannot have both active test and washout period');
    });

    it('should detect non-sequential dose day numbers in currentTest', () => {
      const invalidState: ProtocolState = {
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
            {
              date: '2024-01-03T00:00:00Z',
              dayNumber: 3,
              foodItem: 'Honey',
              portionSize: '1 tbsp',
              portionAmount: 15,
              symptoms: [],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T00:00:00Z',
        },
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Dose day numbers must be sequential starting from 1');
    });

    it('should detect non-sequential dose day numbers in completedTests', () => {
      const invalidState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [
          {
            foodItem: 'Honey',
            fodmapGroup: 'fructose',
            doses: [
              {
                date: '2024-01-01T00:00:00Z',
                dayNumber: 2,
                foodItem: 'Honey',
                portionSize: '2 tsp',
                portionAmount: 10,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-04T00:00:00Z',
          },
        ],
        phase: 'completed',
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Dose day numbers must be sequential starting from 1 in completed test for Honey'
      );
    });

    it('should detect invalid washout dates (end before start)', () => {
      const invalidState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2024-01-05T00:00:00Z',
          endDate: '2024-01-02T00:00:00Z',
          durationDays: 3,
          reason: 'Test washout',
        },
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Washout end date must be after start date');
    });

    it('should detect invalid washout dates (end equal to start)', () => {
      const invalidState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2024-01-05T00:00:00Z',
          endDate: '2024-01-05T00:00:00Z',
          durationDays: 3,
          reason: 'Test washout',
        },
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Washout end date must be after start date');
    });

    it('should return all errors when multiple issues exist', () => {
      const invalidState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [
          {
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
                date: '2024-01-03T00:00:00Z',
                dayNumber: 3,
                foodItem: 'Honey',
                portionSize: '1 tbsp',
                portionAmount: 15,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-01-04T00:00:00Z',
          },
        ],
        phase: 'testing',
        currentTest: {
          foodItem: 'Milk',
          fodmapGroup: 'lactose',
          doses: [
            {
              date: '2024-01-10T00:00:00Z',
              dayNumber: 1,
              foodItem: 'Milk',
              portionSize: '1/4 cup',
              portionAmount: 60,
              symptoms: [],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-10T00:00:00Z',
        },
        currentWashout: {
          startDate: '2024-01-15T00:00:00Z',
          endDate: '2024-01-12T00:00:00Z',
          durationDays: 3,
          reason: 'Test washout',
        },
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain('Cannot have both active test and washout period');
      expect(result.errors).toContain(
        'Dose day numbers must be sequential starting from 1 in completed test for Honey'
      );
      expect(result.errors).toContain('Washout end date must be after start date');
    });

    it('should allow testing phase without current test (between tests)', () => {
      const validState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
      };

      const result = validateProtocolState(validState);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate phase consistency - washout phase without current washout', () => {
      const invalidState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'washout',
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Phase is "washout" but no current washout period exists');
    });

    it('should validate phase consistency - completed phase with current test', () => {
      const invalidState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'completed',
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

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Phase is "completed" but current test or washout still exists'
      );
    });

    it('should validate phase consistency - completed phase with current washout', () => {
      const invalidState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'completed',
        currentWashout: {
          startDate: '2024-01-02T00:00:00Z',
          endDate: '2024-01-05T00:00:00Z',
          durationDays: 3,
          reason: 'Test washout',
        },
      };

      const result = validateProtocolState(invalidState);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Phase is "completed" but current test or washout still exists'
      );
    });

    it('should accept valid state with sequential doses', () => {
      const validState: ProtocolState = {
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
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T00:00:00Z',
        },
      };

      const result = validateProtocolState(validState);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should accept valid washout state', () => {
      const validState: ProtocolState = {
        userId: 'user123',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'washout',
        currentWashout: {
          startDate: '2024-01-02T00:00:00Z',
          endDate: '2024-01-09T00:00:00Z',
          durationDays: 7,
          reason: 'Moderate symptoms',
        },
      };

      const result = validateProtocolState(validState);

      expect(result.valid).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });
});
