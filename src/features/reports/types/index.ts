/**
 * Report-specific type definitions
 */

import type {
  FodmapGroup,
  ToleranceLevel,
  TestStepStatus,
  SymptomType,
} from '../../../shared/types/entities';

/**
 * Tolerance Profile Types
 */
export interface ToleranceProfile {
  groups: GroupTolerance[];
  summary: ToleranceSummary;
}

export interface GroupTolerance {
  fodmapGroup: FodmapGroup;
  toleranceLevel: ToleranceLevel | null;
  testedFoods: TestedFood[];
  status: 'tested' | 'untested';
}

export interface TestedFood {
  name: string;
  toleranceLevel: ToleranceLevel;
}

export interface ToleranceSummary {
  totalGroups: number;
  testedGroups: number;
  toleratedCount: number;
  moderateCount: number;
  triggerCount: number;
}

/**
 * Test History Types
 */
export interface TestHistoryItem {
  id: string;
  foodName: string;
  fodmapGroup: FodmapGroup;
  testDate: Date;
  completionDate: Date | null;
  status: TestStepStatus;
  toleranceOutcome: ToleranceLevel | null;
  symptomCount: number;
  averageSeverity: number;
  notes: string | null;
}

export interface HistoryOptions {
  limit?: number;
  offset?: number;
  status?: TestStepStatus;
}

/**
 * Symptom Timeline Types
 */
export interface SymptomTimelineData {
  entries: TimelineEntry[];
  testMarkers: TestMarker[];
}

export interface TimelineEntry {
  date: Date;
  symptoms: SymptomDetail[];
}

export interface SymptomDetail {
  type: SymptomType;
  severity: number;
  testContext: string | null;
}

export interface TestMarker {
  date: Date;
  foodName: string;
  type: 'test_start' | 'test_end' | 'washout';
}

export interface DateRange {
  start: Date;
  end: Date;
}

/**
 * Report Metrics Types
 */
export interface ReportMetrics {
  totalTestsCompleted: number;
  totalTestsInProgress: number;
  groupsTestedPercentage: number;
  averageSymptomSeverity: number;
  protocolStartDate: Date;
  protocolDuration: number; // days
  toleratedFoodsCount: number;
  moderateFoodsCount: number;
  triggerFoodsCount: number;
}

/**
 * Full Report Data
 */
export interface FullReportData {
  userInfo: {
    name: string;
    email: string;
  };
  reportDate: Date;
  toleranceProfile: ToleranceProfile;
  testHistory: TestHistoryItem[];
  symptomTimeline: SymptomTimelineData;
  metrics: ReportMetrics;
}

/**
 * Error Types
 */
export enum ReportErrorType {
  DATA_FETCH_ERROR = 'DATA_FETCH_ERROR',
  PDF_GENERATION_ERROR = 'PDF_GENERATION_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
}

export interface ReportError {
  type: ReportErrorType;
  message: string;
  userMessage: string; // Portuguese message for user
  retryable: boolean;
}
