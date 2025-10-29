/**
 * User State Utilities
 *
 * Utilities for deriving user state from various data sources.
 * User state is used by the ContentSurfacingEngine to personalize
 * educational content during washout periods.
 */

import { UserProfileRepository } from '../../../services/repositories/UserProfileRepository';
import { ProtocolRunRepository } from '../../../services/repositories/ProtocolRunRepository';
import { TestStepRepository } from '../../../services/repositories/TestStepRepository';
import type { AnxietyLevel } from '../../../content/education/types';

/**
 * Protocol phase types
 */
export type ProtocolPhase = 'elimination' | 'reintroduction' | 'personalization' | 'maintenance';

/**
 * Experience level based on completed tests
 */
export type ExperienceLevel = 'novice' | 'intermediate' | 'advanced';

/**
 * User state derived from multiple data sources
 */
export interface UserState {
  /** Experience level based on completed tests count */
  experienceLevel: ExperienceLevel;

  /** Anxiety level from user profile */
  anxietyLevel: AnxietyLevel;

  /** Current protocol phase */
  protocolPhase: ProtocolPhase;

  /** Number of completed tests */
  completedTestsCount: number;

  /** IDs of previously viewed educational content */
  previouslyViewedContentIds: string[];
}

/**
 * Derive user state from multiple data sources
 *
 * Combines data from user profile, protocol runs, and test steps
 * to create a comprehensive user state for content personalization.
 *
 * @param userId - The user ID to derive state for
 * @param userProfileRepository - Repository for user profile data
 * @param protocolRunRepository - Repository for protocol run data
 * @param testStepRepository - Repository for test step data
 * @param getViewedContentIds - Function to retrieve previously viewed content IDs
 * @returns Promise resolving to the derived user state
 * @throws {Error} If user profile or active protocol run not found
 */
export async function deriveUserState(
  userId: string,
  userProfileRepository: UserProfileRepository,
  protocolRunRepository: ProtocolRunRepository,
  testStepRepository: TestStepRepository,
  getViewedContentIds: (userId: string) => Promise<string[]>
): Promise<UserState> {
  // Fetch user profile
  const userProfile = await userProfileRepository.findById(userId);
  if (!userProfile) {
    throw new Error(`User profile not found for user ID: ${userId}`);
  }

  // Fetch active protocol run
  const activeProtocolRun = await protocolRunRepository.findActive(userId);
  if (!activeProtocolRun) {
    throw new Error(`No active protocol run found for user ID: ${userId}`);
  }

  // Fetch all test steps for the active protocol run
  const allTestSteps = await testStepRepository.findByProtocolRunId(activeProtocolRun.id);

  // Count completed tests
  const completedTests = allTestSteps.filter((step) => step.status === 'completed');
  const completedTestsCount = completedTests.length;

  // Derive experience level based on completed tests count
  const experienceLevel = deriveExperienceLevel(completedTestsCount);

  // Get anxiety level from user profile (default to 'medium' if not set)
  // Note: This assumes anxietyLevel will be added to UserProfile schema in the future
  // For now, we'll default to 'medium'
  const anxietyLevel: AnxietyLevel = 'medium';

  // Derive protocol phase based on protocol run status and test progress
  const protocolPhase = deriveProtocolPhase(activeProtocolRun.status, completedTestsCount);

  // Fetch previously viewed content IDs from telemetry
  const previouslyViewedContentIds = await getViewedContentIds(userId);

  return {
    experienceLevel,
    anxietyLevel,
    protocolPhase,
    completedTestsCount,
    previouslyViewedContentIds,
  };
}

/**
 * Derive experience level based on completed tests count
 *
 * Experience levels:
 * - novice: 0 completed tests
 * - intermediate: 1-4 completed tests
 * - advanced: 5+ completed tests
 *
 * @param completedTestsCount - Number of completed tests
 * @returns The derived experience level
 */
export function deriveExperienceLevel(completedTestsCount: number): ExperienceLevel {
  if (completedTestsCount === 0) {
    return 'novice';
  } else if (completedTestsCount < 5) {
    return 'intermediate';
  } else {
    return 'advanced';
  }
}

/**
 * Derive protocol phase based on protocol run status and progress
 *
 * Protocol phases:
 * - elimination: Initial phase before any tests (0 completed tests)
 * - reintroduction: Active testing phase (1+ completed tests, status 'active')
 * - personalization: Fine-tuning phase (status 'active' with significant progress)
 * - maintenance: Protocol completed (status 'completed')
 *
 * @param status - Current protocol run status
 * @param completedTestsCount - Number of completed tests
 * @returns The derived protocol phase
 */
export function deriveProtocolPhase(status: string, completedTestsCount: number): ProtocolPhase {
  if (status === 'completed') {
    return 'maintenance';
  }

  if (completedTestsCount === 0) {
    return 'elimination';
  }

  if (completedTestsCount >= 10) {
    return 'personalization';
  }

  return 'reintroduction';
}

/**
 * Get previously viewed content IDs from telemetry
 *
 * This function queries the TelemetryService to retrieve all content IDs
 * that the user has viewed. It's used by deriveUserState to personalize
 * content recommendations.
 *
 * Note: This function requires a TelemetryService instance to be passed in.
 * When calling deriveUserState, you should provide a function that wraps
 * the TelemetryService.getViewedContentIds method.
 *
 * @param userId - The user ID to fetch viewed content for
 * @returns Promise resolving to array of content IDs
 */
export async function getPreviouslyViewedContentIds(userId: string): Promise<string[]> {
  // This is a placeholder that returns an empty array
  // The actual implementation should be provided by the caller
  // via the getViewedContentIds parameter in deriveUserState
  return [];
}
