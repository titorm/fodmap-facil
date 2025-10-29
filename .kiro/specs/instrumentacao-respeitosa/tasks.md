# Implementation Plan

- [ ] 1. Create core analytics types and configuration
  - Define TypeScript types for events, context, and configuration
  - Create analytics configuration file with environment variable support
  - Define approved event types and their property schemas
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.2_

- [ ] 2. Implement Consent Manager
  - [ ] 2.1 Create ConsentManager class with state management
    - Implement getConsentState, setConsent, and hasConsent methods
    - Add consent and revocation timestamp tracking
    - _Requirements: 1.1, 1.2, 1.4_

  - [ ] 2.2 Add AsyncStorage persistence for consent state
    - Implement load, save, and clear methods
    - Handle storage errors gracefully
    - _Requirements: 1.4, 1.5, 2.5_

- [ ] 3. Implement Event Validator
  - [ ] 3.1 Create EventValidator class with whitelist validation
    - Implement isValidEvent method with approved event list
    - Add validateProperties method for property validation
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 5.2_

  - [ ] 3.2 Add PII sanitization logic
    - Implement sanitizeValue for recursive sanitization
    - Create removePII method to strip identifying information
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 4.6_

- [ ] 4. Implement Event Enricher
  - [ ] 4.1 Create EventEnricher class with context generation
    - Implement enrich method to add context to events
    - Generate anonymous User ID with AsyncStorage persistence
    - Generate session ID that refreshes on app launch
    - _Requirements: 4.1, 5.3_

  - [ ] 4.2 Add platform and locale detection
    - Use expo-constants for app version and platform
    - Use expo-localization for locale detection
    - Format timestamps in ISO 8601
    - _Requirements: 5.3_

- [ ] 5. Implement Event Queue
  - [ ] 5.1 Create EventQueue class with FIFO operations
    - Implement enqueue, dequeue, and peek methods
    - Add size and clear methods
    - _Requirements: 5.4, 7.5_

  - [ ] 5.2 Add queue size limits and cleanup
    - Enforce maximum queue size of 1000 events
    - Implement removeOldEvents to discard events older than 7 days
    - Drop oldest events when queue is full
    - _Requirements: 7.4, 7.5_

  - [ ] 5.3 Add AsyncStorage persistence for queue
    - Implement load and save methods
    - Handle storage errors gracefully
    - _Requirements: 5.4_

- [ ] 6. Implement Event Transmitter
  - [ ] 6.1 Create EventTransmitter class with network transmission
    - Implement transmit and transmitBatch methods
    - Use NetInfo to check connectivity before transmission
    - _Requirements: 5.5, 7.1, 7.2_

  - [ ] 6.2 Add retry logic with exponential backoff
    - Implement shouldRetry method with max 6 attempts
    - Create getBackoffDelay with exponential backoff (1s, 2s, 4s, 8s, 16s, 32s)
    - Track attempt count in queued events
    - _Requirements: 7.3_

- [ ] 7. Implement Analytics Service
  - [ ] 7.1 Create AnalyticsService singleton class
    - Implement initialize method with config loading
    - Wire together ConsentManager, EventValidator, EventEnricher, EventQueue, and EventTransmitter
    - _Requirements: 1.1, 5.1_

  - [ ] 7.2 Implement track method with full event flow
    - Check consent before tracking
    - Validate event with EventValidator
    - Enrich event with EventEnricher
    - Queue event with EventQueue
    - Trigger transmission if online
    - _Requirements: 1.1, 1.2, 5.1, 5.2, 5.3, 5.4_

  - [ ] 7.3 Add consent management methods
    - Implement hasConsent, grantConsent, and revokeConsent
    - Clear queue when consent is revoked
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.3_

  - [ ] 7.4 Add debug and lifecycle methods
    - Implement getDebugInfo and getRecentEvents for debugging
    - Add flush method to force transmission
    - Create reset method for full cleanup
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ] 7.5 Add error handling with AnalyticsError class
    - Create custom error class with category and recoverable flag
    - Wrap all operations in try-catch to prevent crashes
    - Log errors without throwing to application code
    - _Requirements: 7.1, 7.2_

- [ ] 8. Create Analytics Store with Zustand
  - Create analyticsStore.ts with consent state management
  - Add setConsentGranted and setConsentPromptShown actions
  - Implement toggleAnalytics action that updates both store and service
  - Persist consent prompt state to avoid repeated prompts
  - _Requirements: 1.3, 2.1, 2.2, 2.4_

- [ ] 9. Create consent prompt component
  - [ ] 9.1 Create AnalyticsConsentPrompt component
    - Display clear explanation of data collection
    - Show what data is collected and why
    - Provide accept and decline buttons
    - _Requirements: 1.3_

  - [ ] 9.2 Integrate consent prompt into onboarding flow
    - Show prompt after disclaimer screen
    - Update analytics store on user decision
    - Initialize analytics service after consent
    - _Requirements: 1.3, 1.4_

- [ ] 10. Add analytics toggle to settings
  - [ ] 10.1 Create analytics settings section in ProfileScreen
    - Add toggle switch for analytics opt-out
    - Display current consent status
    - Show link to privacy policy
    - _Requirements: 2.1, 2.2, 2.4, 2.5_

  - [ ] 10.2 Wire toggle to analytics service
    - Call revokeConsent when toggle is disabled
    - Call grantConsent when toggle is enabled
    - Update UI reactively with store state
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 11. Instrument key user events
  - [ ] 11.1 Add onboarding_complete event
    - Track in OnboardingScreen when user completes onboarding
    - Include duration_seconds and completed_steps properties
    - _Requirements: 3.1_

  - [ ] 11.2 Add test_started event
    - Track in test wizard when user starts a reintroduction test
    - Include food_group and test_type properties
    - _Requirements: 3.2_

  - [ ] 11.3 Add dose_logged event
    - Track in test wizard when user logs a food dose
    - Include food_group, dose_level, and day_number properties
    - _Requirements: 3.3_

  - [ ] 11.4 Add symptom_logged event
    - Track in DiaryScreen when user logs symptoms
    - Include symptom_count, severity_level (aggregated), and has_notes properties
    - _Requirements: 3.4_

  - [ ] 11.5 Add washout_started event
    - Track in washout flow when user starts a washout period
    - Include duration_days and reason properties
    - _Requirements: 3.5_

  - [ ] 11.6 Add report_exported event
    - Track in ReportsScreen when user exports a PDF report
    - Include format, test_count, and date_range_days properties
    - _Requirements: 3.6_

  - [ ] 11.7 Add paywall events
    - Track paywall_viewed when premium features are shown
    - Track paywall_purchased when user completes purchase
    - Include relevant properties for each event
    - _Requirements: 3.7, 3.8_

- [ ] 12. Initialize analytics in App.tsx
  - Import and initialize AnalyticsService on app startup
  - Load consent state from storage
  - Start background transmission worker if consent is granted
  - Handle initialization errors gracefully
  - _Requirements: 1.1, 2.4_

- [ ]\* 13. Create debug view for analytics
  - [ ]\* 13.1 Create AnalyticsDebugScreen component
    - Display anonymous User ID and Session ID
    - Show current consent status
    - List recent events with properties
    - Add button to clear queue
    - _Requirements: 8.1, 8.2, 8.3, 8.4_

  - [ ]\* 13.2 Add debug screen to developer menu
    - Only show in development builds or when explicitly enabled
    - Add navigation route for debug screen
    - _Requirements: 8.5_

- [ ] 14. Create analytics documentation
  - [ ] 14.1 Add analytics section to README
    - Document what data is collected
    - Explain anonymization techniques
    - List all tracked events and their purposes
    - Describe consent and opt-out mechanisms
    - Confirm no PII is collected
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [ ] 14.2 Create ANALYTICS_POLICY.md
    - Detail privacy and compliance considerations
    - List GDPR, CCPA, HIPAA compliance measures
    - Provide data collection policy
    - Include anonymization techniques
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]\* 15. Write unit tests for core components
  - [ ]\* 15.1 Write ConsentManager tests
    - Test consent state persistence
    - Test grant/revoke operations
    - Test storage failure handling
    - _Requirements: 1.1, 1.2, 1.4, 1.5_

  - [ ]\* 15.2 Write EventValidator tests
    - Test valid event name validation
    - Test invalid event rejection
    - Test PII sanitization
    - Test property type validation
    - _Requirements: 4.2, 4.3, 4.4, 4.5, 5.2_

  - [ ]\* 15.3 Write EventEnricher tests
    - Test context generation
    - Test User ID persistence
    - Test Session ID regeneration
    - Test timestamp formatting
    - _Requirements: 4.1, 5.3_

  - [ ]\* 15.4 Write EventQueue tests
    - Test FIFO ordering
    - Test size limits
    - Test old event cleanup
    - Test persistence operations
    - _Requirements: 5.4, 7.4, 7.5_

  - [ ]\* 15.5 Write EventTransmitter tests
    - Test batch transmission
    - Test retry logic
    - Test exponential backoff
    - Test network status checking
    - _Requirements: 5.5, 7.2, 7.3_

- [ ]\* 16. Write integration tests
  - [ ]\* 16.1 Write end-to-end event flow test
    - Test track → validate → enrich → queue → transmit flow
    - Verify event format at each stage
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]\* 16.2 Write consent flow test
    - Test no tracking without consent
    - Test tracking starts after consent
    - Test tracking stops after revocation
    - Test queue cleared on revocation
    - _Requirements: 1.1, 1.2, 1.5, 2.2, 2.3_

  - [ ]\* 16.3 Write offline behavior test
    - Test events queued when offline
    - Test events transmitted when online
    - Test queue persistence across app restarts
    - _Requirements: 5.4, 5.5_
