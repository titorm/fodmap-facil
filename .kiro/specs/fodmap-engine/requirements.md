# Requirements Document

## Introduction

This document defines the requirements for implementing a deterministic FODMAP reintroduction engine. The FODMAP_Engine shall provide pure, testable functions that implement the complete FODMAP reintroduction protocol, including group sequencing, dose progression (3 days with increasing portions), symptom interpretation (mild/moderate/significant), washout period decisions (3-7 days), progression/retest logic, and tolerance classification (tolerated/sensitive/trigger). The engine shall be framework-agnostic with no UI dependencies, accepting historical data as input and producing next steps, messages, and timers as output.

## Glossary

- **FODMAP_Engine**: The deterministic engine that implements FODMAP reintroduction protocol rules
- **FODMAP_Group**: One of five carbohydrate categories: Fructose, Lactose, Fructans, Galactans, or Polyols
- **Test_Sequence**: The ordered progression through FODMAP groups during reintroduction
- **Dose_Day**: A single day within a 3-day testing period with specific portion size
- **Symptom_Severity**: Classification of symptoms as None, Mild, Moderate, or Severe
- **Washout_Period**: A 3-7 day period of returning to low-FODMAP diet between tests
- **Tolerance_Status**: Classification of a food as Tolerated, Sensitive, or Trigger based on test results
- **Protocol_State**: The complete state of a user's reintroduction journey including history and current position
- **Next_Action**: The engine's output specifying what the user should do next
- **Time_Injection**: The practice of passing current time as a parameter rather than reading system clock

## Requirements

### Requirement 1

**User Story:** As a developer, I want pure functions with explicit inputs and outputs, so that the engine is 100% testable and deterministic

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL implement all logic as pure functions without side effects
2. THE FODMAP_Engine SHALL accept Protocol_State as input containing all historical data
3. THE FODMAP_Engine SHALL return Next_Action as output containing next steps and messages
4. THE FODMAP_Engine SHALL use Time_Injection for all date/time operations
5. THE FODMAP_Engine SHALL NOT access system clock, databases, or external services directly

### Requirement 2

**User Story:** As a developer, I want Zod schemas for all inputs and outputs, so that data validation is type-safe and runtime-verified

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL define Zod schemas for Protocol_State input
2. THE FODMAP_Engine SHALL define Zod schemas for Next_Action output
3. THE FODMAP_Engine SHALL define Zod schemas for all intermediate data structures
4. WHEN invalid data is provided, THEN THE FODMAP_Engine SHALL throw validation errors with detailed messages
5. THE FODMAP_Engine SHALL export TypeScript types derived from Zod schemas

### Requirement 3

**User Story:** As a user, I want to test FODMAP groups in a specific sequence, so that I can systematically identify my tolerances

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL define the standard Test_Sequence as: Fructose, Lactose, Fructans, Galactans, Polyols
2. THE FODMAP_Engine SHALL allow custom Test_Sequence ordering if specified in Protocol_State
3. WHEN a FODMAP_Group test is completed, THEN THE FODMAP_Engine SHALL determine the next FODMAP_Group in sequence
4. THE FODMAP_Engine SHALL track which FODMAP_Groups have been tested
5. WHEN all FODMAP_Groups are tested, THEN THE FODMAP_Engine SHALL indicate protocol completion

### Requirement 4

**User Story:** As a user, I want to test each food over 3 days with increasing portions, so that I can identify my tolerance threshold

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL implement a 3-day testing period for each food
2. WHEN on Dose_Day 1, THEN THE FODMAP_Engine SHALL recommend a small portion
3. WHEN on Dose_Day 2, THEN THE FODMAP_Engine SHALL recommend a medium portion
4. WHEN on Dose_Day 3, THEN THE FODMAP_Engine SHALL recommend a large portion
5. THE FODMAP_Engine SHALL define specific portion sizes for each FODMAP_Group and food item

### Requirement 5

**User Story:** As a user, I want my symptoms to be interpreted correctly, so that the engine makes appropriate decisions about progression

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL classify symptoms as None, Mild, Moderate, or Severe
2. WHEN Symptom_Severity is None or Mild, THEN THE FODMAP_Engine SHALL consider the dose tolerated
3. WHEN Symptom_Severity is Moderate, THEN THE FODMAP_Engine SHALL mark the food as Sensitive
4. WHEN Symptom_Severity is Severe, THEN THE FODMAP_Engine SHALL mark the food as Trigger
5. THE FODMAP_Engine SHALL aggregate multiple symptoms to determine overall Symptom_Severity for a day

### Requirement 6

**User Story:** As a user, I want appropriate washout periods between tests, so that symptoms from one test don't affect the next

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL require a minimum 3-day Washout_Period after each food test
2. WHEN Symptom_Severity was Moderate or Severe, THEN THE FODMAP_Engine SHALL extend Washout_Period to 7 days
3. WHEN Symptom_Severity was None or Mild, THEN THE FODMAP_Engine SHALL use a 3-day Washout_Period
4. THE FODMAP_Engine SHALL track Washout_Period start and end dates
5. WHEN in Washout_Period, THEN THE FODMAP_Engine SHALL instruct user to follow low-FODMAP diet

### Requirement 7

**User Story:** As a user, I want the engine to decide whether to advance or retest, so that I get accurate tolerance information

#### Acceptance Criteria

1. WHEN all 3 Dose_Days are completed with None or Mild symptoms, THEN THE FODMAP_Engine SHALL mark food as Tolerated and advance to next food
2. WHEN Moderate symptoms occur on any Dose_Day, THEN THE FODMAP_Engine SHALL mark food as Sensitive and advance after washout
3. WHEN Severe symptoms occur on any Dose_Day, THEN THE FODMAP_Engine SHALL mark food as Trigger and immediately start washout
4. WHEN Severe symptoms occur on Dose_Day 1, THEN THE FODMAP_Engine SHALL skip remaining doses for that food
5. THE FODMAP_Engine SHALL NOT retest the same food within the same FODMAP_Group test cycle

### Requirement 8

**User Story:** As a user, I want foods classified by tolerance level, so that I know which foods I can safely eat

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL classify each tested food with Tolerance_Status
2. WHEN a food is Tolerated, THEN THE FODMAP_Engine SHALL record the maximum tolerated portion size
3. WHEN a food is Sensitive, THEN THE FODMAP_Engine SHALL record the portion size that caused Moderate symptoms
4. WHEN a food is Trigger, THEN THE FODMAP_Engine SHALL record the portion size that caused Severe symptoms
5. THE FODMAP_Engine SHALL provide summary of all Tolerance_Status classifications for a FODMAP_Group

### Requirement 9

**User Story:** As a developer, I want comprehensive test coverage, so that the engine behavior is verified for all scenarios

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL have unit tests achieving minimum 90% code coverage
2. THE FODMAP_Engine SHALL include tests for successful progression without symptoms
3. THE FODMAP_Engine SHALL include tests for dose-dependent symptom scenarios
4. THE FODMAP_Engine SHALL include tests for early symptom interruption scenarios
5. THE FODMAP_Engine SHALL include tests for extended washout period scenarios
6. THE FODMAP_Engine SHALL include tests for all FODMAP_Group sequences
7. THE FODMAP_Engine SHALL include tests for edge cases and invalid inputs

### Requirement 10

**User Story:** As a developer, I want deterministic behavior with time injection, so that tests are reliable and reproducible

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL accept a "now" parameter for all time-dependent operations
2. THE FODMAP_Engine SHALL calculate all dates relative to the injected "now" value
3. WHEN the same Protocol_State and "now" are provided, THEN THE FODMAP_Engine SHALL return identical Next_Action
4. THE FODMAP_Engine SHALL NOT use Date.now(), new Date(), or any system clock functions
5. THE FODMAP_Engine SHALL include tests that verify deterministic behavior across multiple runs

### Requirement 11

**User Story:** As a user, I want clear next-step instructions, so that I know exactly what to do each day

#### Acceptance Criteria

1. THE FODMAP_Engine SHALL generate Next_Action with actionable instructions
2. THE Next_Action SHALL include the specific food to test and portion size
3. THE Next_Action SHALL include the current day number and phase (testing or washout)
4. THE Next_Action SHALL include estimated dates for next milestones
5. THE Next_Action SHALL include user-friendly messages explaining the current state

### Requirement 12

**User Story:** As a developer, I want the engine to handle incomplete or interrupted protocols, so that users can resume testing

#### Acceptance Criteria

1. WHEN Protocol_State indicates an incomplete test, THEN THE FODMAP_Engine SHALL determine the correct resumption point
2. WHEN a Washout_Period is in progress, THEN THE FODMAP_Engine SHALL calculate remaining days
3. WHEN a user missed a scheduled Dose_Day, THEN THE FODMAP_Engine SHALL provide guidance on how to proceed
4. THE FODMAP_Engine SHALL validate Protocol_State consistency and detect invalid states
5. WHEN Protocol_State is invalid, THEN THE FODMAP_Engine SHALL return error details with recovery suggestions
