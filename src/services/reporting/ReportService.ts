/**
 * ReportService - Aggregates data from multiple sources for report generation
 */

import { tablesDB, DATABASE_ID, TABLES, Query } from '../../infrastructure/api/appwrite';
import { createReportError, categorizeError, ReportErrorType, type ReportError } from './errors';
import type {
  ToleranceProfile,
  TestHistoryItem,
  SymptomTimelineData,
  ReportMetrics,
  FullReportData,
  HistoryOptions,
  DateRange,
  GroupTolerance,
  TimelineEntry,
  TestMarker,
} from '../../features/reports/types';
import type {
  ProtocolRun,
  TestStep,
  SymptomEntry,
  FoodItem,
  GroupResult,
  UserProfile,
  WashoutPeriod,
  FodmapGroup,
  ToleranceLevel,
} from '../../shared/types/entities';

export class ReportService {
  /**
   * Get tolerance profile for a user's active protocol
   */
  async getToleranceProfile(userId: string): Promise<ToleranceProfile> {
    try {
      // Get active protocol run
      const protocolRun = await this.getActiveProtocolRun(userId);
      if (!protocolRun) {
        console.log('No active protocol found, returning empty profile');
        return this.createEmptyToleranceProfile();
      }

      // Get group results for this protocol
      const { rows: groupResultRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.GROUP_RESULTS,
        queries: [Query.equal('protocolRunId', [protocolRun.id])],
      });

      const groupResults = groupResultRows as unknown as GroupResult[];

      // Get all test steps for this protocol to find tested foods
      const { rows: testStepRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        queries: [
          Query.equal('protocolRunId', [protocolRun.id]),
          Query.equal('status', ['completed']),
        ],
      });

      const testSteps = testStepRows.map((row) => ({
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as TestStep[];

      // Get food items for tested foods
      const foodItemIds = [...new Set(testSteps.map((ts) => ts.foodItemId))];
      const foodItems = await this.getFoodItemsByIds(foodItemIds);

      // Build tolerance profile
      const groups = this.buildGroupToleranceData(groupResults, testSteps, foodItems);
      const summary = this.calculateToleranceSummary(groups);

      return { groups, summary };
    } catch (error) {
      console.error('Error fetching tolerance profile:', error);
      const errorType = categorizeError(error);
      const reportError = createReportError(
        errorType,
        'Failed to fetch tolerance profile',
        error instanceof Error ? error : undefined
      );
      throw reportError;
    }
  }

  /**
   * Get complete test history for a user
   */
  async getTestHistory(userId: string, options?: HistoryOptions): Promise<TestHistoryItem[]> {
    try {
      // Get all protocol runs for user
      const { rows: protocolRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        queries: [Query.equal('userId', [userId])],
      });

      const protocolRunIds = protocolRows.map((row) => row.id);
      if (protocolRunIds.length === 0) {
        console.log('No protocol runs found for user, returning empty history');
        return [];
      }

      // Get all test steps for these protocols
      const queries = [
        Query.equal('protocolRunId', protocolRunIds),
        Query.orderDesc('scheduledDate'),
      ];

      if (options?.status) {
        queries.push(Query.equal('status', [options.status]));
      }

      if (options?.limit) {
        queries.push(Query.limit(options.limit));
      }

      const { rows: testStepRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        queries,
      });

      const testSteps = testStepRows.map((row) => ({
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as TestStep[];

      // Get food items
      const foodItemIds = [...new Set(testSteps.map((ts) => ts.foodItemId))];
      const foodItems = await this.getFoodItemsByIds(foodItemIds);

      // Get symptom entries for each test step
      const testStepIds = testSteps.map((ts) => ts.id);
      const symptomEntries = await this.getSymptomEntriesByTestStepIds(testStepIds);

      // Get group results to determine tolerance outcomes
      const groupResults = await this.getGroupResultsByProtocolRunIds(protocolRunIds);

      // Build test history items
      return testSteps.map((testStep) => {
        const foodItem = foodItems.find((fi) => fi.id === testStep.foodItemId);
        const symptoms = symptomEntries.filter((se) => se.testStepId === testStep.id);
        const groupResult = groupResults.find(
          (gr) =>
            gr.protocolRunId === testStep.protocolRunId && gr.fodmapGroup === foodItem?.fodmapGroup
        );

        return {
          id: testStep.id,
          foodName: foodItem?.name || 'Unknown',
          fodmapGroup: foodItem?.fodmapGroup || 'oligosaccharides',
          testDate: testStep.scheduledDate,
          completionDate: testStep.completedDate || null,
          status: testStep.status,
          toleranceOutcome: groupResult?.toleranceLevel || null,
          symptomCount: symptoms.length,
          averageSeverity: this.calculateAverageSeverity(symptoms),
          notes: testStep.notes || null,
        };
      });
    } catch (error) {
      console.error('Error fetching test history:', error);
      const errorType = categorizeError(error);
      const reportError = createReportError(
        errorType,
        'Failed to fetch test history',
        error instanceof Error ? error : undefined
      );
      throw reportError;
    }
  }

  /**
   * Get symptom timeline data with test markers
   */
  async getSymptomTimeline(userId: string, dateRange?: DateRange): Promise<SymptomTimelineData> {
    try {
      // Get all protocol runs for user
      const { rows: protocolRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        queries: [Query.equal('userId', [userId])],
      });

      const protocolRunIds = protocolRows.map((row) => row.id);
      if (protocolRunIds.length === 0) {
        console.log('No protocol runs found for user, returning empty timeline');
        return { entries: [], testMarkers: [] };
      }

      // Get all test steps
      const { rows: testStepRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        queries: [Query.equal('protocolRunId', protocolRunIds)],
      });

      const testSteps = testStepRows.map((row) => ({
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as TestStep[];

      // Get symptom entries
      const testStepIds = testSteps.map((ts) => ts.id);
      const symptomEntries = await this.getSymptomEntriesByTestStepIds(testStepIds);

      // Filter by date range if provided
      let filteredSymptoms = symptomEntries;
      if (dateRange) {
        filteredSymptoms = symptomEntries.filter(
          (se) => se.timestamp >= dateRange.start && se.timestamp <= dateRange.end
        );
      }

      // Get food items for context
      const foodItemIds = [...new Set(testSteps.map((ts) => ts.foodItemId))];
      const foodItems = await this.getFoodItemsByIds(foodItemIds);

      // Get washout periods
      const { rows: washoutRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.WASHOUT_PERIODS,
        queries: [Query.equal('protocolRunId', protocolRunIds)],
      });

      const washoutPeriods = washoutRows.map((row) => ({
        ...row,
        startDate: new Date(row.startDate),
        endDate: new Date(row.endDate),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })) as WashoutPeriod[];

      // Build timeline entries
      const entries = this.groupSymptomsByDate(filteredSymptoms, testSteps, foodItems);

      // Build test markers
      const testMarkers = this.buildTestMarkers(testSteps, foodItems, washoutPeriods);

      return { entries, testMarkers };
    } catch (error) {
      console.error('Error fetching symptom timeline:', error);
      const errorType = categorizeError(error);
      const reportError = createReportError(
        errorType,
        'Failed to fetch symptom timeline',
        error instanceof Error ? error : undefined
      );
      throw reportError;
    }
  }

  /**
   * Calculate summary metrics for a protocol run
   */
  async calculateMetrics(protocolRunId: string): Promise<ReportMetrics> {
    try {
      // Get protocol run
      const protocolRow = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        rowId: protocolRunId,
      });

      const protocolRun = {
        ...protocolRow,
        startDate: new Date(protocolRow.startDate),
        endDate: protocolRow.endDate ? new Date(protocolRow.endDate) : undefined,
        createdAt: new Date(protocolRow.createdAt),
        updatedAt: new Date(protocolRow.updatedAt),
        lastSyncAttempt: protocolRow.lastSyncAttempt
          ? new Date(protocolRow.lastSyncAttempt)
          : undefined,
      } as ProtocolRun;

      // Get test steps
      const { rows: testStepRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.TEST_STEPS,
        queries: [Query.equal('protocolRunId', [protocolRunId])],
      });

      const testSteps = testStepRows.map((row) => ({
        ...row,
        scheduledDate: new Date(row.scheduledDate),
        completedDate: row.completedDate ? new Date(row.completedDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as TestStep[];

      const completedTests = testSteps.filter((ts) => ts.status === 'completed');
      const inProgressTests = testSteps.filter((ts) => ts.status === 'in_progress');

      // Get group results
      const { rows: groupResultRows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.GROUP_RESULTS,
        queries: [Query.equal('protocolRunId', [protocolRunId])],
      });

      const groupResults = groupResultRows as unknown as GroupResult[];

      // Get symptom entries
      const testStepIds = testSteps.map((ts) => ts.id);
      const symptomEntries = await this.getSymptomEntriesByTestStepIds(testStepIds);

      // Calculate metrics
      const totalGroups = 4; // oligosaccharides, disaccharides, monosaccharides, polyols
      const testedGroups = new Set(groupResults.map((gr) => gr.fodmapGroup)).size;
      const groupsTestedPercentage = (testedGroups / totalGroups) * 100;

      const averageSymptomSeverity = this.calculateAverageSeverity(symptomEntries);

      const protocolDuration = protocolRun.endDate
        ? Math.ceil(
            (protocolRun.endDate.getTime() - protocolRun.startDate.getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : Math.ceil(
            (new Date().getTime() - protocolRun.startDate.getTime()) / (1000 * 60 * 60 * 24)
          );

      const toleratedFoodsCount = groupResults.filter((gr) => gr.toleranceLevel === 'high').length;
      const moderateFoodsCount = groupResults.filter(
        (gr) => gr.toleranceLevel === 'moderate'
      ).length;
      const triggerFoodsCount = groupResults.filter(
        (gr) => gr.toleranceLevel === 'low' || gr.toleranceLevel === 'none'
      ).length;

      return {
        totalTestsCompleted: completedTests.length,
        totalTestsInProgress: inProgressTests.length,
        groupsTestedPercentage,
        averageSymptomSeverity,
        protocolStartDate: protocolRun.startDate,
        protocolDuration,
        toleratedFoodsCount,
        moderateFoodsCount,
        triggerFoodsCount,
      };
    } catch (error) {
      console.error('Error calculating metrics:', error);
      const errorType = categorizeError(error);
      const reportError = createReportError(
        errorType,
        'Failed to calculate metrics',
        error instanceof Error ? error : undefined
      );
      throw reportError;
    }
  }

  /**
   * Get full report data for PDF generation
   */
  async getFullReport(userId: string): Promise<FullReportData> {
    try {
      // Get user profile
      const userRow = await tablesDB.getRow({
        databaseId: DATABASE_ID,
        tableId: TABLES.USER_PROFILES,
        rowId: userId,
      });

      const userProfile = {
        ...userRow,
        createdAt: new Date(userRow.createdAt),
        updatedAt: new Date(userRow.updatedAt),
      } as UserProfile;

      // Get active protocol run
      const protocolRun = await this.getActiveProtocolRun(userId);
      if (!protocolRun) {
        console.error('No active protocol found for user');
        throw createReportError(
          ReportErrorType.NO_DATA_ERROR,
          'No active protocol found',
          undefined,
          false
        );
      }

      // Get all report data - use Promise.allSettled to get partial data if some fail
      const results = await Promise.allSettled([
        this.getToleranceProfile(userId),
        this.getTestHistory(userId),
        this.getSymptomTimeline(userId),
        this.calculateMetrics(protocolRun.id),
      ]);

      // Extract successful results or use defaults
      const toleranceProfile =
        results[0].status === 'fulfilled' ? results[0].value : this.createEmptyToleranceProfile();

      const testHistory = results[1].status === 'fulfilled' ? results[1].value : [];

      const symptomTimeline =
        results[2].status === 'fulfilled' ? results[2].value : { entries: [], testMarkers: [] };

      const metrics =
        results[3].status === 'fulfilled'
          ? results[3].value
          : {
              totalTestsCompleted: 0,
              totalTestsInProgress: 0,
              groupsTestedPercentage: 0,
              averageSymptomSeverity: 0,
              protocolStartDate: protocolRun.startDate,
              protocolDuration: 0,
              toleratedFoodsCount: 0,
              moderateFoodsCount: 0,
              triggerFoodsCount: 0,
            };

      // Log any failures
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          const sectionNames = ['tolerance profile', 'test history', 'symptom timeline', 'metrics'];
          console.warn(`Failed to load ${sectionNames[index]}:`, result.reason);
        }
      });

      return {
        userInfo: {
          name: userProfile.name,
          email: userProfile.email,
        },
        reportDate: new Date(),
        toleranceProfile,
        testHistory,
        symptomTimeline,
        metrics,
      };
    } catch (error) {
      console.error('Error generating full report:', error);

      // If it's already a ReportError, rethrow it
      if (error && typeof error === 'object' && 'type' in error && 'userMessage' in error) {
        throw error;
      }

      const errorType = categorizeError(error);
      const reportError = createReportError(
        errorType,
        'Failed to generate full report',
        error instanceof Error ? error : undefined
      );
      throw reportError;
    }
  }

  // Private helper methods

  private async getActiveProtocolRun(userId: string): Promise<ProtocolRun | null> {
    try {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.PROTOCOL_RUNS,
        queries: [
          Query.equal('userId', [userId]),
          Query.equal('status', ['active']),
          Query.limit(1),
        ],
      });

      if (rows.length === 0) return null;

      const row = rows[0];
      return {
        ...row,
        startDate: new Date(row.startDate),
        endDate: row.endDate ? new Date(row.endDate) : undefined,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      } as ProtocolRun;
    } catch (error) {
      console.error('Error fetching active protocol run:', error);
      return null;
    }
  }

  private async getFoodItemsByIds(ids: string[]): Promise<FoodItem[]> {
    if (ids.length === 0) return [];

    try {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.FOOD_ITEMS,
        queries: [Query.equal('$id', ids)],
      });

      return rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })) as FoodItem[];
    } catch (error) {
      console.error('Error fetching food items:', error);
      return [];
    }
  }

  private async getSymptomEntriesByTestStepIds(testStepIds: string[]): Promise<SymptomEntry[]> {
    if (testStepIds.length === 0) return [];

    try {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.SYMPTOM_ENTRIES,
        queries: [Query.equal('testStepId', testStepIds)],
      });

      return rows.map((row) => ({
        ...row,
        timestamp: new Date(row.timestamp),
        createdAt: new Date(row.createdAt),
        lastSyncAttempt: row.lastSyncAttempt ? new Date(row.lastSyncAttempt) : undefined,
      })) as SymptomEntry[];
    } catch (error) {
      console.error('Error fetching symptom entries:', error);
      return [];
    }
  }

  private async getGroupResultsByProtocolRunIds(protocolRunIds: string[]): Promise<GroupResult[]> {
    if (protocolRunIds.length === 0) return [];

    try {
      const { rows } = await tablesDB.listRows({
        databaseId: DATABASE_ID,
        tableId: TABLES.GROUP_RESULTS,
        queries: [Query.equal('protocolRunId', protocolRunIds)],
      });

      return rows.map((row) => ({
        ...row,
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt),
      })) as GroupResult[];
    } catch (error) {
      console.error('Error fetching group results:', error);
      return [];
    }
  }

  private buildGroupToleranceData(
    groupResults: GroupResult[],
    testSteps: TestStep[],
    foodItems: FoodItem[]
  ): GroupTolerance[] {
    const allGroups: FodmapGroup[] = [
      'oligosaccharides',
      'disaccharides',
      'monosaccharides',
      'polyols',
    ];

    return allGroups.map((group) => {
      const groupResult = groupResults.find((gr) => gr.fodmapGroup === group);
      const groupFoodItems = foodItems.filter((fi) => fi.fodmapGroup === group);
      const testedFoodIds = testSteps
        .filter((ts) => ts.status === 'completed')
        .map((ts) => ts.foodItemId);
      const testedFoods = groupFoodItems
        .filter((fi) => testedFoodIds.includes(fi.id))
        .map((fi) => ({
          name: fi.name,
          toleranceLevel: groupResult?.toleranceLevel || 'none',
        }));

      return {
        fodmapGroup: group,
        toleranceLevel: groupResult?.toleranceLevel || null,
        testedFoods,
        status: testedFoods.length > 0 ? ('tested' as const) : ('untested' as const),
      };
    });
  }

  private calculateToleranceSummary(groups: GroupTolerance[]) {
    const testedGroups = groups.filter((g) => g.status === 'tested');

    return {
      totalGroups: groups.length,
      testedGroups: testedGroups.length,
      toleratedCount: groups.filter((g) => g.toleranceLevel === 'high').length,
      moderateCount: groups.filter((g) => g.toleranceLevel === 'moderate').length,
      triggerCount: groups.filter((g) => g.toleranceLevel === 'low' || g.toleranceLevel === 'none')
        .length,
    };
  }

  private calculateAverageSeverity(symptoms: SymptomEntry[]): number {
    if (symptoms.length === 0) return 0;
    const total = symptoms.reduce((sum, s) => sum + s.severity, 0);
    return Math.round((total / symptoms.length) * 10) / 10;
  }

  private groupSymptomsByDate(
    symptoms: SymptomEntry[],
    testSteps: TestStep[],
    foodItems: FoodItem[]
  ): TimelineEntry[] {
    const grouped = new Map<string, SymptomEntry[]>();

    symptoms.forEach((symptom) => {
      const dateKey = symptom.timestamp.toISOString().split('T')[0];
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(symptom);
    });

    return Array.from(grouped.entries())
      .map(([dateStr, daySymptoms]) => {
        const date = new Date(dateStr);
        const symptomDetails = daySymptoms.map((s) => {
          const testStep = testSteps.find((ts) => ts.id === s.testStepId);
          const foodItem = testStep ? foodItems.find((fi) => fi.id === testStep.foodItemId) : null;

          return {
            type: s.symptomType,
            severity: s.severity,
            testContext: foodItem?.name || null,
          };
        });

        return {
          date,
          symptoms: symptomDetails,
        };
      })
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private buildTestMarkers(
    testSteps: TestStep[],
    foodItems: FoodItem[],
    washoutPeriods: WashoutPeriod[]
  ): TestMarker[] {
    const markers: TestMarker[] = [];

    // Add test start markers
    testSteps.forEach((testStep) => {
      const foodItem = foodItems.find((fi) => fi.id === testStep.foodItemId);
      if (foodItem) {
        markers.push({
          date: testStep.scheduledDate,
          foodName: foodItem.name,
          type: 'test_start',
        });

        if (testStep.completedDate) {
          markers.push({
            date: testStep.completedDate,
            foodName: foodItem.name,
            type: 'test_end',
          });
        }
      }
    });

    // Add washout markers
    washoutPeriods.forEach((washout) => {
      markers.push({
        date: washout.startDate,
        foodName: 'Washout',
        type: 'washout',
      });
    });

    return markers.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  private createEmptyToleranceProfile(): ToleranceProfile {
    const allGroups: FodmapGroup[] = [
      'oligosaccharides',
      'disaccharides',
      'monosaccharides',
      'polyols',
    ];

    return {
      groups: allGroups.map((group) => ({
        fodmapGroup: group,
        toleranceLevel: null,
        testedFoods: [],
        status: 'untested' as const,
      })),
      summary: {
        totalGroups: 4,
        testedGroups: 0,
        toleratedCount: 0,
        moderateCount: 0,
        triggerCount: 0,
      },
    };
  }
}

// Export singleton instance
export const reportService = new ReportService();
