# Implementation Plan

- [x] 1. Define database schema with Drizzle ORM
  - Create src/db/schema.ts with all entity table definitions (userProfiles, protocolRuns, testSteps, symptomEntries, washoutPeriods, foodItems, groupResults, notificationSchedules)
  - Define all entity relations using Drizzle relations syntax
  - Export TypeScript types inferred from schemas ($inferSelect, $inferInsert)
  - Define enum types for status fields, FODMAP groups, symptom types, etc.
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 10.1, 10.2, 10.6_

- [x] 2. Create initial database migration
  - Generate initial migration using drizzle-kit generate command
  - Verify migration SQL includes all table creation statements
  - Add index creation statements for frequently queried columns (email, user_id, protocol_run_id, test_step_id, timestamp, scheduled_time, sent_status)
  - Add composite index for symptom_entries (test_step_id, timestamp)
  - Update drizzle.config.ts if needed to point to correct schema and output directory
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 3. Update database client configuration
  - Update src/infrastructure/database/client.ts to use new schema
  - Implement database initialization function that runs migrations
  - Export db instance with proper typing
  - _Requirements: 2.5_

- [x] 4. Implement base repository class
  - Create src/services/repositories/BaseRepository.ts with common methods
  - Implement handleError method for consistent error handling
  - Implement generateId method for creating unique IDs
  - Implement now method for timestamp generation
  - _Requirements: 3.10_

- [x] 5. Implement UserProfileRepository
  - Create src/services/repositories/UserProfileRepository.ts extending BaseRepository
  - Implement create method with validation
  - Implement findById method
  - Implement findByEmail method with email index usage
  - Implement update method
  - Implement delete method
  - _Requirements: 3.1, 3.10_

- [x] 6. Implement ProtocolRunRepository
  - Create src/services/repositories/ProtocolRunRepository.ts extending BaseRepository
  - Implement create method
  - Implement findById method
  - Implement findByUserId method with user_id index usage
  - Implement findActive method filtering by status and user_id
  - Implement update method
  - Implement delete method
  - _Requirements: 3.2, 3.10_

- [x] 7. Implement TestStepRepository
  - Create src/services/repositories/TestStepRepository.ts extending BaseRepository
  - Implement create method
  - Implement findById method
  - Implement findByProtocolRunId method with protocol_run_id index usage
  - Implement findByStatus method with status index usage
  - Implement update method
  - Implement delete method
  - _Requirements: 3.3, 3.10_

- [x] 8. Implement SymptomEntryRepository
  - Create src/services/repositories/SymptomEntryRepository.ts extending BaseRepository
  - Implement create method
  - Implement findById method
  - Implement findByTestStepId method with test_step_id index usage
  - Implement findByDateRange method using composite index (test_step_id, timestamp)
  - Implement delete method
  - _Requirements: 3.4, 3.10_

- [x] 9. Implement remaining repositories
  - Create WashoutPeriodRepository with create, findById, findByProtocolRunId, update, delete methods
  - Create FoodItemRepository with create, findById, findByFodmapGroup, findAll, update, delete methods
  - Create GroupResultRepository with create, findById, findByProtocolRunId, update, delete methods
  - Create NotificationScheduleRepository with create, findById, findPending, markAsSent, delete methods
  - Export all repositories from src/services/repositories/index.ts
  - _Requirements: 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_

- [x] 10. Configure TanStack Query client
  - Create src/lib/queryClient.ts with QueryClient instance
  - Configure default staleTime (5 minutes)
  - Configure default gcTime (10 minutes)
  - Configure retry logic (3 attempts with exponential backoff)
  - Configure refetchOnWindowFocus and refetchOnReconnect
  - Define query key factory with consistent naming convention for all entities
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.8_

- [x] 11. Add QueryClientProvider to app root
  - Update App.tsx or index.ts to wrap app with QueryClientProvider
  - Import and use queryClient from src/lib/queryClient.ts
  - _Requirements: 4.7_

- [x] 12. Implement query hooks for data fetching
  - Create src/shared/hooks/useUserProfile.ts with useUserProfile, useUserProfileByEmail hooks
  - Create src/shared/hooks/useProtocolRuns.ts with useProtocolRuns, useProtocolRun, useActiveProtocolRun hooks
  - Create src/shared/hooks/useTestSteps.ts with useTestSteps, useTestStep, useTestStepsByStatus hooks
  - Create src/shared/hooks/useSymptomEntries.ts with useSymptomEntries, useSymptomEntry hooks
  - Create src/shared/hooks/useFoodItems.ts with useFoodItems, useFoodItem, useFoodItemsByGroup hooks
  - All hooks should return data, isLoading, error states from TanStack Query
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.8_

- [x] 13. Implement mutation hooks for data modifications
  - Add useCreateUserProfile, useUpdateUserProfile, useDeleteUserProfile to useUserProfile.ts
  - Add useCreateProtocolRun, useUpdateProtocolRun, useDeleteProtocolRun to useProtocolRuns.ts
  - Add useCreateTestStep, useUpdateTestStep, useDeleteTestStep to useTestSteps.ts
  - Add useCreateSymptomEntry, useDeleteSymptomEntry to useSymptomEntries.ts
  - Add useCreateFoodItem, useUpdateFoodItem, useDeleteFoodItem to useFoodItems.ts
  - Implement optimistic updates in mutation hooks where appropriate
  - Implement automatic cache invalidation on mutation success
  - _Requirements: 5.6, 5.7_

- [x] 14. Create seed data for development
  - Create src/db/seeds/index.ts with seedDatabase function
  - Implement seedFoodItems function with 10+ food items covering all FODMAP groups
  - Implement seedUsers function with 2 test user profiles
  - Implement seedProtocolRun function with sample protocol run and test steps
  - Implement seedSymptomEntries function with sample symptom data
  - Add npm script "db:seed" to package.json
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] 15. Create fixture functions for testing
  - Create src/shared/fixtures/dataFixtures.ts
  - Implement createMockUserProfile function
  - Implement createMockProtocolRun function
  - Implement createMockTestStep function
  - Implement createMockSymptomEntry function
  - Implement createMockFoodItem function
  - All fixtures should accept optional overrides parameter
  - _Requirements: 6.7_

- [x] 16. Document offline-first strategy in README
  - Add "Data Layer Architecture" section to README.md
  - Document offline-first approach with SQLite as primary data source
  - Explain Supabase sync strategy (when sync occurs, how it works)
  - Document potential sync conflict scenarios
  - Document planned conflict resolution strategies (last-write-wins with timestamps)
  - Add code examples for common data operations (create, read, update, delete)
  - Document query key naming conventions
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

- [x] 17. Write unit tests for repositories
- [x] 17.1 Write tests for UserProfileRepository (create, findById, findByEmail, update, delete, error handling)
  - _Requirements: 8.1, 8.6, 8.7, 8.8, 8.9_
- [x] 17.2 Write tests for ProtocolRunRepository (create, findById, findByUserId, findActive, update, delete, error handling)
  - _Requirements: 8.2, 8.6, 8.7, 8.8, 8.9_
- [x] 17.3 Write tests for TestStepRepository (create, findById, findByProtocolRunId, findByStatus, update, delete, error handling)
  - _Requirements: 8.3, 8.6, 8.7, 8.8, 8.9_
- [x] 17.4 Write tests for SymptomEntryRepository (create, findById, findByTestStepId, findByDateRange, delete, error handling)
  - _Requirements: 8.4, 8.6, 8.7, 8.8, 8.9_
- [x] 17.5 Write tests for FoodItemRepository (create, findById, findByFodmapGroup, findAll, update, delete, error handling)
  - _Requirements: 8.5, 8.6, 8.7, 8.8, 8.9_
