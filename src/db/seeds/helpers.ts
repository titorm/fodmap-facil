import { db } from '../../infrastructure/database/client';
import { foodItems, userProfiles } from '../schema';
import { count } from 'drizzle-orm';

/**
 * Check if the database is empty (no food items or users)
 * Useful for conditional seeding
 */
export async function isDatabaseEmpty(): Promise<boolean> {
  try {
    const [foodItemCount] = await db.select({ count: count() }).from(foodItems);
    const [userCount] = await db.select({ count: count() }).from(userProfiles);

    return foodItemCount.count === 0 && userCount.count === 0;
  } catch (error) {
    console.error('Failed to check if database is empty:', error);
    return false;
  }
}

/**
 * Check if seed data exists (looks for specific seed IDs)
 * More reliable than checking if database is empty
 */
export async function hasSeedData(): Promise<boolean> {
  try {
    const [foodItemCount] = await db
      .select({ count: count() })
      .from(foodItems)
      .where((table) => table.id.like('food-%'));

    return foodItemCount.count > 0;
  } catch (error) {
    console.error('Failed to check for seed data:', error);
    return false;
  }
}

/**
 * Get database statistics
 * Useful for debugging and development
 */
export async function getDatabaseStats(): Promise<{
  foodItems: number;
  userProfiles: number;
  protocolRuns: number;
  testSteps: number;
  symptomEntries: number;
}> {
  try {
    const [foodItemsCount] = await db.select({ count: count() }).from(foodItems);
    const [userProfilesCount] = await db.select({ count: count() }).from(userProfiles);

    // Import other tables as needed
    const { protocolRuns, testSteps, symptomEntries } = await import('../schema');

    const [protocolRunsCount] = await db.select({ count: count() }).from(protocolRuns);
    const [testStepsCount] = await db.select({ count: count() }).from(testSteps);
    const [symptomEntriesCount] = await db.select({ count: count() }).from(symptomEntries);

    return {
      foodItems: foodItemsCount.count,
      userProfiles: userProfilesCount.count,
      protocolRuns: protocolRunsCount.count,
      testSteps: testStepsCount.count,
      symptomEntries: symptomEntriesCount.count,
    };
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return {
      foodItems: 0,
      userProfiles: 0,
      protocolRuns: 0,
      testSteps: 0,
      symptomEntries: 0,
    };
  }
}
