# Implementation Plan

- [x] 1. Create educational content type definitions and JSON schema
  - Define TypeScript types for EducationalContent, ContentCategory, DifficultyLevel, and AnxietyLevel in `src/content/education/types.ts`
  - Create JSON schema file at `src/content/education/schema.json` for content validation
  - Export all types from index file
  - _Requirements: 6.2, 6.4_

- [x] 2. Implement ContentRepository interface and LocalJsonContentRepository
  - Create ContentRepository interface in `src/features/washout/repositories/ContentRepository.ts` with methods: loadAll, findById, findByCategory, findByTags
  - Implement LocalJsonContentRepository in `src/features/washout/repositories/LocalJsonContentRepository.ts` with JSON file loading, schema validation, in-memory caching, and error handling for invalid content
  - Add SupabaseContentRepository interface stub with TODO comments for future migration
  - _Requirements: 6.1, 6.2, 6.3, 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 3. Create sample educational content JSON files
  - Create directory structure `src/content/education/`
  - Write 3-5 sample content files covering different categories (social-tips, recipes, fodmap-guidance, anxiety-support)
  - Include variety of difficulty levels and anxiety level targets
  - Ensure all files validate against the JSON schema
  - _Requirements: 6.1, 6.4_

- [x] 4. Implement UserState derivation logic
  - Create `src/features/washout/utils/userStateUtils.ts` with deriveUserState function
  - Implement experience level calculation based on completed tests count
  - Integrate with existing UserProfileRepository and ProtocolRunRepository
  - Add function to retrieve previously viewed content IDs from telemetry
  - _Requirements: 4.1, 5.1_

- [x] 5. Implement ContentSurfacingEngine
  - Create ContentSurfacingEngine class in `src/features/washout/services/ContentSurfacingEngine.ts`
  - Implement selectContent method with filtering logic for experience level, anxiety level, and previously viewed content
  - Implement rankContent method with scoring algorithm (experience match +10, anxiety-support +15, not viewed +5, recency +0-3)
  - Add unit tests for filtering and ranking logic
  - _Requirements: 3.1, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3_

- [x] 6. Implement TelemetryService and TelemetryEventStore
  - Create TelemetryEvent type and TelemetryService interface in `src/features/washout/services/TelemetryService.ts`
  - Implement TelemetryEventStore using AsyncStorage in `src/features/washout/stores/TelemetryEventStore.ts`
  - Implement TelemetryService with event batching (max 50 events or 5 minutes), local persistence, and retry logic
  - Add methods: trackContentViewed, trackContentExpanded, trackContentCompleted, syncEvents
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 7. Extend WashoutPeriodRepository with required methods
  - Add findActive method to WashoutPeriodRepository in `src/services/repositories/WashoutPeriodRepository.ts`
  - Add findByProtocolRun method for fetching all washout periods for a protocol run
  - Ensure repository extends BaseRepository pattern
  - Add corresponding React Query hooks in `src/shared/hooks/useWashoutPeriods.ts`
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 8. Implement NotificationService for washout reminders
  - Create NotificationService in `src/features/washout/services/NotificationService.ts`
  - Implement scheduleWashoutReminders with frequency calculation (base frequency × 0.67 for high anxiety)
  - Implement cancelWashoutReminders and updateReminderFrequency methods
  - Integrate with existing NotificationScheduleRepository
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 9. Create useWashout custom hook
  - Implement useWashout hook in `src/features/washout/hooks/useWashout.ts`
  - Fetch washout period data using WashoutPeriodRepository
  - Calculate countdown values (days, hours, minutes, isComplete)
  - Request personalized content from ContentSurfacingEngine based on user state
  - Fetch reminder messages from NotificationService
  - Implement refreshContent and updateReminderFrequency methods
  - Add real-time countdown updates using useEffect with 1-minute interval
  - _Requirements: 1.1, 1.2, 2.1, 3.1, 3.2_

- [x] 10. Create WashoutCountdown component
  - Implement WashoutCountdown component in `src/features/washout/components/WashoutCountdown.tsx`
  - Display countdown timer with days and hours remaining
  - Add progress bar visualization showing percentage complete
  - Implement completion notification when countdown reaches zero
  - Add accessibility labels for screen readers
  - Support font scaling and theme colors
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 11. Create EducationalContentCard component
  - Implement EducationalContentCard in `src/features/washout/components/EducationalContentCard.tsx`
  - Add collapsible/expandable content with smooth animation
  - Display category badges and difficulty level indicators
  - Show estimated read time
  - Implement scroll tracking to detect when user reaches end of content
  - Trigger telemetry events: onView (3+ seconds), onExpand (tap), onComplete (scroll to end)
  - Add accessibility support with proper roles and labels
  - _Requirements: 3.2, 3.3, 3.4, 7.1, 7.2, 7.3_

- [x] 12. Create ReminderBanner component
  - Implement ReminderBanner in `src/features/washout/components/ReminderBanner.tsx`
  - Support different types: info, warning, success
  - Add optional dismiss functionality
  - Use theme colors for different types
  - Add accessibility role="alert" for screen readers
  - _Requirements: 2.1, 2.2_

- [x] 13. Implement WashoutScreen
  - Create WashoutScreen in `src/features/washout/screens/WashoutScreen.tsx`
  - Integrate useWashout hook for data fetching
  - Render WashoutCountdown component at top
  - Display ReminderBanner if reminders exist
  - Render scrollable list of EducationalContentCard components
  - Handle loading and error states
  - Add pull-to-refresh functionality
  - Implement navigation to content detail view (if needed)
  - _Requirements: 1.1, 2.1, 3.1, 3.2, 3.5_

- [x] 14. Add washout screen to navigation
  - Add WashoutScreen route to AppNavigator in `src/navigation/AppNavigator.tsx`
  - Create navigation params type for WashoutScreen (washoutPeriodId)
  - Add navigation from JourneyScreen or ReintroductionHomeScreen when washout is active
  - Ensure deep linking support for washout screen
  - _Requirements: 1.1_

- [x] 15. Create index files and exports
  - Create `src/features/washout/index.ts` exporting all public components and hooks
  - Create `src/features/washout/components/index.ts` exporting all components
  - Create `src/features/washout/hooks/index.ts` exporting useWashout
  - Create `src/features/washout/services/index.ts` exporting all services
  - Create `src/content/education/index.ts` exporting types and repository
  - _Requirements: All_

- [ ]\* 16. Write integration tests for washout flow
  - Create test file `src/features/washout/__tests__/WashoutScreen.integration.test.tsx`
  - Test screen loads with active washout period
  - Test countdown displays correctly
  - Test educational content cards render
  - Test telemetry events fire on card interactions
  - Test reminder banner displays when reminders exist
  - Mock ContentRepository and TelemetryService
  - _Requirements: 1.1, 2.1, 3.1, 7.1, 7.2, 7.3_

- [ ]\* 17. Add documentation
  - Create README.md in `src/features/washout/` explaining feature architecture
  - Document ContentSurfacingEngine algorithm and scoring
  - Document migration path from LocalJsonContentRepository to SupabaseContentRepository
  - Add JSDoc comments to all public interfaces and methods
  - Create example content file with annotations
  - _Requirements: 8.5_
