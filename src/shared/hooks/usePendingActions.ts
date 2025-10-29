/**
 * usePendingActions Hook
 *
 * Tracks pending actions for graceful degradation when notifications are disabled
 * Requirements: 7.3
 */

import { useState, useEffect } from 'react';
import { useSymptomEntries } from './useSymptomEntries';
import { useTestSteps } from './useTestSteps';
import { useProtocolRuns } from './useProtocolRuns';

export interface PendingActions {
  pendingSymptomLogs: number;
  pendingDoses: number;
  pendingTests: number;
  totalPending: number;
}

/**
 * Hook to track pending actions for the user
 * Requirements: 7.3
 */
export function usePendingActions(): PendingActions {
  const [pendingActions, setPendingActions] = useState<PendingActions>({
    pendingSymptomLogs: 0,
    pendingDoses: 0,
    pendingTests: 0,
    totalPending: 0,
  });

  const { data: symptomEntries } = useSymptomEntries();
  const { data: testSteps } = useTestSteps();
  const { data: protocolRuns } = useProtocolRuns();

  useEffect(() => {
    calculatePendingActions();
  }, [symptomEntries, testSteps, protocolRuns]);

  const calculatePendingActions = () => {
    // Calculate pending symptom logs (days without logs in last 7 days)
    const pendingSymptomLogs = calculatePendingSymptomLogs();

    // Calculate pending doses (scheduled doses not yet taken)
    const pendingDoses = calculatePendingDoses();

    // Calculate pending tests (tests ready to start but not started)
    const pendingTests = calculatePendingTests();

    const totalPending = pendingSymptomLogs + pendingDoses + pendingTests;

    setPendingActions({
      pendingSymptomLogs,
      pendingDoses,
      pendingTests,
      totalPending,
    });
  };

  const calculatePendingSymptomLogs = (): number => {
    if (!symptomEntries) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Get unique dates with symptom entries
    const datesWithLogs = new Set(
      symptomEntries
        .filter((entry) => {
          const entryDate = new Date(entry.createdAt);
          entryDate.setHours(0, 0, 0, 0);
          return entryDate >= sevenDaysAgo && entryDate <= today;
        })
        .map((entry) => {
          const date = new Date(entry.createdAt);
          date.setHours(0, 0, 0, 0);
          return date.getTime();
        })
    );

    // Calculate days without logs
    const totalDays = 7;
    const daysWithLogs = datesWithLogs.size;
    return totalDays - daysWithLogs;
  };

  const calculatePendingDoses = (): number => {
    if (!testSteps) return 0;

    const now = new Date();

    // Count test steps that are scheduled but not completed
    return testSteps.filter((step) => {
      const scheduledDate = new Date(step.scheduledDate);
      return scheduledDate <= now && step.status !== 'completed';
    }).length;
  };

  const calculatePendingTests = (): number => {
    if (!protocolRuns || !testSteps) return 0;

    // Find active protocol runs
    const activeRuns = protocolRuns.filter((run) => run.status === 'active');

    if (activeRuns.length === 0) return 0;

    // Count tests that are ready to start but not started
    const now = new Date();
    return testSteps.filter((step) => {
      const availableDate = step.availableDate ? new Date(step.availableDate) : new Date();
      return (
        activeRuns.some((run) => run.id === step.protocolRunId) &&
        availableDate <= now &&
        step.status === 'pending'
      );
    }).length;
  };

  return pendingActions;
}
