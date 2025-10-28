import type { FODMAPGroup, ProtocolState } from './types';
import { STANDARD_GROUP_SEQUENCE, RECOMMENDED_FOODS, PORTION_PROGRESSION } from './config';

/**
 * Get the sequence of FODMAP groups to test
 * Returns custom sequence if provided, otherwise returns standard sequence
 * @param state - Protocol state containing optional custom sequence
 * @returns Ordered array of FODMAP groups to test
 */
export function getGroupSequence(state: ProtocolState): FODMAPGroup[] {
  return state.groupSequence || STANDARD_GROUP_SEQUENCE;
}

/**
 * Find the next untested FODMAP group in the sequence
 * @param state - Protocol state with completed tests
 * @returns Next group to test, or null if all groups completed
 */
export function getNextGroup(state: ProtocolState): FODMAPGroup | null {
  const sequence = getGroupSequence(state);
  const completedGroups = new Set(state.completedTests.map((test) => test.fodmapGroup));

  const nextGroup = sequence.find((group) => !completedGroups.has(group));
  return nextGroup || null;
}

/**
 * Get recommended foods for a specific FODMAP group
 * @param group - FODMAP group to get foods for
 * @returns Array of recommended food items for testing
 */
export function getRecommendedFoods(group: FODMAPGroup): string[] {
  return RECOMMENDED_FOODS[group];
}

/**
 * Get the recommended portion size for a specific day in the 3-day protocol
 * @param group - FODMAP group being tested
 * @param dayNumber - Day number (1, 2, or 3)
 * @returns Portion size string (e.g., "1 tsp", "1/2 cup")
 * @throws Error if dayNumber is not 1, 2, or 3
 */
export function getPortionForDay(group: FODMAPGroup, dayNumber: number): string {
  if (dayNumber < 1 || dayNumber > 3) {
    throw new Error(`Invalid day number: ${dayNumber}. Must be 1, 2, or 3.`);
  }
  return PORTION_PROGRESSION[group][dayNumber - 1];
}
