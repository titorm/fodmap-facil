# Requirements Document

## Introduction

This document defines the requirements for implementing a comprehensive data layer for the "fodmap-facil" mobile application. The Data_Layer shall provide offline-first data persistence using SQLite with Drizzle ORM, synchronization capabilities with Supabase, and a robust repository pattern with TanStack Query for efficient data fetching and caching. The system shall support the complete FODMAP reintroduction protocol workflow including user profiles, protocol runs, test steps, symptom tracking, washout periods, food items, group results, and notification scheduling.

## Glossary

- **Data_Layer**: The complete data persistence and management system including database schema, repositories, and query client
- **Drizzle_ORM**: The TypeScript ORM used for type-safe database operations with SQLite
- **SQLite_Database**: The local embedded database for offline-first data storage
- **Supabase_Sync**: The synchronization mechanism between local SQLite and remote Supabase database
- **Repository**: A data access pattern that encapsulates CRUD operations and queries for specific entities
- **TanStack_Query**: The data fetching and caching library (formerly React Query) for managing server state
- **Query_Client**: The configured TanStack Query client with cache settings and defaults
- **Migration**: A versioned database schema change script managed by Drizzle
- **Seed_Data**: Initial fixture data for development and testing purposes
- **UserProfile_Entity**: The entity representing user profile information
- **ProtocolRun_Entity**: The entity representing a complete FODMAP reintroduction protocol execution
- **TestStep_Entity**: The entity representing individual test steps within a protocol run
- **SymptomEntry_Entity**: The entity representing symptom records logged by users
- **WashoutPeriod_Entity**: The entity representing washout periods between food tests
- **FoodItem_Entity**: The entity representing FODMAP food items available for testing
- **GroupResult_Entity**: The entity representing aggregated results for FODMAP groups
- **NotificationSchedule_Entity**: The entity representing scheduled notifications for protocol reminders

## Requirements

### Requirement 1

**User Story:** As a developer, I want a type-safe database schema defined with Drizzle ORM, so that I can perform database operations with compile-time type checking and avoid runtime errors

#### Acceptance Criteria

1. THE Data_Layer SHALL define a UserProfile_Entity schema with fields for id, email, name, language preference, theme preference, created timestamp, and updated timestamp
2. THE Data_Layer SHALL define a ProtocolRun_Entity schema with fields for id, user_id, status, start_date, end_date, and notes
3. THE Data_Layer SHALL define a TestStep_Entity schema with fields for id, protocol_run_id, food_item_id, sequence_number, status, scheduled_date, completed_date, and notes
4. THE Data_Layer SHALL define a SymptomEntry_Entity schema with fields for id, test_step_id, symptom_type, severity, timestamp, and notes
5. THE Data_Layer SHALL define a WashoutPeriod_Entity schema with fields for id, protocol_run_id, start_date, end_date, and status
6. THE Data_Layer SHALL define a FoodItem_Entity schema with fields for id, name, fodmap_group, fodmap_type, serving_size, and description
7. THE Data_Layer SHALL define a GroupResult_Entity schema with fields for id, protocol_run_id, fodmap_group, tolerance_level, and notes
8. THE Data_Layer SHALL define a NotificationSchedule_Entity schema with fields for id, test_step_id, notification_type, scheduled_time, sent_status, and message
9. THE Data_Layer SHALL define all entity relationships using Drizzle ORM relation syntax
10. THE Data_Layer SHALL export all schema definitions from a single src/db/schema.ts file

### Requirement 2

**User Story:** As a developer, I want database migrations managed by Drizzle, so that I can version control schema changes and apply them consistently across environments

#### Acceptance Criteria

1. THE Data_Layer SHALL create an initial migration file in src/db/migrations/ directory
2. THE Data_Layer SHALL include SQL statements for creating all entity tables in the initial migration
3. THE Data_Layer SHALL include SQL statements for creating all foreign key constraints in the initial migration
4. THE Data_Layer SHALL include SQL statements for creating indexes on frequently queried columns
5. WHEN a developer executes the migration command, THEN THE Drizzle_ORM SHALL apply all pending migrations to the SQLite_Database
6. THE Data_Layer SHALL maintain migration history to prevent duplicate application of migrations

### Requirement 3

**User Story:** As a developer, I want repository classes for each entity, so that I can perform CRUD operations and queries through a consistent interface

#### Acceptance Criteria

1. THE Data_Layer SHALL provide a UserProfileRepository with methods for create, findById, findByEmail, update, and delete operations
2. THE Data_Layer SHALL provide a ProtocolRunRepository with methods for create, findById, findByUserId, findActive, update, and delete operations
3. THE Data_Layer SHALL provide a TestStepRepository with methods for create, findById, findByProtocolRunId, findByStatus, update, and delete operations
4. THE Data_Layer SHALL provide a SymptomEntryRepository with methods for create, findById, findByTestStepId, findByDateRange, and delete operations
5. THE Data_Layer SHALL provide a WashoutPeriodRepository with methods for create, findById, findByProtocolRunId, update, and delete operations
6. THE Data_Layer SHALL provide a FoodItemRepository with methods for create, findById, findByFodmapGroup, findAll, update, and delete operations
7. THE Data_Layer SHALL provide a GroupResultRepository with methods for create, findById, findByProtocolRunId, update, and delete operations
8. THE Data_Layer SHALL provide a NotificationScheduleRepository with methods for create, findById, findPending, markAsSent, and delete operations
9. THE Data_Layer SHALL export all repository classes from src/services/repositories/ directory
10. THE Data_Layer SHALL implement error handling in all repository methods with descriptive error messages

### Requirement 4

**User Story:** As a developer, I want TanStack Query configured with sensible defaults, so that I can efficiently fetch, cache, and synchronize data with minimal configuration

#### Acceptance Criteria

1. THE Data_Layer SHALL create a Query_Client instance in src/lib/queryClient.ts
2. THE Query_Client SHALL configure a default staleTime of 5 minutes for cached queries
3. THE Query_Client SHALL configure a default cacheTime of 10 minutes for inactive queries
4. THE Query_Client SHALL configure retry logic with 3 attempts and exponential backoff
5. THE Query_Client SHALL configure refetchOnWindowFocus to true for data freshness
6. THE Query_Client SHALL configure refetchOnReconnect to true for offline recovery
7. THE Data_Layer SHALL provide a QueryClientProvider component that wraps the application root
8. THE Data_Layer SHALL define query keys for all entity types following a consistent naming convention

### Requirement 5

**User Story:** As a developer, I want custom React hooks that combine repositories with TanStack Query, so that I can access data with automatic caching and refetching in components

#### Acceptance Criteria

1. THE Data_Layer SHALL provide a useUserProfile hook that returns user profile data with loading and error states
2. THE Data_Layer SHALL provide a useProtocolRuns hook that returns protocol runs for a user with loading and error states
3. THE Data_Layer SHALL provide a useTestSteps hook that returns test steps for a protocol run with loading and error states
4. THE Data_Layer SHALL provide a useSymptomEntries hook that returns symptom entries for a test step with loading and error states
5. THE Data_Layer SHALL provide a useFoodItems hook that returns all food items with loading and error states
6. THE Data_Layer SHALL provide mutation hooks for create, update, and delete operations with optimistic updates
7. THE Data_Layer SHALL implement automatic cache invalidation when mutations succeed
8. THE Data_Layer SHALL export all hooks from src/shared/hooks/ directory

### Requirement 6

**User Story:** As a developer, I want seed data and fixtures for development, so that I can test the application with realistic data without manual data entry

#### Acceptance Criteria

1. THE Data_Layer SHALL provide seed data for at least 10 FoodItem_Entity records covering all FODMAP groups
2. THE Data_Layer SHALL provide seed data for at least 2 UserProfile_Entity records
3. THE Data_Layer SHALL provide seed data for at least 1 complete ProtocolRun_Entity with associated TestStep_Entity records
4. THE Data_Layer SHALL provide seed data for sample SymptomEntry_Entity records
5. THE Data_Layer SHALL provide a seed script that populates the SQLite_Database with all seed data
6. WHEN a developer executes the seed script, THEN THE SQLite_Database SHALL contain all seed data without errors
7. THE Data_Layer SHALL provide fixture functions in src/shared/fixtures/ for generating test data

### Requirement 7

**User Story:** As a developer, I want comprehensive documentation of the offline-first strategy, so that I understand how data synchronization works and how to handle sync conflicts

#### Acceptance Criteria

1. THE Data_Layer SHALL document the offline-first architecture in README.md
2. THE README.md SHALL explain how SQLite_Database serves as the primary data source
3. THE README.md SHALL explain how Supabase_Sync works for remote data persistence
4. THE README.md SHALL document the sync strategy including when sync occurs
5. THE README.md SHALL document potential sync conflict scenarios
6. THE README.md SHALL document planned conflict resolution strategies
7. THE README.md SHALL provide code examples for common data operations
8. THE README.md SHALL document query key naming conventions for TanStack_Query

### Requirement 8

**User Story:** As a developer, I want unit tests for all repository methods, so that I can verify data operations work correctly and catch regressions early

#### Acceptance Criteria

1. THE Data_Layer SHALL provide unit tests for UserProfileRepository covering all CRUD operations
2. THE Data_Layer SHALL provide unit tests for ProtocolRunRepository covering all CRUD operations
3. THE Data_Layer SHALL provide unit tests for TestStepRepository covering all CRUD operations
4. THE Data_Layer SHALL provide unit tests for SymptomEntryRepository covering all CRUD operations
5. THE Data_Layer SHALL provide unit tests for FoodItemRepository covering all CRUD operations
6. THE Data_Layer SHALL use mocked database connections in all repository tests
7. THE Data_Layer SHALL verify error handling in repository tests
8. WHEN a developer executes npm run test, THEN all repository tests SHALL pass without errors
9. THE Data_Layer SHALL achieve at least 80 percent code coverage for repository code

### Requirement 9

**User Story:** As a developer, I want the database schema to support efficient queries, so that the application performs well even with large datasets

#### Acceptance Criteria

1. THE Data_Layer SHALL create an index on UserProfile_Entity email field for fast lookup
2. THE Data_Layer SHALL create an index on ProtocolRun_Entity user_id field for fast user queries
3. THE Data_Layer SHALL create an index on TestStep_Entity protocol_run_id field for fast protocol queries
4. THE Data_Layer SHALL create an index on SymptomEntry_Entity test_step_id field for fast symptom queries
5. THE Data_Layer SHALL create a composite index on SymptomEntry_Entity timestamp and test_step_id for date range queries
6. THE Data_Layer SHALL create an index on NotificationSchedule_Entity scheduled_time field for pending notification queries
7. THE Data_Layer SHALL use appropriate data types for all columns to minimize storage size

### Requirement 10

**User Story:** As a developer, I want proper TypeScript types exported from the data layer, so that I can use entities with full type safety throughout the application

#### Acceptance Criteria

1. THE Data_Layer SHALL export TypeScript types for all entity schemas
2. THE Data_Layer SHALL export TypeScript types for all repository method parameters
3. THE Data_Layer SHALL export TypeScript types for all repository method return values
4. THE Data_Layer SHALL export TypeScript types for all query hook return values
5. THE Data_Layer SHALL export TypeScript types for all mutation hook parameters
6. THE Data_Layer SHALL use strict TypeScript configuration with no implicit any types
7. WHEN a developer imports data layer types, THEN TypeScript SHALL provide accurate autocomplete and type checking
