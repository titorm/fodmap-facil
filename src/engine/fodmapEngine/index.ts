import { ProtocolState, ProtocolStateSchema, NextAction } from './types';
import { validateProtocolState } from './validation';
import { handleWashoutPeriod, handleCurrentTest } from './handlers';
import { getNextGroup, getRecommendedFoods, getPortionForDay } from './sequence';

/**
 * Calculate the next action based on current protocol state
 * This is the main entry point for the FODMAP Engine
 *
 * @param state - Current protocol state with all history
 * @param now - Current timestamp (injected for determinism)
 * @returns Next action the user should take
 * @throws {z.ZodError} If state validation fails
 */
export function calculateNextAction(state: ProtocolState, now: Date): NextAction {
  // 1. Validate input using Zod schema
  const validatedState = ProtocolStateSchema.parse(state);

  // 2. Validate protocol state consistency
  const validation = validateProtocolState(validatedState);
  if (!validation.valid) {
    return {
      action: 'error',
      phase: validatedState.phase,
      message: 'Invalid protocol state detected',
      instructions: ['Please review and correct the following errors:', ...validation.errors],
      errors: validation.errors,
    };
  }

  // 3. Check if in washout period
  if (validatedState.currentWashout) {
    return handleWashoutPeriod(validatedState, now);
  }

  // 4. Check if current test is in progress
  if (validatedState.currentTest) {
    return handleCurrentTest(validatedState, now);
  }

  // 5. Determine next test to start
  return determineNextTest(validatedState);
}

/**
 * Determine next test to start
 * Finds next untested group or completes protocol if all groups tested
 * @param state - Current protocol state
 * @returns NextAction for starting next group or completing protocol
 */
function determineNextTest(state: ProtocolState): NextAction {
  const nextGroup = getNextGroup(state);

  // If no next group, protocol is complete
  if (!nextGroup) {
    const summary = generateSummary(state);

    return {
      action: 'protocol_complete',
      phase: 'completed',
      message: 'Congratulations! FODMAP reintroduction protocol complete.',
      instructions: [
        'All FODMAP groups tested',
        'Review your tolerance results',
        'Consult with dietitian for personalized diet plan',
      ],
      summary,
    };
  }

  // Get first recommended food for the next group
  const foods = getRecommendedFoods(nextGroup);
  const firstFood = foods[0];
  const portion = getPortionForDay(nextGroup, 1);

  return {
    action: 'start_next_group',
    phase: 'testing',
    currentGroup: nextGroup,
    currentFood: firstFood,
    currentDayNumber: 1,
    recommendedPortion: portion,
    message: `Starting new FODMAP group: ${nextGroup}`,
    instructions: [
      `Testing ${nextGroup} group`,
      `First food: ${firstFood}`,
      `Day 1: Consume ${portion}`,
      'Monitor symptoms for 24 hours',
    ],
  };
}

/**
 * Generate protocol summary from completed tests
 * Categorizes foods by tolerance status and counts completed groups
 * @param state - Current protocol state with completed tests
 * @returns Summary object with categorized foods and completion stats
 */
function generateSummary(state: ProtocolState): NextAction['summary'] {
  const tolerated: string[] = [];
  const sensitive: string[] = [];
  const trigger: string[] = [];

  state.completedTests.forEach((test) => {
    switch (test.toleranceStatus) {
      case 'tolerated':
        tolerated.push(test.foodItem);
        break;
      case 'sensitive':
        sensitive.push(test.foodItem);
        break;
      case 'trigger':
        trigger.push(test.foodItem);
        break;
    }
  });

  const groupsCompleted = [...new Set(state.completedTests.map((test) => test.fodmapGroup))];

  return {
    totalTestsCompleted: state.completedTests.length,
    groupsCompleted,
    toleratedFoods: tolerated,
    sensitiveFoods: sensitive,
    triggerFoods: trigger,
  };
}

// Export all public functions and types
// Note: Internal handler functions (handleWashoutPeriod, handleCurrentTest, determineNextTest, generateSummary)
// are intentionally NOT exported as they are implementation details

// Export all Zod schemas and TypeScript types
export * from './types';

// Export configuration constants
export * from './config';

// Export utility functions
export * from './symptoms';
export * from './tolerance';
export * from './washout';
export * from './sequence';
export { validateProtocolState } from './validation';
