import { classifyTolerance } from '../tolerance';
import { DoseRecord } from '../types';

describe('Tolerance Classification', () => {
  describe('classifyTolerance', () => {
    it('should return "untested" for empty doses array', () => {
      const doses: DoseRecord[] = [];
      const result = classifyTolerance(doses);

      expect(result.status).toBe('untested');
      expect(result.maxToleratedPortion).toBeUndefined();
      expect(result.triggerPortion).toBeUndefined();
    });

    it('should return "tolerated" with maxToleratedPortion when all doses have no/mild symptoms', () => {
      const doses: DoseRecord[] = [
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
          symptoms: [
            {
              timestamp: '2024-01-02T12:00:00Z',
              severity: 'mild',
              type: 'bloating',
            },
          ],
        },
        {
          date: '2024-01-03T08:00:00Z',
          dayNumber: 3,
          foodItem: 'Honey',
          portionSize: '1 tbsp',
          portionAmount: 15,
          symptoms: [],
        },
      ];

      const result = classifyTolerance(doses);

      expect(result.status).toBe('tolerated');
      expect(result.maxToleratedPortion).toBe('1 tbsp');
      expect(result.triggerPortion).toBeUndefined();
    });

    it('should return "trigger" with triggerPortion when severe symptoms occur on day 1', () => {
      const doses: DoseRecord[] = [
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
      ];

      const result = classifyTolerance(doses);

      expect(result.status).toBe('trigger');
      expect(result.triggerPortion).toBe('1 tsp');
      expect(result.maxToleratedPortion).toBeUndefined();
    });

    it('should return "sensitive" with both portions when moderate symptoms occur on day 2', () => {
      const doses: DoseRecord[] = [
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
          symptoms: [
            {
              timestamp: '2024-01-02T12:00:00Z',
              severity: 'moderate',
              type: 'cramping',
            },
          ],
        },
      ];

      const result = classifyTolerance(doses);

      expect(result.status).toBe('sensitive');
      expect(result.maxToleratedPortion).toBe('1 tsp');
      expect(result.triggerPortion).toBe('2 tsp');
    });

    it('should handle dose-dependent symptoms (tolerated day 1, moderate day 2)', () => {
      const doses: DoseRecord[] = [
        {
          date: '2024-01-01T08:00:00Z',
          dayNumber: 1,
          foodItem: 'Milk',
          portionSize: '1/4 cup',
          portionAmount: 60,
          symptoms: [
            {
              timestamp: '2024-01-01T10:00:00Z',
              severity: 'none',
              type: 'none',
            },
          ],
        },
        {
          date: '2024-01-02T08:00:00Z',
          dayNumber: 2,
          foodItem: 'Milk',
          portionSize: '1/2 cup',
          portionAmount: 120,
          symptoms: [
            {
              timestamp: '2024-01-02T11:00:00Z',
              severity: 'moderate',
              type: 'bloating',
            },
            {
              timestamp: '2024-01-02T14:00:00Z',
              severity: 'mild',
              type: 'gas',
            },
          ],
        },
      ];

      const result = classifyTolerance(doses);

      expect(result.status).toBe('sensitive');
      expect(result.maxToleratedPortion).toBe('1/4 cup');
      expect(result.triggerPortion).toBe('1/2 cup');
    });

    it('should return "trigger" when severe symptoms occur on day 3', () => {
      const doses: DoseRecord[] = [
        {
          date: '2024-01-01T08:00:00Z',
          dayNumber: 1,
          foodItem: 'Wheat bread',
          portionSize: '1 slice',
          portionAmount: 30,
          symptoms: [],
        },
        {
          date: '2024-01-02T08:00:00Z',
          dayNumber: 2,
          foodItem: 'Wheat bread',
          portionSize: '2 slices',
          portionAmount: 60,
          symptoms: [
            {
              timestamp: '2024-01-02T12:00:00Z',
              severity: 'mild',
              type: 'bloating',
            },
          ],
        },
        {
          date: '2024-01-03T08:00:00Z',
          dayNumber: 3,
          foodItem: 'Wheat bread',
          portionSize: '3 slices',
          portionAmount: 90,
          symptoms: [
            {
              timestamp: '2024-01-03T11:00:00Z',
              severity: 'severe',
              type: 'pain',
            },
          ],
        },
      ];

      const result = classifyTolerance(doses);

      expect(result.status).toBe('trigger');
      expect(result.triggerPortion).toBe('3 slices');
      expect(result.maxToleratedPortion).toBeUndefined();
    });

    it('should return "sensitive" when moderate symptoms occur on day 3', () => {
      const doses: DoseRecord[] = [
        {
          date: '2024-01-01T08:00:00Z',
          dayNumber: 1,
          foodItem: 'Chickpeas',
          portionSize: '1/4 cup',
          portionAmount: 40,
          symptoms: [],
        },
        {
          date: '2024-01-02T08:00:00Z',
          dayNumber: 2,
          foodItem: 'Chickpeas',
          portionSize: '1/2 cup',
          portionAmount: 80,
          symptoms: [
            {
              timestamp: '2024-01-02T13:00:00Z',
              severity: 'mild',
              type: 'gas',
            },
          ],
        },
        {
          date: '2024-01-03T08:00:00Z',
          dayNumber: 3,
          foodItem: 'Chickpeas',
          portionSize: '3/4 cup',
          portionAmount: 120,
          symptoms: [
            {
              timestamp: '2024-01-03T12:00:00Z',
              severity: 'moderate',
              type: 'bloating',
            },
          ],
        },
      ];

      const result = classifyTolerance(doses);

      expect(result.status).toBe('sensitive');
      expect(result.maxToleratedPortion).toBe('1/2 cup');
      expect(result.triggerPortion).toBe('3/4 cup');
    });

    it('should handle single dose with no symptoms as tolerated', () => {
      const doses: DoseRecord[] = [
        {
          date: '2024-01-01T08:00:00Z',
          dayNumber: 1,
          foodItem: 'Avocado',
          portionSize: '1/4 cup',
          portionAmount: 50,
          symptoms: [],
        },
      ];

      const result = classifyTolerance(doses);

      expect(result.status).toBe('tolerated');
      expect(result.maxToleratedPortion).toBe('1/4 cup');
      expect(result.triggerPortion).toBeUndefined();
    });
  });
});
