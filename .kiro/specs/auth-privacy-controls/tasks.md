# Implementation Plan

- [ ] 1. Set up Appwrite authentication configuration and database tables
  - Configure Appwrite project for Magic URL authentication
  - Set up OAuth providers (Google and Apple) in Appwrite console
  - Create `user_consents` table with appropriate schema and indexes
  - Create `privacy_audit_logs` table with appropriate schema and indexes
  - Create `legal_documents` table with appropriate schema and indexes
  - Update environment variables with new table IDs
  - _Requirements: 1.1, 2.1, 2.2, 5.1, 6.1_

- [ ] 2. Implement AuthService with magic link and OAuth support
  - [ ] 2.1 Create AuthService class with magic link methods
    - Implement `sendMagicLink()` method with email validation
    - Implement `verifyMagicLink()` method for token verification
    - Add 15-minute expiration handling for magic links
    - Add error handling and user-friendly error messages
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ] 2.2 Add OAuth authentication methods
    - Implement `signInWithGoogle()` method
    - Implement `signInWithApple()` method
    - Add OAuth error handling and retry logic
    - Configure OAuth redirect URIs and state validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ] 2.3 Implement session management and re-authentication
    - Implement `getCurrentUser()` method
    - Implement `signOut()` method with session cleanup
    - Implement `reauthenticate()` method for sensitive operations
    - Add session expiration detection
    - _Requirements: 4.2, 7.2_

  - [ ]\* 2.4 Write unit tests for AuthService
    - Test magic link email validation
    - Test magic link expiration handling
    - Test OAuth flow initialization
    - Test session state management
    - Test re-authentication flow
    - _Requirements: 1.1, 1.3, 2.1, 2.2_

- [ ] 3. Implement PrivacyService for data export and account deletion
  - [ ] 3.1 Create PrivacyService class with data export functionality
    - Implement `exportUserData()` method to fetch all user data
    - Query all tables (user_profiles, protocol_runs, test_steps, symptom_entries, etc.)
    - Aggregate data into ExportedUserData JSON structure
    - Add export metadata (timestamp, version)
    - Implement rate limiting (1 export per hour)
    - _Requirements: 3.1, 3.2, 3.4_

  - [ ] 3.2 Add file sharing and download capabilities
    - Implement `shareExportedData()` method using Expo Sharing
    - Use Expo FileSystem for temporary file storage
    - Add automatic file cleanup after sharing
    - Handle platform-specific sharing differences
    - _Requirements: 3.3_

  - [ ] 3.3 Implement account deletion functionality
    - Implement `deleteAccount()` method with cascading deletion
    - Delete records from all user-related tables
    - Add confirmation and re-authentication checks
    - Implement sign-out after successful deletion
    - Add error handling and rollback logic
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [ ] 3.4 Add privacy audit logging
    - Implement `logPrivacyEvent()` method
    - Log export requests with timestamp and user ID
    - Log deletion requests with timestamp and user ID
    - Store logs in privacy_audit_logs table
    - _Requirements: 3.4, 4.6_

  - [ ]\* 3.5 Write integration tests for PrivacyService
    - Test complete data export with mocked data
    - Verify exported JSON structure and completeness
    - Test account deletion with cascading deletes
    - Verify all user records are removed
    - Test audit log creation for export and deletion
    - Test error handling for failed operations
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 4. Implement ConsentManager for consent tracking
  - [ ] 4.1 Create ConsentManager class with consent types
    - Define consent type constants (essential, analytics, marketing, personalization)
    - Implement `getConsentTypes()` method
    - Implement `getUserConsents()` method to fetch user consent records
    - Add consent versioning support
    - _Requirements: 5.1, 5.2_

  - [ ] 4.2 Add consent update and validation methods
    - Implement `updateConsent()` method with version tracking
    - Implement `hasConsent()` method for consent validation
    - Implement `requiresConsent()` method for feature checks
    - Add warning logic for required consents
    - Record consent changes with timestamps
    - _Requirements: 5.3, 5.4, 5.5_

  - [ ]\* 4.3 Write unit tests for ConsentManager
    - Test consent type retrieval
    - Test consent update logic
    - Test consent validation
    - Test version tracking
    - Test required consent warnings
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [ ] 5. Create route guards for authentication protection
  - [ ] 5.1 Implement AuthGuard component
    - Create HOC for protecting authenticated routes
    - Implement authentication check using useAuth hook
    - Add redirect logic for unauthenticated users
    - Implement intended route preservation in AsyncStorage
    - Add post-authentication redirect to intended route
    - _Requirements: 7.1, 7.3, 7.4_

  - [ ] 5.2 Update AppNavigator with route guards
    - Wrap protected screens with AuthGuard
    - Add session expiration handling
    - Ensure public routes remain accessible
    - Test navigation flow with authentication
    - _Requirements: 7.1, 7.2, 7.5_

  - [ ]\* 5.3 Write integration tests for route guards
    - Test unauthenticated user redirect
    - Test authenticated user access
    - Test session expiration redirect
    - Test intended route preservation
    - Test public route accessibility
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [ ] 6. Update SignInScreen with magic link and OAuth options
  - [ ] 6.1 Enhance SignInScreen UI
    - Add "Send Magic Link" button
    - Add email input with validation
    - Add OAuth buttons (Google, Apple) with conditional rendering
    - Add loading states for magic link sending
    - Add success message when magic link is sent
    - Add error message display
    - Add link to legal documents
    - _Requirements: 1.1, 1.4, 1.5, 2.1, 2.2_

  - [ ] 6.2 Integrate AuthService with SignInScreen
    - Connect "Send Magic Link" button to AuthService.sendMagicLink()
    - Connect OAuth buttons to AuthService OAuth methods
    - Handle authentication success and navigation
    - Handle authentication errors with user-friendly messages
    - _Requirements: 1.1, 1.2, 1.5, 2.3, 2.4, 2.5_

  - [ ] 6.3 Add deep linking support for magic link verification
    - Configure deep linking in app.json
    - Update navigation linking configuration
    - Create deep link handler for magic link verification
    - Test magic link flow end-to-end
    - _Requirements: 1.2, 1.3_

- [ ] 7. Enhance ProfileScreen with privacy controls
  - [ ] 7.1 Add data export UI to ProfileScreen
    - Add "Export My Data" button
    - Add loading state during export
    - Show success message after export
    - Handle export errors with retry option
    - Integrate with PrivacyService.exportUserData()
    - _Requirements: 3.1, 3.3, 3.5_

  - [ ] 7.2 Add account deletion UI to ProfileScreen
    - Add "Delete Account" button
    - Create confirmation dialog with warning message
    - Add re-authentication prompt before deletion
    - Show loading state during deletion
    - Handle deletion success with sign-out and redirect
    - Handle deletion errors with user-friendly messages
    - Integrate with PrivacyService.deleteAccount()
    - _Requirements: 4.1, 4.2, 4.3, 4.5_

  - [ ] 7.3 Add consent management navigation
    - Add "Manage Consents" button
    - Navigate to ConsentManagementScreen
    - Add links to Terms of Service and Privacy Policy
    - _Requirements: 5.1, 6.2_

- [ ] 8. Create ConsentManagementScreen
  - [ ] 8.1 Build ConsentManagementScreen UI
    - Display list of consent types with descriptions
    - Add toggle switches for each consent
    - Show purpose and legal basis for each consent
    - Add warning messages for required consents
    - Add save/cancel actions
    - _Requirements: 5.1, 5.2, 5.5_

  - [ ] 8.2 Integrate ConsentManager with UI
    - Fetch user consents on screen load
    - Handle consent toggle changes
    - Save consent updates to database
    - Show success/error messages
    - Record consent changes with timestamps
    - _Requirements: 5.3, 5.4_

- [ ] 9. Create LegalDocumentsScreen
  - [ ] 9.1 Build LegalDocumentsScreen UI
    - Create tabbed interface for Terms and Privacy
    - Add scrollable document content area
    - Display version and effective date
    - Add accept/decline actions for first-time users
    - Style document content for readability
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ] 9.2 Create legal document content files
    - Write Terms of Service in Portuguese (pt-BR)
    - Write Privacy Policy in Portuguese (pt-BR)
    - Include all required LGPD sections
    - Add version numbers and effective dates
    - Store documents in src/content/legal/
    - _Requirements: 6.1, 6.3, 6.4, 6.5_

  - [ ] 9.3 Integrate legal documents with Appwrite
    - Fetch legal documents from legal_documents table
    - Handle document versioning
    - Track user acceptance of legal documents
    - Notify users of document updates
    - _Requirements: 6.2, 6.4, 6.5_

- [ ] 10. Add localization for new features
  - Add Portuguese translations for auth features (magic link, OAuth)
  - Add Portuguese translations for privacy features (export, delete, consents)
  - Add Portuguese translations for legal documents screen
  - Add error message translations
  - Update i18n locale files (en.json, pt.json)
  - _Requirements: 1.5, 2.5, 3.3, 3.5, 4.5, 5.5, 6.1_

- [ ] 11. Update environment configuration
  - Add new Appwrite table IDs to .env.example
  - Document OAuth configuration requirements
  - Document deep linking configuration
  - Update README with setup instructions
  - _Requirements: 1.1, 2.1, 2.2_

- [ ] 12. Wire everything together and test complete flows
  - Test magic link authentication end-to-end
  - Test OAuth authentication end-to-end
  - Test data export flow
  - Test account deletion flow
  - Test consent management flow
  - Test route guards with authentication
  - Test legal documents display
  - Verify all error handling works correctly
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 3.1, 3.3, 4.1, 4.3, 5.1, 5.3, 6.2, 7.1, 7.2_
