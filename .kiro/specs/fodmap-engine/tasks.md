# Implementation Plan

- [x] 1. Create type definitions with Zod schemas
  - Create src/engine/fodmapEngine/types.ts file
  - Define FODMAPGroupSchema, SymptomSeveritySchema, ToleranceStatusSchema, ProtocolPhaseSchema enums
  - Define SymptomRecordSchema with timestamp, severity, type, and notes
  - Define DoseRecordSchema with date, dayNumber, foodItem, portionSize, portionAmount, and symptoms array
  - Define FoodTestResultSchema with foodItem, fodmapGroup, doses, toleranceStatus, portions, and dates
  - Define WashoutPeriodSchema with startDate, endDate, durationDays, and reason
  - Define ProtocolStateSchema with userId, startDate, groupSequence, completedTests, currentTest, currentWashout, and phase
  - Define NextActionSchema with action, phase, current state fields, message, instructions, nextMilestone, washoutDaysRemaining, summary, and errors
  - Export TypeScript types derived from all Zod schemas
  - _Requirements: 2.1, 2.2, 2.3, 2.5_

- [x] 2. Create protocol configuration constants
  - Create src/engine/fodmapEngine/config.ts file
  - Define STANDARD_GROUP_SEQUENCE array with ordered FODMAP groups
  - Define RECOMMENDED_FOODS record mapping each group to food arrays
  - Define PORTION_PROGRESSION record mapping each group to [small, medium, large] portions
  - Define WASHOUT_DURATION record mapping symptom severity to days
  - Export all configuration constants
  - _Requirements: 3.1, 4.1, 4.2, 4.3, 4.4, 4.5, 6.1, 6.2, 6.3_

- [x] 3. Implement symptom analysis functions
  - Create src/engine/fodmapEngine/symptoms.ts file
  - Implement analyzeSymptoms function that takes SymptomRecord array and returns overall SymptomSeverity
  - Handle empty symptoms array returning 'none'
  - Implement severity priority logic (severe > moderate > mild > none)
  - Implement shouldStopTest function that takes severity and dayNumber, returns boolean
  - Return true for severe symptoms on any day
  - Return true for moderate symptoms on day 1
  - Return false otherwise
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.3, 7.4_

- [x] 4. Implement tolerance classification logic
  - Create src/engine/fodmapEngine/tolerance.ts file
  - Implement classifyTolerance function that takes DoseRecord array
  - Return 'untested' status for empty doses array
  - Analyze each dose to determine symptom severity
  - Find first dose with moderate or severe symptoms
  - Return 'tolerated' with maxToleratedPortion if all doses have none/mild symptoms
  - Return 'trigger' with triggerPortion if any dose has severe symptoms
  - Return 'sensitive' with maxToleratedPortion and triggerPortion for moderate symptoms
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [x] 5. Implement washout period calculations
  - Create src/engine/fodmapEngine/washout.ts file
  - Implement calculateWashout function that takes SymptomSeverity and startDate
  - Use WASHOUT_DURATION config to determine days (3 for none/mild, 7 for moderate/severe)
  - Calculate endDate by adding duration days to startDate
  - Return WashoutPeriod object with all fields
  - Implement checkWashoutStatus function that takes WashoutPeriod and current date
  - Calculate days remaining using date arithmetic
  - Return object with complete boolean and daysRemaining number
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 6. Implement sequence management functions
  - Create src/engine/fodmapEngine/sequence.ts file
  - Implement getGroupSequence function that returns custom or standard sequence
  - Implement getNextGroup function that finds first untested group in sequence
  - Return null if all groups completed
  - Implement getRecommendedFoods function that returns food array for a group
  - Implement getPortionForDay function that returns portion for specific day (1-3)
  - Throw error for invalid day numbers
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.2, 4.3, 4.4_

- [x] 7. Implement state validation logic
  - Create src/engine/fodmapEngine/validation.ts file
  - Implement validateProtocolState function that checks for invalid states
  - Check for conflicting currentTest and currentWashout
  - Validate dose day numbers are sequential
  - Validate washout dates (end after start)
  - Validate phase consistency with current state
  - Return object with valid boolean and errors array
  - _Requirements: 12.4, 12.5_

- [x] 8. Implement washout period handler
  - Create src/engine/fodmapEngine/handlers.ts file
  - Implement handleWashoutPeriod function that takes ProtocolState and current date
  - Check washout status using checkWashoutStatus
  - If not complete, return NextAction with 'continue_washout' action
  - Include washoutDaysRemaining and instructions for low-FODMAP diet
  - Include nextMilestone with washout end date
  - If complete, call determineNextTest to get next action
  - _Requirements: 6.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 9. Implement current test handler
  - Add handleCurrentTest function to handlers.ts
  - Check if last dose had symptoms requiring test stop using shouldStopTest
  - If stopping, calculate washout and return 'continue_washout' action
  - If continuing, determine next day number (completedDoses + 1)
  - If next day > 3, test is complete, calculate washout and return action
  - Otherwise, get portion for next day and return 'start_dose' action
  - Include all required fields: currentGroup, currentFood, currentDayNumber, recommendedPortion
  - Include clear instructions for the user
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 7.2, 7.3, 7.4, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 10. Implement next test determination
  - Add determineNextTest function to handlers.ts
  - Call getNextGroup to find next untested group
  - If no next group, generate summary and return 'protocol_complete' action
  - If next group exists, get first recommended food
  - Get portion for day 1
  - Return 'start_next_group' action with all required fields
  - Include instructions for starting new group
  - _Requirements: 3.3, 3.4, 3.5, 11.1, 11.2, 11.3, 11.4, 11.5_

- [x] 11. Implement summary generation
  - Add generateSummary function to handlers.ts
  - Iterate through completedTests and categorize by toleranceStatus
  - Build arrays of tolerated, sensitive, and trigger foods
  - Extract unique completed groups
  - Return summary object with totalTestsCompleted, groupsCompleted, and food arrays
  - _Requirements: 8.5_

- [x] 12. Implement main engine entry point
  - Create src/engine/fodmapEngine/index.ts file
  - Implement calculateNextAction function as main entry point
  - Accept ProtocolState and current Date as parameters
  - Validate input using ProtocolStateSchema.parse
  - Call validateProtocolState and return error action if invalid
  - Check if currentWashout exists, call handleWashoutPeriod
  - Check if currentTest exists, call handleCurrentTest
  - Otherwise call determineNextTest
  - Return NextAction result
  - Export all public functions and types
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 10.1, 10.2, 10.3, 10.4, 10.5, 12.1, 12.2, 12.3_

- [x] 13. Write unit tests for symptom analysis
  - Create src/engine/fodmapEngine/**tests**/symptoms.test.ts
  - Test analyzeSymptoms with empty array returns 'none'
  - Test analyzeSymptoms with single mild symptom returns 'mild'
  - Test analyzeSymptoms with multiple symptoms returns highest severity
  - Test analyzeSymptoms with severe symptom always returns 'severe'
  - Test shouldStopTest returns true for severe symptoms on any day
  - Test shouldStopTest returns true for moderate symptoms on day 1
  - Test shouldStopTest returns false for moderate symptoms on day 2 or 3
  - Test shouldStopTest returns false for mild symptoms on any day
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 14. Write unit tests for tolerance classification
  - Create src/engine/fodmapEngine/**tests**/tolerance.test.ts
  - Test classifyTolerance with empty doses returns 'untested'
  - Test classifyTolerance with all tolerated doses returns 'tolerated' with maxToleratedPortion
  - Test classifyTolerance with severe symptoms on day 1 returns 'trigger' with triggerPortion
  - Test classifyTolerance with moderate symptoms on day 2 returns 'sensitive' with both portions
  - Test classifyTolerance with dose-dependent symptoms (tolerated day 1, moderate day 2)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 15. Write unit tests for washout calculations
  - Create src/engine/fodmapEngine/**tests**/washout.test.ts
  - Test calculateWashout with 'none' severity returns 3-day period
  - Test calculateWashout with 'mild' severity returns 3-day period
  - Test calculateWashout with 'moderate' severity returns 7-day period
  - Test calculateWashout with 'severe' severity returns 7-day period
  - Test calculateWashout date arithmetic is correct
  - Test checkWashoutStatus returns complete=false when days remaining
  - Test checkWashoutStatus returns complete=true when end date passed
  - Test checkWashoutStatus calculates daysRemaining correctly
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 16. Write unit tests for sequence management
  - Create src/engine/fodmapEngine/**tests**/sequence.test.ts
  - Test getGroupSequence returns standard sequence when no custom sequence
  - Test getGroupSequence returns custom sequence when provided
  - Test getNextGroup returns first group when none completed
  - Test getNextGroup returns second group when first completed
  - Test getNextGroup returns null when all groups completed
  - Test getRecommendedFoods returns correct foods for each group
  - Test getPortionForDay returns correct portion for days 1, 2, 3
  - Test getPortionForDay throws error for invalid day numbers (0, 4, -1)
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 17. Write unit tests for state validation
  - Create src/engine/fodmapEngine/**tests**/validation.test.ts
  - Test validateProtocolState returns valid=true for correct state
  - Test validateProtocolState detects conflicting currentTest and currentWashout
  - Test validateProtocolState detects non-sequential dose day numbers
  - Test validateProtocolState detects invalid washout dates (end before start)
  - Test validateProtocolState returns all errors when multiple issues
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 18. Write integration tests for complete protocol flow
  - Create src/engine/fodmapEngine/**tests**/integration.test.ts
  - Test complete protocol from start to finish with no symptoms (success scenario)
  - Test protocol with dose-dependent symptoms (tolerated day 1, moderate day 2)
  - Test protocol with early interruption (severe symptoms on day 1)
  - Test protocol with extended washout (moderate symptoms requiring 7 days)
  - Test protocol with custom group sequence
  - Test protocol resumption after interruption
  - Test all FODMAP groups in sequence
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7_

- [x] 19. Write determinism tests
  - Create src/engine/fodmapEngine/**tests**/determinism.test.ts
  - Test calculateNextAction returns identical output for same inputs
  - Test time injection works correctly (no system clock access)
  - Test date calculations are deterministic
  - Test no randomness in any function
  - Run same test 100 times and verify identical results
  - _Requirements: 9.1, 9.7, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 20. Write edge case tests
  - Create src/engine/fodmapEngine/**tests**/edge-cases.test.ts
  - Test invalid Zod schema inputs throw validation errors
  - Test boundary conditions (day 0, day 4, negative days)
  - Test empty protocol state
  - Test missing required fields
  - Test date boundary conditions (leap years, month boundaries)
  - Test maximum values (many completed tests, long washout)
  - _Requirements: 2.4, 9.1, 9.7_

- [x] 21. Verify test coverage meets requirements
  - Run test coverage report with jest --coverage
  - Verify overall coverage is ≥ 90%
  - Verify all core functions have 100% coverage
  - Verify all branches are tested
  - Identify and test any uncovered code paths
  - _Requirements: 9.1_

- [x] 22. Create engine usage documentation
  - Create src/engine/fodmapEngine/README.md
  - Document main calculateNextAction function with examples
  - Document ProtocolState structure and how to build it
  - Document NextAction structure and how to interpret it
  - Provide example usage scenarios (start protocol, record symptoms, handle washout)
  - Document time injection pattern for testing
  - Include TypeScript usage examples
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 23. Export public API
  - Update src/engine/fodmapEngine/index.ts to export public API
  - Export calculateNextAction as main function
  - Export all Zod schemas for external validation
  - Export all TypeScript types
  - Export configuration constants (STANDARD_GROUP_SEQUENCE, etc.)
  - Export utility functions (analyzeSymptoms, classifyTolerance, etc.)
  - Do not export internal handler functions
  - _Requirements: 1.1, 1.2, 1.3, 2.5_
