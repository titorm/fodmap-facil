import { SymptomRecord, SymptomSeverity } from './types';

/**
 * Analyze symptoms for a dose and determine overall severity
 * @param symptoms - Array of symptom records
 * @returns Overall symptom severity
 */
export function analyzeSymptoms(symptoms: SymptomRecord[]): SymptomSeverity {
  if (symptoms.length === 0) {
    return 'none';
  }

  const severities = symptoms.map((s) => s.severity);

  // Severity priority: severe > moderate > mild > none
  if (severities.includes('severe')) {
    return 'severe';
  }

  if (severities.includes('moderate')) {
    return 'moderate';
  }

  if (severities.includes('mild')) {
    return 'mild';
  }

  return 'none';
}

/**
 * Determine if symptoms warrant stopping current test
 * @param severity - Overall symptom severity
 * @param dayNumber - Current day number (1-3)
 * @returns Whether to stop test immediately
 */
export function shouldStopTest(severity: SymptomSeverity, dayNumber: number): boolean {
  // Severe symptoms always stop test
  if (severity === 'severe') {
    return true;
  }

  // Moderate symptoms on day 1 stop test
  if (severity === 'moderate' && dayNumber === 1) {
    return true;
  }

  return false;
}
