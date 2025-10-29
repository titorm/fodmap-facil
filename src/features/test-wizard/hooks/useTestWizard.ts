import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../../../lib/queryClient';
import {
  TestStepRepository,
  SymptomEntryRepository,
  FoodItemRepository,
} from '../../../services/repositories';
import { db } from '../../../infrastructure/database/client';
import { SyncQueue } from '../../../services/SyncQueue';
import type { TestStep, SymptomEntry, FoodItem } from '../../../db/schema';
import type { SymptomRecord } from '../../../engine/fodmapEngine/types';

// Create repository instances
const testStepRepository = new TestStepRepository(db);
const symptomEntryRepository = new SymptomEntryRepository(db);
const foodItemRepository = new FoodItemRepository(db);

export interface UseTestWizardReturn {
  // Current test state
  testStep: TestStep | null;
  foodItem: FoodItem | null;
  currentDay: number;
  portionSize: string;
  canProgress: boolean;
  isLoading: boolean;
  error: Error | null;

  // Dose tracking
  doses: DoseInfo[];

  // Actions
  confirmConsumption: () => Promise<void>;
  completeDay: (symptoms: SymptomRecord[]) => Promise<void>;
  cancelTest: () => Promise<void>;
}

export interface DoseInfo {
  dayNumber: number;
  consumed: boolean;
  consumedAt?: Date;
  portionSize: string;
  symptoms: SymptomEntry[];
}

/**
 * Hook to manage test wizard flow and state
 *
 * Handles:
 * - Loading current test state from database
 * - Validating day progression (24-hour wait between days)
 * - Confirming consumption
 * - Completing days with symptom integration
 * - Canceling tests
 *
 * @param testStepId - The ID of the test step to manage
 * @returns Test wizard state and actions
 */
export function useTestWizard(testStepId: string): UseTestWizardReturn {
  const queryClient = useQueryClient();
  const [doses, setDoses] = useState<DoseInfo[]>([]);

  // Fetch test step
  const {
    data: testStep,
    isLoading: isLoadingTestStep,
    error: testStepError,
  } = useQuery({
    queryKey: queryKeys.testSteps.byId(testStepId),
    queryFn: async () => {
      return await testStepRepository.findById(testStepId);
    },
    enabled: !!testStepId,
  });

  // Fetch food item
  const { data: foodItem, isLoading: isLoadingFoodItem } = useQuery({
    queryKey: ['foodItems', testStep?.foodItemId],
    queryFn: async () => {
      if (!testStep?.foodItemId) return null;
      return await foodItemRepository.findById(testStep.foodItemId);
    },
    enabled: !!testStep?.foodItemId,
  });

  // Fetch symptoms for this test step
  const { data: symptoms = [], isLoading: isLoadingSymptoms } = useQuery({
    queryKey: queryKeys.symptomEntries.byTestStepId(testStepId),
    queryFn: async () => {
      return await symptomEntryRepository.findByTestStepId(testStepId);
    },
    enabled: !!testStepId,
  });

  // Calculate current day and dose information
  useEffect(() => {
    if (!testStep || !foodItem) return;

    // Parse notes to extract dose information
    // Format: JSON array of dose records
    const doseInfo: DoseInfo[] = [];

    try {
      const parsedNotes = testStep.notes ? JSON.parse(testStep.notes) : { doses: [] };
      const dosesData = parsedNotes.doses || [];

      for (let day = 1; day <= 3; day++) {
        const doseRecord = dosesData.find((d: any) => d.dayNumber === day);
        const daySymptoms = symptoms.filter((s) => {
          if (!doseRecord?.consumedAt) return false;
          const consumedTime = new Date(doseRecord.consumedAt).getTime();
          const symptomTime = new Date(s.timestamp).getTime();
          const nextDayTime = consumedTime + 24 * 60 * 60 * 1000;
          return symptomTime >= consumedTime && symptomTime < nextDayTime;
        });

        doseInfo.push({
          dayNumber: day,
          consumed: !!doseRecord?.consumed,
          consumedAt: doseRecord?.consumedAt ? new Date(doseRecord.consumedAt) : undefined,
          portionSize: getPortionSizeForDay(foodItem.fodmapGroup, day),
          symptoms: daySymptoms,
        });
      }
    } catch (error) {
      // If notes parsing fails, initialize with default structure
      for (let day = 1; day <= 3; day++) {
        doseInfo.push({
          dayNumber: day,
          consumed: false,
          portionSize: getPortionSizeForDay(foodItem.fodmapGroup, day),
          symptoms: [],
        });
      }
    }

    setDoses(doseInfo);
  }, [testStep, foodItem, symptoms]);

  // Calculate current day
  const currentDay = useMemo(() => {
    const lastConsumedDay = doses.findIndex((d) => !d.consumed);
    return lastConsumedDay === -1 ? 3 : lastConsumedDay + 1;
  }, [doses]);

  // Check if can progress to next day (24-hour wait)
  const canProgress = useMemo(() => {
    if (currentDay === 1) return true;

    const previousDose = doses[currentDay - 2];
    if (!previousDose?.consumed || !previousDose.consumedAt) return false;

    const hoursSinceConsumption =
      (Date.now() - previousDose.consumedAt.getTime()) / (1000 * 60 * 60);
    return hoursSinceConsumption >= 24;
  }, [currentDay, doses]);

  // Get current portion size
  const portionSize = useMemo(() => {
    if (!foodItem) return '';
    return getPortionSizeForDay(foodItem.fodmapGroup, currentDay);
  }, [foodItem, currentDay]);

  // Mutation: Confirm consumption
  const confirmConsumptionMutation = useMutation({
    mutationFn: async () => {
      if (!testStep) throw new Error('Test step not found');

      // Update doses in notes
      const updatedDoses = doses.map((d) =>
        d.dayNumber === currentDay ? { ...d, consumed: true, consumedAt: new Date() } : d
      );

      const notes = JSON.stringify({
        doses: updatedDoses.map((d) => ({
          dayNumber: d.dayNumber,
          consumed: d.consumed,
          consumedAt: d.consumedAt?.toISOString(),
          portionSize: d.portionSize,
        })),
      });

      // Update test step status if starting first day
      const status = currentDay === 1 ? 'in_progress' : testStep.status;

      const updatedTestStep = await testStepRepository.update(testStep.id, {
        status,
        notes,
        updatedAt: new Date(),
      });

      // Queue for sync
      await SyncQueue.enqueue({
        type: 'test_step',
        entityId: testStep.id,
        operation: 'update',
        data: updatedTestStep,
      });

      return updatedTestStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.byId(testStepId) });
    },
  });

  // Mutation: Complete day with symptoms
  const completeDayMutation = useMutation({
    mutationFn: async (symptoms: SymptomRecord[]) => {
      if (!testStep) throw new Error('Test step not found');

      // Save symptoms to database
      for (const symptom of symptoms) {
        await symptomEntryRepository.create({
          testStepId: testStep.id,
          symptomType: symptom.type as any,
          severity: mapSeverityToNumber(symptom.severity),
          timestamp: new Date(symptom.timestamp),
          notes: symptom.notes,
        });
      }

      // If this is day 3, mark test as completed
      if (currentDay === 3) {
        const updatedTestStep = await testStepRepository.update(testStep.id, {
          status: 'completed',
          completedDate: new Date(),
          updatedAt: new Date(),
        });

        // Queue for sync
        await SyncQueue.enqueue({
          type: 'test_step',
          entityId: testStep.id,
          operation: 'update',
          data: updatedTestStep,
        });

        return updatedTestStep;
      }

      return testStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.byId(testStepId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.byTestStepId(testStepId),
      });
    },
  });

  // Mutation: Cancel test
  const cancelTestMutation = useMutation({
    mutationFn: async () => {
      if (!testStep) throw new Error('Test step not found');

      const updatedTestStep = await testStepRepository.update(testStep.id, {
        status: 'skipped',
        updatedAt: new Date(),
      });

      // Queue for sync
      await SyncQueue.enqueue({
        type: 'test_step',
        entityId: testStep.id,
        operation: 'update',
        data: updatedTestStep,
      });

      return updatedTestStep;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.byId(testStepId) });
    },
  });

  return {
    testStep: testStep || null,
    foodItem: foodItem || null,
    currentDay,
    portionSize,
    canProgress,
    isLoading: isLoadingTestStep || isLoadingFoodItem || isLoadingSymptoms,
    error: testStepError as Error | null,
    doses,
    confirmConsumption: async () => {
      await confirmConsumptionMutation.mutateAsync();
    },
    completeDay: async (symptoms: SymptomRecord[]) => {
      await completeDayMutation.mutateAsync(symptoms);
    },
    cancelTest: async () => {
      await cancelTestMutation.mutateAsync();
    },
  };
}

/**
 * Get portion size for a specific day based on FODMAP group
 * Day 1: Small portion
 * Day 2: Medium portion
 * Day 3: Large portion
 */
function getPortionSizeForDay(fodmapGroup: string, day: number): string {
  const portionSizes: Record<string, string[]> = {
    oligosaccharides: ['1/4 cup', '1/2 cup', '1 cup'],
    disaccharides: ['1/4 cup', '1/2 cup', '1 cup'],
    monosaccharides: ['1 tbsp', '2 tbsp', '3 tbsp'],
    polyols: ['2 pieces', '4 pieces', '6 pieces'],
  };

  const sizes = portionSizes[fodmapGroup] || ['small', 'medium', 'large'];
  return sizes[day - 1] || sizes[0];
}

/**
 * Map symptom severity string to number (1-10 scale)
 */
function mapSeverityToNumber(severity: string): number {
  const severityMap: Record<string, number> = {
    none: 0,
    mild: 3,
    moderate: 6,
    severe: 9,
  };

  return severityMap[severity] || 5;
}
