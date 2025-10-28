import type { FODMAPGroup, SymptomSeverity } from './types';

/**
 * Standard FODMAP group sequence for reintroduction protocol
 * Order: Fructose → Lactose → Fructans → Galactans → Polyols
 */
export const STANDARD_GROUP_SEQUENCE: FODMAPGroup[] = [
  'fructose',
  'lactose',
  'fructans',
  'galactans',
  'polyols',
];

/**
 * Recommended foods for testing each FODMAP group
 * Each group has 3 suggested foods to choose from
 */
export const RECOMMENDED_FOODS: Record<FODMAPGroup, string[]> = {
  fructose: ['Honey', 'Mango', 'Asparagus'],
  lactose: ['Milk', 'Yogurt', 'Ice cream'],
  fructans: ['Wheat bread', 'Garlic', 'Onion'],
  galactans: ['Chickpeas', 'Lentils', 'Kidney beans'],
  polyols: ['Avocado', 'Mushrooms', 'Cauliflower'],
};

/**
 * Portion progression for 3-day testing protocol
 * Format: [Day 1 (small), Day 2 (medium), Day 3 (large)]
 */
export const PORTION_PROGRESSION: Record<FODMAPGroup, [string, string, string]> = {
  fructose: ['1 tsp', '2 tsp', '1 tbsp'],
  lactose: ['1/4 cup', '1/2 cup', '1 cup'],
  fructans: ['1 slice', '2 slices', '3 slices'],
  galactans: ['1/4 cup', '1/2 cup', '3/4 cup'],
  polyols: ['1/4 cup', '1/2 cup', '1 cup'],
};

/**
 * Washout duration in days based on symptom severity
 * - None/Mild: 3 days minimum washout
 * - Moderate/Severe: 7 days extended washout
 */
export const WASHOUT_DURATION: Record<SymptomSeverity, number> = {
  none: 3,
  mild: 3,
  moderate: 7,
  severe: 7,
};
