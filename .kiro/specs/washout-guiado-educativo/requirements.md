# Requirements Document

## Introduction

This feature implements a guided washout period experience with educational content delivery. The Washout Period is a critical phase in the FODMAP reintroduction protocol where users abstain from testing foods to allow their digestive system to reset. The system provides countdown tracking, contextual reminders, and dynamically surfaced educational content (social tips, low-FODMAP recipes) based on user state. Content is managed through a lightweight JSON-based CMS with telemetry tracking for analytics, designed to be easily migrated to Supabase in the future.

## Glossary

- **Washout Period System**: The mobile application component that manages and displays the washout period experience
- **Content Management System (CMS)**: The JSON-based local storage system for educational content
- **Educational Content**: Informational cards including social tips, recipes, and FODMAP guidance
- **User State**: The combination of user attributes including anxiety level, experience level, and current protocol phase
- **Telemetry Service**: The analytics tracking system that records content interaction events
- **Content Surfacing Engine**: The logic system that determines which educational content to display based on user state

## Requirements

### Requirement 1

**User Story:** As a user in a washout period, I want to see a countdown timer, so that I know how much time remains before I can proceed to the next test

#### Acceptance Criteria

1. WHEN the User State indicates an active washout period, THE Washout Period System SHALL display a countdown showing days and hours remaining
2. WHILE the washout period is active, THE Washout Period System SHALL update the countdown display every hour
3. WHEN the countdown reaches zero, THE Washout Period System SHALL notify the user that the washout period is complete
4. THE Washout Period System SHALL display the start date and expected end date of the current washout period

### Requirement 2

**User Story:** As a user during washout, I want to receive contextual reminders, so that I stay compliant with the protocol requirements

#### Acceptance Criteria

1. WHEN the washout period begins, THE Washout Period System SHALL schedule reminder notifications at configured intervals
2. THE Washout Period System SHALL display reminder messages within the washout screen interface
3. WHEN the user has high anxiety level in User State, THE Washout Period System SHALL increase reminder frequency by 50 percent
4. THE Washout Period System SHALL allow users to customize reminder frequency between 1 and 24 hours

### Requirement 3

**User Story:** As a user viewing the washout screen, I want to see relevant educational content cards, so that I can learn helpful information during my waiting period

#### Acceptance Criteria

1. WHEN the washout screen loads, THE Content Surfacing Engine SHALL select between 2 and 5 educational content items based on User State
2. THE Washout Period System SHALL display Educational Content as scrollable cards with title, summary, and full content
3. WHEN a user taps on an educational card, THE Washout Period System SHALL expand the card to show full content
4. THE Washout Period System SHALL support content types including social tips, low-FODMAP recipes, and general FODMAP guidance
5. WHEN the user scrolls through content, THE Washout Period System SHALL load additional relevant content dynamically

### Requirement 4

**User Story:** As a new user in washout, I want to see beginner-focused educational content, so that I can build my understanding of the FODMAP protocol

#### Acceptance Criteria

1. WHEN User State indicates experience level as novice, THE Content Surfacing Engine SHALL prioritize content tagged with beginner difficulty
2. THE Content Surfacing Engine SHALL include at least 60 percent beginner content when User State experience level is novice
3. WHEN User State indicates experience level as intermediate or advanced, THE Content Surfacing Engine SHALL reduce beginner content to maximum 30 percent

### Requirement 5

**User Story:** As a user with high anxiety, I want to see reassuring and supportive content, so that I feel more confident during the washout period

#### Acceptance Criteria

1. WHEN User State indicates anxiety level as high, THE Content Surfacing Engine SHALL prioritize content tagged with anxiety-support category
2. THE Content Surfacing Engine SHALL include at least one anxiety-support content item when User State anxiety level is high
3. THE Content Surfacing Engine SHALL exclude content tagged as potentially-stressful when User State anxiety level is high

### Requirement 6

**User Story:** As a content manager, I want to define educational content in JSON files, so that I can easily add and update content without code changes

#### Acceptance Criteria

1. THE Content Management System SHALL load educational content from JSON files in the src/content/education directory
2. THE Content Management System SHALL validate each content item against a TypeScript schema on application startup
3. WHEN a JSON file contains invalid content structure, THE Content Management System SHALL log validation errors and skip the invalid items
4. THE Content Management System SHALL support content fields including id, title, summary, full content, tags, category, difficulty level, and target anxiety levels
5. THE Content Management System SHALL cache loaded content in memory for performance

### Requirement 7

**User Story:** As a product analyst, I want to track which educational content users read, so that I can understand content effectiveness and user interests

#### Acceptance Criteria

1. WHEN a user views an educational content card for more than 3 seconds, THE Telemetry Service SHALL record a content-viewed event with content id and timestamp
2. WHEN a user expands an educational content card, THE Telemetry Service SHALL record a content-expanded event with content id and timestamp
3. WHEN a user completes reading content by scrolling to the end, THE Telemetry Service SHALL record a content-completed event with content id, timestamp, and time spent
4. THE Telemetry Service SHALL batch telemetry events and persist them locally before syncing to analytics backend
5. THE Telemetry Service SHALL include User State attributes in telemetry events for segmentation analysis

### Requirement 8

**User Story:** As a developer, I want the content system to be migration-ready for Supabase, so that we can move to a cloud CMS without major refactoring

#### Acceptance Criteria

1. THE Content Management System SHALL implement a repository interface that abstracts content storage location
2. THE Content Management System SHALL provide a LocalJsonContentRepository implementation for JSON file storage
3. THE Content Management System SHALL define a SupabaseContentRepository interface with identical methods to LocalJsonContentRepository
4. THE Content Management System SHALL use dependency injection to allow switching between repository implementations
5. THE Content Management System SHALL document the migration path from local JSON to Supabase in code comments
