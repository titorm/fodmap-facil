import { ProtocolState } from './types';

/**
 * Validates the protocol state for consistency and correctness
 * @param state - The protocol state to validate
 * @returns Object with valid boolean and array of error messages
 */
export function validateProtocolState(state: ProtocolState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for conflicting currentTest and currentWashout
  if (state.currentTest && state.currentWashout) {
    errors.push('Cannot have both active test and washout period');
  }

  // Validate dose day numbers are sequential in currentTest
  if (state.currentTest && state.currentTest.doses.length > 0) {
    const dayNumbers = state.currentTest.doses.map((d) => d.dayNumber);

    // Check if day numbers are sequential starting from 1
    for (let i = 0; i < dayNumbers.length; i++) {
      if (dayNumbers[i] !== i + 1) {
        errors.push('Dose day numbers must be sequential starting from 1');
        break;
      }
    }
  }

  // Validate dose day numbers are sequential in completedTests
  for (const test of state.completedTests) {
    if (test.doses.length > 0) {
      const dayNumbers = test.doses.map((d) => d.dayNumber);

      // Check if day numbers are sequential starting from 1
      for (let i = 0; i < dayNumbers.length; i++) {
        if (dayNumbers[i] !== i + 1) {
          errors.push(
            `Dose day numbers must be sequential starting from 1 in completed test for ${test.foodItem}`
          );
          break;
        }
      }
    }
  }

  // Validate washout dates (end after start)
  if (state.currentWashout) {
    const start = new Date(state.currentWashout.startDate);
    const end = new Date(state.currentWashout.endDate);

    if (end <= start) {
      errors.push('Washout end date must be after start date');
    }
  }

  // Validate phase consistency with current state
  // Note: phase can be 'testing' without currentTest when between tests
  if (state.phase === 'washout' && !state.currentWashout) {
    errors.push('Phase is "washout" but no current washout period exists');
  }

  if (state.phase === 'completed' && (state.currentTest || state.currentWashout)) {
    errors.push('Phase is "completed" but current test or washout still exists');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
