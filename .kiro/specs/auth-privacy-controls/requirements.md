# Requirements Document

## Introduction

This feature implements authentication and privacy controls for the FODMAP application, enabling users to securely access the app through email-based magic links or OAuth providers (Google/Apple), and providing comprehensive data privacy controls including data export, account deletion, and consent management in compliance with data protection regulations (GDPR, LGPD).

## Glossary

- **Authentication System**: The component responsible for verifying user identity and managing access to the application
- **Magic Link**: A passwordless authentication method where users receive a time-limited URL via email to sign in
- **OAuth Provider**: Third-party authentication services (Google, Apple) that allow users to sign in using existing accounts
- **Privacy Service**: The system component that handles user data export, deletion, and consent management
- **Data Export**: The process of generating a complete JSON file containing all user data stored in the system
- **Account Deletion**: The irreversible process of removing a user account and all associated personal data
- **Consent Manager**: The component that tracks and manages user permissions for data processing activities
- **Route Guard**: A navigation protection mechanism that restricts access to authenticated routes
- **Legal Documents**: Terms of Service and Privacy Policy documents in Portuguese (pt-BR)

## Requirements

### Requirement 1

**User Story:** As a new user, I want to sign in using my email address with a magic link, so that I can access the app securely without managing passwords

#### Acceptance Criteria

1. WHEN a user enters a valid email address on the sign-in screen, THE Authentication System SHALL send a magic link to that email address within 30 seconds
2. WHEN a user clicks a valid magic link, THE Authentication System SHALL authenticate the user and redirect them to the main application screen
3. IF a magic link is older than 15 minutes, THEN THE Authentication System SHALL reject the authentication attempt and display an expiration message
4. THE Authentication System SHALL validate email format before sending magic links
5. WHEN authentication fails, THE Authentication System SHALL display a clear error message to the user

### Requirement 2

**User Story:** As a user, I want to sign in using my Google or Apple account, so that I can quickly access the app using my existing credentials

#### Acceptance Criteria

1. WHERE OAuth is configured, THE Authentication System SHALL display Google and Apple sign-in buttons on the sign-in screen
2. WHEN a user taps the Google sign-in button, THE Authentication System SHALL initiate the Google OAuth flow
3. WHEN a user taps the Apple sign-in button, THE Authentication System SHALL initiate the Apple OAuth flow
4. WHEN OAuth authentication succeeds, THE Authentication System SHALL create or retrieve the user account and redirect to the main application
5. IF OAuth authentication fails, THEN THE Authentication System SHALL display an error message and allow the user to retry

### Requirement 3

**User Story:** As a user, I want to export all my data in JSON format, so that I can keep a personal copy or transfer it to another service

#### Acceptance Criteria

1. WHEN a user requests data export from the profile screen, THE Privacy Service SHALL generate a complete JSON file containing all user data within 60 seconds
2. THE Privacy Service SHALL include all personal data, symptom entries, test results, protocol runs, and preferences in the export
3. WHEN export generation completes, THE Privacy Service SHALL provide a download or share option for the JSON file
4. THE Privacy Service SHALL log all data export requests with timestamp and user identifier
5. IF export generation fails, THEN THE Privacy Service SHALL display an error message and allow the user to retry

### Requirement 4

**User Story:** As a user, I want to permanently delete my account and all associated data, so that I can exercise my right to erasure

#### Acceptance Criteria

1. WHEN a user initiates account deletion from the profile screen, THE Privacy Service SHALL display a confirmation dialog explaining the irreversible nature of the action
2. WHEN a user confirms account deletion, THE Privacy Service SHALL require re-authentication before proceeding
3. WHEN deletion is confirmed and authenticated, THE Privacy Service SHALL permanently remove all user data from the database within 5 minutes
4. THE Privacy Service SHALL delete all associated records including symptom entries, test results, protocol runs, notifications, and preferences
5. WHEN deletion completes, THE Privacy Service SHALL sign out the user and redirect to the sign-in screen
6. THE Privacy Service SHALL log all deletion requests with timestamp and user identifier for compliance purposes

### Requirement 5

**User Story:** As a user, I want to view and manage my data processing consents, so that I can control how my information is used

#### Acceptance Criteria

1. THE Consent Manager SHALL display all active consent categories on the profile screen
2. WHEN a user views consent settings, THE Consent Manager SHALL show the purpose and legal basis for each consent type
3. WHEN a user revokes a consent, THE Consent Manager SHALL update the consent status immediately
4. THE Consent Manager SHALL record consent changes with timestamp and version information
5. WHERE consent is required for app functionality, THE Consent Manager SHALL display a warning before allowing revocation

### Requirement 6

**User Story:** As a user, I want to read the Terms of Service and Privacy Policy in Portuguese, so that I understand my rights and the app's data practices

#### Acceptance Criteria

1. THE Legal Documents SHALL be available in Portuguese (pt-BR) language
2. WHEN a user accesses legal documents from the profile screen, THE Authentication System SHALL display the current version of Terms of Service and Privacy Policy
3. THE Legal Documents SHALL include sections on data collection, usage, storage, user rights, and contact information
4. THE Legal Documents SHALL be versioned with effective dates
5. WHEN legal documents are updated, THE Authentication System SHALL notify users and request re-acceptance where required

### Requirement 7

**User Story:** As an authenticated user, I want protected screens to be accessible only when I'm signed in, so that my data remains secure

#### Acceptance Criteria

1. WHEN an unauthenticated user attempts to access a protected route, THE Route Guard SHALL redirect them to the sign-in screen
2. WHEN a user's session expires, THE Route Guard SHALL redirect them to the sign-in screen
3. THE Route Guard SHALL allow access to protected routes only for authenticated users with valid sessions
4. THE Route Guard SHALL preserve the intended destination URL and redirect users there after successful authentication
5. THE Route Guard SHALL allow access to public routes (sign-in, legal documents) without authentication

### Requirement 8

**User Story:** As a developer, I want integration tests for export and delete flows, so that I can verify privacy controls work correctly

#### Acceptance Criteria

1. THE Privacy Service SHALL have integration tests that verify complete data export functionality using mocked data
2. THE Privacy Service SHALL have integration tests that verify complete account deletion functionality using mocked data
3. THE integration tests SHALL verify that exported JSON contains all expected data fields
4. THE integration tests SHALL verify that deletion removes all user records from the database
5. THE integration tests SHALL verify error handling for export and deletion failures
