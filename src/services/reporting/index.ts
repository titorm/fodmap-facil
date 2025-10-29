/**
 * Reporting service exports
 */

export { ReportService, reportService } from './ReportService';
export { PDFService, pdfService } from './PDFService';
export {
  ReportErrorType,
  createReportError,
  categorizeError,
  isNetworkError,
  isStorageError,
  isPermissionError,
  type ReportError,
} from './errors';
export type {
  ToleranceProfile,
  TestHistoryItem,
  SymptomTimelineData,
  ReportMetrics,
  FullReportData,
  HistoryOptions,
  DateRange,
  GroupTolerance,
  TestedFood,
  ToleranceSummary,
  TimelineEntry,
  SymptomDetail,
  TestMarker,
} from '../../features/reports/types';
