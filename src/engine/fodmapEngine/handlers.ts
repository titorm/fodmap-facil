import type { ProtocolState, NextAction } from './types';
import { checkWashoutStatus, calculateWashout } from './washout';
import { analyzeSymptoms, shouldStopTest } from './symptoms';
import { getPortionForDay, getNextGroup, getRecommendedFoods } from './sequence';

/**
 * Handle washout period state
 * Checks if washout is complete and returns appropriate next action
 * @param state - Current protocol state with active washout
 * @param now - Current timestamp (injected for determinism)
 * @returns NextAction indicating whether to continue washout or proceed to next test
 */
export function handleWashoutPeriod(state: ProtocolState, now: Date): NextAction {
  const washout = state.currentWashout!;
  const status = checkWashoutStatus(washout, now);

  if (!status.complete) {
    return {
      action: 'continue_washout',
      phase: 'washout',
      message: 'Continue low-FODMAP diet during washout period',
      instructions: [
        `Washout period: ${status.daysRemaining} days remaining`,
        'Avoid all high-FODMAP foods',
        'Monitor symptoms daily',
        'Symptoms should resolve during this period',
      ],
      washoutDaysRemaining: status.daysRemaining,
      nextMilestone: {
        date: washout.endDate,
        description: 'Washout period ends, ready for next test',
      },
    };
  }

  // Washout complete, determine next test
  return determineNextTest(state);
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
 * Handle current test in progress
 * Determines whether to continue testing, stop due to symptoms, or complete the test
 * @param state - Current protocol state with active test
 * @param now - Current timestamp (injected for determinism)
 * @returns NextAction indicating next dose or washout period
 */
export function handleCurrentTest(state: ProtocolState, now: Date): NextAction {
  const test = state.currentTest!;
  const completedDoses = test.doses.length;

  // Check if last dose had symptoms requiring test stop
  if (completedDoses > 0) {
    const lastDose = test.doses[completedDoses - 1];
    const severity = analyzeSymptoms(lastDose.symptoms);

    if (shouldStopTest(severity, lastDose.dayNumber)) {
      // Stop test immediately and start washout
      const washout = calculateWashout(severity, now);

      return {
        action: 'continue_washout',
        phase: 'washout',
        currentGroup: test.fodmapGroup,
        currentFood: test.foodItem,
        message: `Test stopped due to ${severity} symptoms. Starting washout period.`,
        instructions: [
          'Stop testing this food immediately',
          'Return to low-FODMAP diet',
          `Washout period: ${washout.durationDays} days`,
          'Symptoms should resolve during washout',
        ],
        washoutDaysRemaining: washout.durationDays,
        nextMilestone: {
          date: washout.endDate,
          description: 'Washout complete, ready for next food',
        },
      };
    }
  }

  // Determine next day number
  const nextDayNumber = completedDoses + 1;

  // Check if test is complete (all 3 days done)
  if (nextDayNumber > 3) {
    // Test complete, calculate washout based on maximum severity
    const maxSeverityIndex = Math.max(
      ...test.doses.map((d) => {
        const sev = analyzeSymptoms(d.symptoms);
        return ['none', 'mild', 'moderate', 'severe'].indexOf(sev);
      })
    );
    const maxSeverity = ['none', 'mild', 'moderate', 'severe'][maxSeverityIndex] as any;
    const washout = calculateWashout(maxSeverity, now);

    return {
      action: 'continue_washout',
      phase: 'washout',
      currentGroup: test.fodmapGroup,
      currentFood: test.foodItem,
      message: `Test complete for ${test.foodItem}. Starting washout period.`,
      instructions: [
        'All 3 doses completed',
        'Return to low-FODMAP diet',
        `Washout period: ${washout.durationDays} days`,
      ],
      washoutDaysRemaining: washout.durationDays,
      nextMilestone: {
        date: washout.endDate,
        description: 'Washout complete, ready for next food',
      },
    };
  }

  // Continue with next dose
  const portion = getPortionForDay(test.fodmapGroup, nextDayNumber);

  return {
    action: 'start_dose',
    phase: 'testing',
    currentGroup: test.fodmapGroup,
    currentFood: test.foodItem,
    currentDayNumber: nextDayNumber,
    recommendedPortion: portion,
    message: `Day ${nextDayNumber} of testing ${test.foodItem}`,
    instructions: [
      `Consume ${portion} of ${test.foodItem}`,
      'Monitor symptoms for 24 hours',
      'Record any symptoms immediately',
      'Continue low-FODMAP diet otherwise',
    ],
  };
}
