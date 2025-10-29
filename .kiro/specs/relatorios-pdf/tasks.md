# Implementation Plan

- [x] 1. Set up project dependencies and types
  - Install expo-print, expo-sharing, react-native-svg, and date-fns packages
  - Create TypeScript type definitions for report data structures (ToleranceProfile, TestHistoryItem, SymptomTimelineData, ReportMetrics, FullReportData)
  - Create error type definitions (ReportErrorType, ReportError)
  - _Requirements: 1.1, 2.1, 3.1, 7.1_

- [x] 2. Implement ReportService for data aggregation
  - [x] 2.1 Create ReportService class with repository dependencies
    - Implement constructor accepting repository instances
    - Add private methods for data transformation
    - _Requirements: 1.1, 1.2, 2.1, 7.1_

  - [x] 2.2 Implement getToleranceProfile method
    - Query GroupResultRepository for tolerance data by protocol run
    - Query FoodItemRepository to get tested food names
    - Calculate summary metrics (total groups, tested groups, tolerance counts)
    - Transform data into ToleranceProfile structure
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 2.3 Implement getTestHistory method
    - Query TestStepRepository for all test steps by user
    - Join with FoodItemRepository to get food names
    - Query SymptomEntryRepository for symptom counts per test
    - Calculate average severity per test
    - Sort by test date (most recent first)
    - Transform data into TestHistoryItem array
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 2.4 Implement getSymptomTimeline method
    - Query SymptomEntryRepository with date range filter
    - Join with TestStepRepository to get test context
    - Query TestStepRepository and WashoutPeriodRepository for test markers
    - Group symptoms by date
    - Transform data into SymptomTimelineData structure
    - _Requirements: 3.1, 3.2, 3.4, 3.5_

  - [x] 2.5 Implement calculateMetrics method
    - Query ProtocolRunRepository for protocol dates
    - Count completed tests from TestStepRepository
    - Calculate groups tested percentage from GroupResultRepository
    - Calculate average symptom severity from SymptomEntryRepository
    - Count tolerance categories from GroupResultRepository
    - Return ReportMetrics object
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

  - [x] 2.6 Implement getFullReport method
    - Call all data aggregation methods (tolerance, history, timeline, metrics)
    - Query UserProfileRepository for user info
    - Combine all data into FullReportData structure
    - Handle errors gracefully with try-catch blocks
    - _Requirements: 4.2, 5.1, 7.1_

- [x] 3. Create chart components with SVG rendering
  - [x] 3.1 Implement ToleranceChart component
    - Accept ToleranceProfile data and highContrastMode props
    - Render bar chart using react-native-svg
    - Display FODMAP groups on x-axis, food count on y-axis
    - Use color coding for tolerance categories (tolerated/moderate/trigger)
    - Apply high contrast colors when highContrastMode is true
    - Add legend explaining categories
    - _Requirements: 1.1, 1.3, 6.1, 6.2, 6.3_

  - [x] 3.2 Implement SymptomTimelineChart component
    - Accept SymptomTimelineData and highContrastMode props
    - Render line chart using react-native-svg
    - Display dates on x-axis, severity (1-10) on y-axis
    - Plot multiple lines for different symptom types
    - Add markers for test start/end dates
    - Apply high contrast colors when enabled
    - Implement virtualization for datasets > 100 points
    - _Requirements: 3.1, 3.2, 3.3, 6.1, 6.2, 9.1, 9.3_

  - [x] 3.3 Implement TestHistoryList component
    - Accept TestHistoryItem array as prop
    - Render scrollable FlatList of test cards
    - Display food name, date, status, and tolerance outcome per card
    - Show symptom count and average severity
    - Handle empty state with message
    - Add onPress handler to show test details
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 3.4 Implement MetricsSummary component
    - Accept ReportMetrics as prop
    - Render grid of metric cards
    - Display total tests, groups tested %, average severity, protocol duration
    - Display tolerance distribution (tolerated/moderate/trigger counts)
    - Format numbers and percentages appropriately
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. Build ReportsScreen with tab navigation
  - [x] 4.1 Create ReportsScreen component structure
    - Set up tab navigation (Tolerance, History, Timeline)
    - Add high contrast mode toggle in header
    - Add PDF export button in header
    - Implement loading state with spinner
    - Implement error state with retry button
    - _Requirements: 1.1, 2.1, 3.1, 4.1, 6.1, 8.1_

  - [x] 4.2 Implement Tolerance tab
    - Render MetricsSummary component
    - Render ToleranceChart component
    - Pass highContrastMode state to chart
    - Handle empty state (no tests completed)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

  - [x] 4.3 Implement History tab
    - Render TestHistoryList component
    - Implement pull-to-refresh functionality
    - Handle empty state (no tests)
    - Add filter options (all/completed/in-progress)
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 4.4 Implement Timeline tab
    - Render SymptomTimelineChart component
    - Add date range filter controls
    - Pass highContrastMode state to chart
    - Handle empty state (no symptoms logged)
    - Show loading indicator during data fetch
    - _Requirements: 3.1, 3.2, 3.3, 3.5, 9.5_

  - [x] 4.5 Implement data fetching with React Query
    - Create useReportData hook using React Query
    - Fetch report data on screen mount
    - Implement 5-minute cache with automatic invalidation
    - Refetch on pull-to-refresh
    - Handle loading and error states
    - _Requirements: 1.5, 8.1, 8.5_

  - [x] 4.6 Implement high contrast mode toggle
    - Add toggle switch in screen header
    - Store preference in AsyncStorage
    - Pass highContrastMode state to all chart components
    - Persist preference across sessions
    - _Requirements: 6.1, 6.4, 6.5_

- [x] 5. Implement PDFService for report generation
  - [x] 5.1 Create PDFService class
    - Implement generateHTMLMarkup method
    - Implement formatDate method for pt-BR formatting
    - Implement getDisclaimers method returning Portuguese disclaimers
    - Add helper methods for HTML section generation
    - _Requirements: 4.2, 4.3, 5.1, 5.2, 10.1, 10.2, 10.3, 10.4_

  - [x] 5.2 Implement HTML markup generation for tolerance section
    - Generate header with report title and date
    - Create tolerance profile table with FODMAP groups
    - Display tolerance categories with color coding
    - List tested foods per group
    - Add legend explaining categories
    - _Requirements: 4.2, 5.1, 5.3_

  - [x] 5.3 Implement HTML markup generation for test history section
    - Create chronological table of tests
    - Include columns: Data, Alimento, Grupo FODMAP, Status, Resultado
    - Format dates in pt-BR (dd/MM/yyyy)
    - Display notes if present
    - Apply professional table styling
    - _Requirements: 4.2, 4.3, 5.1, 5.3_

  - [x] 5.4 Implement HTML markup generation for symptom timeline section
    - Convert SymptomTimelineChart to SVG string
    - Embed SVG in HTML markup
    - Add timeline description text
    - Include severity scale legend
    - Add test markers with labels
    - _Requirements: 4.2, 5.1, 5.3_

  - [x] 5.5 Implement HTML markup generation for metrics section
    - Create metrics summary cards
    - Display total tests, groups tested %, average severity
    - Show protocol duration and date range
    - Display tolerance distribution
    - Format numbers and percentages
    - _Requirements: 4.2, 5.1, 5.3, 5.4_

  - [x] 5.6 Implement footer with disclaimers and page numbers
    - Add disclaimers section with Portuguese text
    - Include medical advice disclaimer
    - Include informational purpose disclaimer
    - Add page numbers to footer
    - Add generation timestamp
    - _Requirements: 5.4, 5.5, 10.1, 10.2, 10.3, 10.4, 10.5_

  - [x] 5.7 Implement generateAndSharePDF method
    - Call generateHTMLMarkup to get HTML string
    - Use expo-print to generate PDF from HTML
    - Handle PDF generation errors with try-catch
    - Check device storage before generation
    - Use expo-sharing to open native share dialog
    - Clean up temporary files after sharing
    - _Requirements: 4.1, 4.2, 4.5, 8.1, 8.2, 8.5_

- [x] 6. Add Portuguese translations for UI
  - Create pt-BR translation file in i18n locales
  - Add translations for all report screen labels (tabs, buttons, metrics)
  - Add translations for tolerance categories (tolerado, moderado, gatilho)
  - Add translations for error messages
  - Add translations for disclaimer text
  - Update i18n configuration to include report translations
  - _Requirements: 4.3, 5.2, 8.1, 10.4_

- [x] 7. Implement error handling and user feedback
  - [x] 7.1 Add error handling in ReportService
    - Wrap all repository calls in try-catch blocks
    - Create ReportError objects with user-friendly Portuguese messages
    - Log errors for debugging
    - Return partial data when possible
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [x] 7.2 Add error handling in PDFService
    - Catch PDF generation errors
    - Check available storage before generation
    - Handle permission errors
    - Display Portuguese error messages to user
    - Provide retry option
    - _Requirements: 4.5, 8.1, 8.2, 8.5_

  - [x] 7.3 Implement error UI in ReportsScreen
    - Show error message when data fetch fails
    - Display retry button
    - Show specific error messages for different error types
    - Handle network errors gracefully
    - Show toast notifications for export success/failure
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 8. Add loading states and performance optimizations
  - [x] 8.1 Implement loading indicators
    - Show spinner during initial data fetch
    - Show skeleton screens for charts while loading
    - Show progress indicator during PDF generation
    - Disable export button while generating PDF
    - _Requirements: 9.5_

  - [x] 8.2 Implement chart performance optimizations
    - Memoize chart components with React.memo
    - Cache chart data transformations
    - Implement virtualization for timeline with > 100 points
    - Lazy load chart data on tab switch
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [x] 8.3 Implement data caching strategy
    - Configure React Query cache time (5 minutes)
    - Invalidate cache on new symptom entry
    - Invalidate cache on test completion
    - Implement stale-while-revalidate pattern
    - _Requirements: 1.5, 9.1_

- [x] 9. Integrate ReportsScreen into app navigation
  - Add ReportsScreen to main tab navigator
  - Create navigation route configuration
  - Add reports icon to tab bar
  - Update navigation types with reports route
  - Test navigation flow from other screens
  - _Requirements: 4.1_

- [x] 10. Create accessibility features
  - Add screen reader labels to all interactive elements
  - Provide meaningful descriptions for charts
  - Announce state changes (loading, exporting, errors)
  - Test with screen reader (TalkBack/VoiceOver)
  - Ensure all buttons have accessible labels
  - Add alt text for chart visualizations
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [ ]\* 11. Write integration tests for report generation flow
  - Create test protocol with completed tests and symptoms
  - Test ReportService data aggregation methods
  - Test tolerance profile calculation
  - Test metrics calculation
  - Test full report data generation
  - Verify all sections populated correctly
  - _Requirements: 1.1, 2.1, 3.1, 7.1_

- [ ]\* 12. Write integration tests for PDF export flow
  - Mock expo-print and expo-sharing
  - Test PDF generation with full report data
  - Test error scenarios (storage full, permissions denied)
  - Verify HTML markup structure
  - Verify Portuguese translations in PDF
  - Test disclaimer inclusion
  - _Requirements: 4.1, 4.2, 4.5, 5.1, 10.1_

- [ ]\* 13. Write component tests for charts
  - Test ToleranceChart rendering with valid data
  - Test SymptomTimelineChart rendering with valid data
  - Test high contrast mode toggle
  - Test empty state handling
  - Test chart accessibility features
  - Test performance with large datasets
  - _Requirements: 1.3, 3.2, 6.1, 6.2, 9.1_

- [ ]\* 14. Perform performance testing
  - Test report generation with 100+ tests
  - Test chart rendering with 100+ data points
  - Measure PDF generation time
  - Test on low-end devices
  - Verify memory usage stays under 50MB
  - Optimize bottlenecks if needed
  - _Requirements: 9.1, 9.2, 9.3, 9.4_
