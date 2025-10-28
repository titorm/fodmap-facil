import type { SymptomSeverity, WashoutPeriod } from './types';
import { WASHOUT_DURATION } from './config';

/**
 * Calculate washout period based on symptom severity
 * @param maxSeverity - Maximum symptom severity encountered during test
 * @param startDate - Washout start date
 * @returns WashoutPeriod object with start date, end date, duration, and reason
 */
export function calculateWashout(maxSeverity: SymptomSeverity, startDate: Date): WashoutPeriod {
  const durationDays = WASHOUT_DURATION[maxSeverity];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    durationDays,
    reason: `${maxSeverity} symptoms require ${durationDays}-day washout`,
  };
}

/**
 * Check if washout period is complete
 * @param washout - Washout period details
 * @param now - Current timestamp
 * @returns Object with complete boolean and daysRemaining number
 */
export function checkWashoutStatus(
  washout: WashoutPeriod,
  now: Date
): { complete: boolean; daysRemaining: number } {
  const endDate = new Date(washout.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    complete: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
  };
}
