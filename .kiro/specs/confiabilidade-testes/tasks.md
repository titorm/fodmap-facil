# Implementation Plan

- [ ] 1. Configure Storybook for React Native Web
  - Install Storybook dependencies (@storybook/react-native, @storybook/addon-a11y, @storybook/addon-controls)
  - Create `.storybook/main.js` with React Native Web webpack configuration
  - Create `.storybook/preview.js` with ThemeProvider decorator and global parameters
  - Add `storybook` and `storybook:build` scripts to package.json
  - _Requirements: 1.1_

- [ ] 2. Create component stories for critical UI components
- [ ] 2.1 Create SymptomSlider stories
  - Create `src/features/diary/components/SymptomSlider.stories.tsx`
  - Add stories for all severity levels (None, Mild, Moderate, Severe)
  - Add story for disabled state
  - Add interactive controls for value and disabled props
  - Document component usage and accessibility features
  - _Requirements: 1.2_

- [ ] 2.2 Create DoseCard stories
  - Create `src/features/test-wizard/components/DoseCard.stories.tsx`
  - Add stories for all dose sizes (small, medium, large portions)
  - Add stories for consumed and unconsumed states
  - Add stories with and without food images
  - Add story for disabled state
  - Document portion visualization and consumption tracking
  - _Requirements: 1.3_

- [ ] 2.3 Create ProgressHeader stories
  - Create `src/shared/components/atoms/ProgressHeader.stories.tsx`
  - Add stories for various progress percentages (0%, 25%, 50%, 75%, 100%)
  - Add stories with and without back button
  - Add story demonstrating step progression
  - Document navigation integration patterns
  - _Requirements: 1.4_

- [ ] 3. Enhance MSW handlers for comprehensive AppWrite mocking
- [ ] 3.1 Organize MSW handlers by domain
  - Create `src/shared/mocks/handlers/auth.handlers.ts` for authentication endpoints
  - Create `src/shared/mocks/handlers/database.handlers.ts` for TablesDB CRUD operations
  - Create `src/shared/mocks/handlers/errors.ts` for error scenario handlers
  - Update `src/shared/mocks/handlers.ts` to aggregate all handlers
  - _Requirements: 5.1, 5.2_

- [ ] 3.2 Implement query parsing for database handlers
  - Add query string parsing logic to support AppWrite query syntax
  - Implement filtering logic for equal, notEqual, greaterThan, lessThan operators
  - Implement sorting logic for orderAsc and orderDesc
  - Implement pagination logic for limit and offset
  - Add test coverage for query parsing utilities
  - _Requirements: 5.1_

- [ ] 3.3 Create realistic mock data fixtures
  - Expand `src/shared/fixtures/dataFixtures.ts` with comprehensive test data
  - Create scenario builder pattern for complex protocol states
  - Add edge case fixtures (empty states, error states, boundary conditions)
  - Ensure mock data matches AppWrite schema structure
  - _Requirements: 5.3_

- [ ] 3.4 Add test-specific mock overrides
  - Implement per-test mock data override mechanism
  - Create helper functions for common mock scenarios (network error, auth error, empty data)
  - Document mock override patterns in test utilities
  - _Requirements: 5.5_

- [ ] 4. Achieve 90%+ test coverage for FODMAP engine
- [ ] 4.1 Test sequence generation logic
  - Write tests for standard FODMAP group sequence
  - Write tests for custom group sequence
  - Write tests for next group determination after completion
  - Write tests for sequence validation and error handling
  - _Requirements: 2.2_

- [ ] 4.2 Test tolerance calculation algorithms
  - Write tests for tolerated classification (no symptoms)
  - Write tests for sensitive classification (dose-dependent symptoms)
  - Write tests for trigger classification (severe symptoms on day 1)
  - Write tests for max tolerated portion determination
  - Write tests for trigger portion identification
  - _Requirements: 2.3_

- [ ] 4.3 Test washout period determination
  - Write tests for 3-day washout (no symptoms)
  - Write tests for 7-day washout (moderate symptoms)
  - Write tests for 7-day washout (severe symptoms)
  - Write tests for washout progress tracking
  - Write tests for washout completion detection
  - _Requirements: 2.4_

- [ ] 4.4 Test symptom scoring and analysis
  - Write tests for symptom severity aggregation
  - Write tests for symptom timing analysis
  - Write tests for multi-symptom scenarios
  - Write tests for symptom-free periods
  - _Requirements: 2.5_

- [ ] 4.5 Verify engine coverage meets 90% threshold
  - Run `pnpm test:engine --coverage` to check current coverage
  - Identify uncovered branches and add targeted tests
  - Ensure all edge cases are covered
  - _Requirements: 2.1_

- [ ] 5. Create comprehensive hook tests
- [ ] 5.1 Test useAuth hook
  - Write tests for sign in flow with valid credentials
  - Write tests for sign in flow with invalid credentials
  - Write tests for sign up flow
  - Write tests for sign out flow
  - Write tests for session persistence and restoration
  - Write tests for authentication error handling
  - _Requirements: 3.1_

- [ ] 5.2 Test useProtocolRuns hook
  - Write tests for fetching protocol runs for authenticated user
  - Write tests for creating new protocol run
  - Write tests for updating protocol run state
  - Write tests for protocol run query invalidation
  - Write tests for loading and error states
  - _Requirements: 3.2_

- [ ] 5.3 Test useSymptomEntries hook
  - Write tests for fetching symptom entries by date range
  - Write tests for creating new symptom entry
  - Write tests for updating symptom entry
  - Write tests for deleting symptom entry
  - Write tests for optimistic updates
  - _Requirements: 3.3_

- [ ] 5.4 Test useTestSteps hook
  - Write tests for fetching test steps for current test
  - Write tests for recording dose consumption
  - Write tests for test progression logic
  - Write tests for test completion detection
  - _Requirements: 3.4_

- [ ] 5.5 Test useNotificationSetup hook
  - Write tests for notification permission request
  - Write tests for notification scheduling
  - Write tests for notification cancellation
  - Write tests for quiet hours configuration
  - _Requirements: 3.5_

- [ ] 6. Create integration tests for critical screens
- [ ] 6.1 Test DiaryScreen integration
  - Write test for rendering symptom entries list
  - Write test for opening quick symptom entry modal
  - Write test for creating symptom entry with all fields
  - Write test for symptom entry validation
  - Write test for empty state display
  - Write test for navigation to symptom detail
  - _Requirements: 4.1_

- [ ] 6.2 Test TestDayScreen integration
  - Write test for displaying current dose information
  - Write test for confirming dose consumption
  - Write test for recording symptoms after dose
  - Write test for navigation to next day
  - Write test for test completion flow
  - _Requirements: 4.2_

- [ ] 6.3 Test ReportsScreen integration
  - Write test for loading and displaying metrics summary
  - Write test for rendering symptom timeline chart
  - Write test for rendering tolerance chart
  - Write test for test history list display
  - Write test for PDF generation trigger
  - Write test for loading states and skeletons
  - _Requirements: 4.3_

- [ ] 6.4 Test NotificationSettingsScreen integration
  - Write test for displaying current notification preferences
  - Write test for toggling notification types
  - Write test for configuring quiet hours
  - Write test for permission request flow
  - Write test for preference persistence
  - _Requirements: 4.4_

- [ ] 6.5 Verify navigation flows in integration tests
  - Write test for tab navigation between main screens
  - Write test for stack navigation in test wizard
  - Write test for modal presentation and dismissal
  - Write test for deep linking navigation
  - _Requirements: 4.5_

- [ ] 7. Create test utilities and helpers
- [ ] 7.1 Create custom render function with providers
  - Implement `renderWithProviders` in `src/shared/test-utils/render.tsx`
  - Include QueryClientProvider with test configuration
  - Include ThemeProvider for consistent styling
  - Include NavigationContainer for screen tests
  - Export re-exports from @testing-library/react-native
  - _Requirements: 5.4_

- [ ] 7.2 Create custom test matchers
  - Implement `toHaveSymptomSeverity` matcher
  - Implement `toHaveToleranceStatus` matcher
  - Implement `toBeInWashoutPeriod` matcher
  - Register custom matchers in jest.setup.js
  - _Requirements: 5.4_

- [ ] 7.3 Create test data builders
  - Implement ProtocolScenarioBuilder for complex protocol states
  - Implement SymptomEntryBuilder for symptom test data
  - Implement TestStepBuilder for dose record test data
  - Document builder patterns in test utilities README
  - _Requirements: 5.3_

- [ ] 8. Configure Jest with multiple config files
- [ ] 8.1 Update main Jest configuration
  - Update `jest.config.js` with coverage thresholds (80% global, 90% engine)
  - Configure test match patterns to exclude e2e tests
  - Add module name mapper for path aliases
  - Configure transform ignore patterns for React Native modules
  - _Requirements: 6.1, 6.2_

- [ ] 8.2 Create engine-specific Jest config
  - Create `jest.config.engine.js` for engine-only tests
  - Configure to run only tests in `src/engine/**/__tests__`
  - Set coverage collection to engine files only
  - _Requirements: 6.3_

- [ ] 8.3 Create integration test Jest config
  - Create `jest.config.integration.js` for integration tests
  - Configure to run only `*.integration.test.tsx` files
  - Increase test timeout to 10 seconds
  - _Requirements: 6.5_

- [ ] 8.4 Add npm scripts for test execution
  - Add `test:watch` script for development watch mode
  - Add `test:ci` script for CI with coverage and maxWorkers
  - Add `test:engine` script using engine config
  - Add `test:hooks` script for hook tests only
  - Add `test:integration` script using integration config
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 9. Set up CI/CD pipeline with GitHub Actions
- [ ] 9.1 Create GitHub Actions workflow file
  - Create `.github/workflows/ci.yml`
  - Configure workflow to run on pull requests and pushes to main/develop
  - Set up Node.js 18 with pnpm caching
  - _Requirements: 7.1_

- [ ] 9.2 Add test execution steps to workflow
  - Add step for installing dependencies with frozen lockfile
  - Add step for TypeScript type checking
  - Add step for ESLint checks
  - Add step for running all tests with coverage
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 9.3 Configure coverage reporting
  - Add step for uploading coverage to Codecov
  - Add step for commenting PR with coverage report using lcov-reporter-action
  - Configure coverage thresholds as CI quality gates
  - _Requirements: 7.4_

- [ ] 9.4 Set up CI quality gates
  - Configure workflow to fail if tests fail
  - Configure workflow to fail if linting fails
  - Configure workflow to fail if type checking fails
  - Configure workflow to fail if coverage drops below thresholds
  - _Requirements: 7.5_

- [ ]\* 10. Optional: Configure Detox for e2e testing
- [ ]\* 10.1 Install and configure Detox
  - Install Detox dependencies (detox, detox-cli)
  - Create `.detoxrc.js` configuration file
  - Configure iOS simulator and Android emulator settings
  - Add `test:e2e` and `test:e2e:build` scripts to package.json
  - _Requirements: 8.4_

- [ ]\* 10.2 Create e2e test for onboarding flow
  - Create `__e2e__/onboarding.e2e.ts`
  - Write test for completing readiness assessment
  - Write test for accepting disclaimer
  - Write test for completing onboarding slides
  - Write test for starting first protocol
  - _Requirements: 8.1_

- [ ]\* 10.3 Create e2e test for symptom entry
  - Create `__e2e__/symptom-entry.e2e.ts`
  - Write test for navigating to diary screen
  - Write test for opening symptom entry modal
  - Write test for selecting symptom type and severity
  - Write test for saving symptom entry
  - Write test for verifying entry appears in list
  - _Requirements: 8.2_

- [ ]\* 10.4 Create e2e test for starting reintroduction test
  - Create `__e2e__/start-test.e2e.ts`
  - Write test for navigating to reintroduction screen
  - Write test for selecting food group
  - Write test for starting test
  - Write test for confirming first dose
  - _Requirements: 8.3_

- [ ]\* 10.5 Document Detox setup process
  - Create `docs/E2E_TESTING.md` with installation instructions
  - Document iOS simulator setup
  - Document Android emulator setup
  - Document running e2e tests locally and in CI
  - _Requirements: 8.5_

- [ ] 11. Create testing documentation
  - Create `docs/TESTING_GUIDE.md` with comprehensive testing documentation
  - Document test organization and naming conventions
  - Document how to run different test suites
  - Document how to write unit, integration, and e2e tests
  - Document MSW mock usage patterns
  - Document coverage requirements and how to check coverage
  - Document CI/CD pipeline and quality gates
  - Add examples for common testing scenarios
