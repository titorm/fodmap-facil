import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tantml:parameter>
import { queryKeys } from '../../../lib/queryClient';
import { tablesDB, DATABASE_ID, TABLES, ID } from '../../../infrastructure/api/appwrite';
import type { TestStep, SymptomEntry, FoodItem } from '../../../shared/types/entities';
import type { SymptomRecord } from '../../../engine/fodmapEngine/types';
import { notificationService } from '../../../services/notifications/NotificationService';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.TEST_STEPS,
          rowId: testStepId,
        });

        return {
          ...row,
          scheduledDate: new Date(row.scheduledDate),
          completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
          lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
        } as unknown as TestStep;
      } catch {
        return null;
      }
    },
    enabled: !!testStepId,
  });

  // Fetch food item
  const { data: foodItem, isLoading: isLoadingFoodItem } = useQuery({
    queryKey: ['foodItems', testStep?.foodItemId],
    queryFn: async () => {
      if (!testStep?.foodItemId) return null;

      try {
        const row = await tablesDB.getRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.FOOD_ITEMS,
          rowId: testStep.foodItemId,
        });

        return {
          ...row,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        } as unknown as FoodItem;
      } catch {
        return null;
      }
    },
    enabled: !!testStep?.foodItemId,
  });

  // Fetch symptoms for this test step
  const { data: symptoms = [], isLoading: isLoadingSymptoms } = useQuery({
    queryKey: queryKeys.symptomEntries.byTestStepId(testStepId),
    queryFn: async () => {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [
          // Query.equal('testStepId', [testStepId]),
          // Query.orderDesc('timestamp'),
        ],
      });

      return rows.map((row) => ({
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as unknown as SymptomEntry[];
    },
    enabled: !!testStepId,
  });

  // Calculate current day and dose information
  useEffect(() => {
    if (!testStep || !foodItem) return;

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
    } catch {
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

  // ============================================================================
  // NOTIFICATION INTEGRATION (Task 11.2)
  // Schedule dose reminders when test step is created
  // Requirements: 2.2
  // ============================================================================
  useEffect(() => {
    if (!testStep || !foodItem) return;

    // Only schedule if test is pending or in progress and has a scheduled date
    if (
      (testStep.status === 'pending' || testStep.status === 'in_progress') &&
      testStep.scheduledDate
    ) {
      // Schedule dose reminders for the test step
      notificationService
        .scheduleDoseReminder({
          id: testStep.id,
          scheduledDate: testStep.scheduledDate,
          foodItemId: foodItem.id,
          foodName: foodItem.name,
          doseAmount: getPortionSizeForDay(foodItem.fodmapGroup, 1),
        })
        .catch((error) => {
          // Don't throw - notification scheduling is non-critical
          console.error('Error scheduling dose reminders:', error);
        });
    }
  }, [testStep?.id, testStep?.status, testStep?.scheduledDate, foodItem?.id, foodItem?.name]);

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

      const status = currentDay === 1 ? 'in_progress' : testStep.status;

      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        rowId: testStep.id,
        data: {
          status,
          notes,
          updatedAt: new Date().toISOString(),
        },
      });

      return {
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as unknown as TestStep;
    },
    onSuccess: async (updatedTestStep) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.byId(testStepId) });

      // ============================================================================
      // NOTIFICATION INTEGRATION (Task 11.2)
      // ============================================================================

      try {
        // Cancel dose reminders when dose is marked as taken
        // Requirements: 2.3
        await notificationService.cancelDoseReminders(updatedTestStep.id);

        // Track dose timing for adherence analysis
        // Requirements: 6.2
        const userId = await AsyncStorage.getItem('@auth:userId');
        if (userId) {
          await notificationService.adjustNotificationFrequency(userId);
        }
      } catch (error) {
        // Don't throw - notification integration is non-critical
        console.error('Error integrating with notification service:', error);
      }
    },
  });

  // Mutation: Complete day with symptoms
  const completeDayMutation = useMutation({
    mutationFn: async (symptoms: SymptomRecord[]) => {
      if (!testStep) throw new Error('Test step not found');

      // Save symptoms to database
      for (const symptom of symptoms) {
        const now = new Date();
        await tablesDB.createRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.SYMPTOM_ENTRIES,
          rowId: ID.unique(),
          data: {
            testStepId: testStep.id,
            symptomType: symptom.type,
            severity: mapSeverityToNumber(symptom.severity),
            timestamp: new Date(symptom.timestamp).toISOString(),
            notes: symptom.notes,
            createdAt: now.toISOString(),
            syncStatus: 'synced',
          },
        });
      }

      // If this is day 3, mark test as completed
      if (currentDay === 3) {
        const row = await tablesDB.updateRow({
          databaseId: DATABASE_ID,
          tableId: TABLES.TEST_STEPS,
          rowId: testStep.id,
          data: {
            status: 'completed',
            completedDate: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });

        return {
          ...row,
          scheduledDate: new Date(row.scheduledDate),
          completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
          createdAt: new Date(row.createdAt),
          updatedAt: new Date(row.updatedAt),
        } as unknown as TestStep;
      }

      return testStep;
    },
    onSuccess: async (updatedTestStep) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.testSteps.byId(testStepId) });
      queryClient.invalidateQueries({
        queryKey: queryKeys.symptomEntries.byTestStepId(testStepId),
      });

      // ============================================================================
      // NOTIFICATION INTEGRATION (Task 11.2)
      // ============================================================================

      try {
        // If test is completed (day 3), schedule washout notifications
        // Requirements: 3.1
        if (updatedTestStep.status === 'completed' && testStep) {
          // Calculate washout period (typically 3-7 days after test completion)
          const washoutStartDate = new Date(updatedTestStep.completedDate || new Date());
          washoutStartDate.setDate(washoutStartDate.getDate() + 1); // Start next day

          const washoutEndDate = new Date(washoutStartDate);
          washoutEndDate.setDate(washoutEndDate.getDate() + 3); // 3-day washout

          // Schedule washout notifications
          await notificationService.scheduleWashoutNotifications({
            id: `washout_${updatedTestStep.id}`,
            startDate: washoutStartDate,
            endDate: washoutEndDate,
            protocolRunId: testStep.protocolRunId || 'default',
          });
        }
      } catch (error) {
        // Don't throw - notification integration is non-critical
        console.error('Error scheduling washout notifications:', error);
      }
    },
  });

  // Mutation: Cancel test
  const cancelTestMutation = useMutation({
    mutationFn: async () => {
      if (!testStep) throw new Error('Test step not found');

      const row = await tablesDB.updateRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        rowId: testStep.id,
        data: {
          status: 'skipped',
          updatedAt: new Date().toISOString(),
        },
      });

      return {
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      } as unknown as TestStep;
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

function mapSeverityToNumber(severity: string): number {
  const severityMap: Record<string, number> = {
    none: 0,
    mild: 3,
    moderate: 6,
    severe: 9,
  };

  return severityMap[severity] || 5;
}
