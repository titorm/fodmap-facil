import { getGroupSequence, getNextGroup, getRecommendedFoods, getPortionForDay } from '../sequence';
import { STANDARD_GROUP_SEQUENCE, RECOMMENDED_FOODS } from '../config';
import type { ProtocolState, FODMAPGroup } from '../types';

describe('Sequence Management', () => {
  describe('getGroupSequence', () => {
    it('should return standard sequence when no custom sequence provided', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
      };

      const result = getGroupSequence(state);

      expect(result).toEqual(STANDARD_GROUP_SEQUENCE);
      expect(result).toEqual(['fructose', 'lactose', 'fructans', 'galactans', 'polyols']);
    });

    it('should return custom sequence when provided', () => {
      const customSequence: FODMAPGroup[] = [
        'polyols',
        'lactose',
        'fructose',
        'galactans',
        'fructans',
      ];
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T00:00:00Z',
        groupSequence: customSequence,
        completedTests: [],
        phase: 'testing',
      };

      const result = getGroupSequence(state);

      expect(result).toEqual(customSequence);
      expect(result).not.toEqual(STANDARD_GROUP_SEQUENCE);
    });
  });

  describe('getNextGroup', () => {
    it('should return first group when none completed', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
      };

      const result = getNextGroup(state);

      expect(result).toBe('fructose');
    });

    it('should return second group when first completed', () => {
      const state: ProtocolState = {
        userId: 'user1',
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
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-01T00:00:00Z',
          },
        ],
        phase: 'testing',
      };

      const result = getNextGroup(state);

      expect(result).toBe('lactose');
    });

    it('should return null when all groups completed', () => {
      const state: ProtocolState = {
        userId: 'user1',
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
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-01T00:00:00Z',
          },
          {
            foodItem: 'Milk',
            fodmapGroup: 'lactose',
            doses: [
              {
                date: '2024-01-05T00:00:00Z',
                dayNumber: 1,
                foodItem: 'Milk',
                portionSize: '1/4 cup',
                portionAmount: 60,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-05T00:00:00Z',
          },
          {
            foodItem: 'Wheat bread',
            fodmapGroup: 'fructans',
            doses: [
              {
                date: '2024-01-10T00:00:00Z',
                dayNumber: 1,
                foodItem: 'Wheat bread',
                portionSize: '1 slice',
                portionAmount: 30,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-10T00:00:00Z',
          },
          {
            foodItem: 'Chickpeas',
            fodmapGroup: 'galactans',
            doses: [
              {
                date: '2024-01-15T00:00:00Z',
                dayNumber: 1,
                foodItem: 'Chickpeas',
                portionSize: '1/4 cup',
                portionAmount: 40,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-15T00:00:00Z',
          },
          {
            foodItem: 'Avocado',
            fodmapGroup: 'polyols',
            doses: [
              {
                date: '2024-01-20T00:00:00Z',
                dayNumber: 1,
                foodItem: 'Avocado',
                portionSize: '1/4 cup',
                portionAmount: 50,
                symptoms: [],
              },
            ],
            toleranceStatus: 'tolerated',
            startDate: '2024-01-20T00:00:00Z',
          },
        ],
        phase: 'completed',
      };

      const result = getNextGroup(state);

      expect(result).toBeNull();
    });
  });

  describe('getRecommendedFoods', () => {
    it('should return correct foods for fructose group', () => {
      const result = getRecommendedFoods('fructose');
      expect(result).toEqual(RECOMMENDED_FOODS.fructose);
      expect(result).toEqual(['Honey', 'Mango', 'Asparagus']);
    });

    it('should return correct foods for lactose group', () => {
      const result = getRecommendedFoods('lactose');
      expect(result).toEqual(RECOMMENDED_FOODS.lactose);
      expect(result).toEqual(['Milk', 'Yogurt', 'Ice cream']);
    });

    it('should return correct foods for fructans group', () => {
      const result = getRecommendedFoods('fructans');
      expect(result).toEqual(RECOMMENDED_FOODS.fructans);
      expect(result).toEqual(['Wheat bread', 'Garlic', 'Onion']);
    });

    it('should return correct foods for galactans group', () => {
      const result = getRecommendedFoods('galactans');
      expect(result).toEqual(RECOMMENDED_FOODS.galactans);
      expect(result).toEqual(['Chickpeas', 'Lentils', 'Kidney beans']);
    });

    it('should return correct foods for polyols group', () => {
      const result = getRecommendedFoods('polyols');
      expect(result).toEqual(RECOMMENDED_FOODS.polyols);
      expect(result).toEqual(['Avocado', 'Mushrooms', 'Cauliflower']);
    });
  });

  describe('getPortionForDay', () => {
    it('should return correct portion for day 1', () => {
      expect(getPortionForDay('fructose', 1)).toBe('1 tsp');
      expect(getPortionForDay('lactose', 1)).toBe('1/4 cup');
      expect(getPortionForDay('fructans', 1)).toBe('1 slice');
    });

    it('should return correct portion for day 2', () => {
      expect(getPortionForDay('fructose', 2)).toBe('2 tsp');
      expect(getPortionForDay('lactose', 2)).toBe('1/2 cup');
      expect(getPortionForDay('fructans', 2)).toBe('2 slices');
    });

    it('should return correct portion for day 3', () => {
      expect(getPortionForDay('fructose', 3)).toBe('1 tbsp');
      expect(getPortionForDay('lactose', 3)).toBe('1 cup');
      expect(getPortionForDay('fructans', 3)).toBe('3 slices');
    });

    it('should throw error for day number 0', () => {
      expect(() => getPortionForDay('fructose', 0)).toThrow(
        'Invalid day number: 0. Must be 1, 2, or 3.'
      );
    });

    it('should throw error for day number 4', () => {
      expect(() => getPortionForDay('lactose', 4)).toThrow(
        'Invalid day number: 4. Must be 1, 2, or 3.'
      );
    });

    it('should throw error for negative day number', () => {
      expect(() => getPortionForDay('polyols', -1)).toThrow(
        'Invalid day number: -1. Must be 1, 2, or 3.'
      );
    });
  });
});
