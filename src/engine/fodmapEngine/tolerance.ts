import { DoseRecord, ToleranceStatus } from './types';
import { analyzeSymptoms } from './symptoms';

/**
 * Classify food tolerance based on completed doses
 * @param doses - Array of completed dose records
 * @returns Tolerance status and relevant portion info
 */
export function classifyTolerance(doses: DoseRecord[]): {
  status: ToleranceStatus;
  maxToleratedPortion?: string;
  triggerPortion?: string;
} {
  // Return 'untested' for empty doses array
  if (doses.length === 0) {
    return { status: 'untested' };
  }

  // Analyze each dose to determine symptom severity
  const doseAnalysis = doses.map((dose) => ({
    dayNumber: dose.dayNumber,
    portion: dose.portionSize,
    severity: analyzeSymptoms(dose.symptoms),
  }));

  // Find first dose with moderate or severe symptoms
  const firstProblem = doseAnalysis.find(
    (d) => d.severity === 'moderate' || d.severity === 'severe'
  );

  // If no problems found, all doses tolerated
  if (!firstProblem) {
    // Return 'tolerated' with maxToleratedPortion (last dose portion)
    return {
      status: 'tolerated',
      maxToleratedPortion: doseAnalysis[doseAnalysis.length - 1].portion,
    };
  }

  // If severe symptoms found, return 'trigger' with triggerPortion
  if (firstProblem.severity === 'severe') {
    return {
      status: 'trigger',
      triggerPortion: firstProblem.portion,
    };
  }

  // Moderate symptoms - return 'sensitive' with both portions
  // Find the last tolerated dose (before the problem dose)
  const lastTolerated = doseAnalysis
    .slice(0, firstProblem.dayNumber - 1)
    .reverse()
    .find((d) => d.severity === 'none' || d.severity === 'mild');

  return {
    status: 'sensitive',
    maxToleratedPortion: lastTolerated?.portion,
    triggerPortion: firstProblem.portion,
  };
}
