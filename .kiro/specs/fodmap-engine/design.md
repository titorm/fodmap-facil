# Design Document

## Overview

The FODMAP Engine is a pure, deterministic state machine that implements the complete FODMAP reintroduction protocol. It accepts a protocol state (history of all tests and symptoms) and returns the next action the user should take. The engine is framework-agnostic, fully testable, and uses Zod for runtime validation.

The design follows functional programming principles with immutable data structures, explicit inputs/outputs, and no side effects. All time-dependent operations use injected timestamps for determinism.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│              (UI, Database, Notifications)               │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   FODMAP Engine (Pure)                   │
├─────────────────────────────────────────────────────────┤
│  Input: ProtocolState + now                             │
│  Output: NextAction                                      │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────┐   │
│  │  State Validation (Zod)                         │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Protocol Logic                                  │   │
│  │  - Sequence Management                           │   │
│  │  - Dose Progression                              │   │
│  │  - Symptom Interpretation                        │   │
│  │  - Washout Calculation                           │   │
│  │  - Tolerance Classification                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │  Action Generation                               │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Core Principles

1. **Pure Functions**: No side effects, same input always produces same output
2. **Immutability**: All data structures are immutable
3. **Time Injection**: Current time passed as parameter, never read from system
4. **Type Safety**: Zod schemas for runtime validation + TypeScript types
5. **Testability**: 100% unit testable without mocks

## Components and Interfaces

### 1. Type Definitions (types.ts)

All types are defined using Zod schemas and exported as TypeScript types.

#### Core Enums

```typescript
import { z } from 'zod';

// FODMAP Groups
export const FODMAPGroupSchema = z.enum([
  'fructose',
  'lactose',
  'fructans',
  'galactans',
  'polyols',
]);
export type FODMAPGroup = z.infer<typeof FODMAPGroupSchema>;

// Symptom Severity
export const SymptomSeveritySchema = z.enum(['none', 'mild', 'moderate', 'severe']);
export type SymptomSeverity = z.infer<typeof SymptomSeveritySchema>;

// Tolerance Status
export const ToleranceStatusSchema = z.enum(['tolerated', 'sensitive', 'trigger', 'untested']);
export type ToleranceStatus = z.infer<typeof ToleranceStatusSchema>;

// Protocol Phase
export const ProtocolPhaseSchema = z.enum(['testing', 'washout', 'completed']);
export type ProtocolPhase = z.infer<typeof ProtocolPhaseSchema>;
```

#### Symptom Record

```typescript
export const SymptomRecordSchema = z.object({
  timestamp: z.string().datetime(), // ISO 8601
  severity: SymptomSeveritySchema,
  type: z.string(), // e.g., "bloating", "pain", "diarrhea"
  notes: z.string().optional(),
});
export type SymptomRecord = z.infer<typeof SymptomRecordSchema>;
```

#### Dose Record

```typescript
export const DoseRecordSchema = z.object({
  date: z.string().datetime(), // ISO 8601
  dayNumber: z.number().int().min(1).max(3), // 1, 2, or 3
  foodItem: z.string(),
  portionSize: z.string(),
  portionAmount: z.number().positive(), // Numeric value for comparison
  symptoms: z.array(SymptomRecordSchema),
  notes: z.string().optional(),
});
export type DoseRecord = z.infer<typeof DoseRecordSchema>;
```

#### Food Test Result

```typescript
export const FoodTestResultSchema = z.object({
  foodItem: z.string(),
  fodmapGroup: FODMAPGroupSchema,
  doses: z.array(DoseRecordSchema).min(1).max(3),
  toleranceStatus: ToleranceStatusSchema,
  maxToleratedPortion: z.string().optional(),
  triggerPortion: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime().optional(),
});
export type FoodTestResult = z.infer<typeof FoodTestResultSchema>;
```

#### Washout Period

```typescript
export const WashoutPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  durationDays: z.number().int().min(3).max(7),
  reason: z.string(), // e.g., "Moderate symptoms on Day 2"
});
export type WashoutPeriod = z.infer<typeof WashoutPeriodSchema>;
```

#### Protocol State (Input)

```typescript
export const ProtocolStateSchema = z.object({
  userId: z.string(),
  startDate: z.string().datetime(),
  groupSequence: z.array(FODMAPGroupSchema).optional(), // Custom order, defaults to standard
  completedTests: z.array(FoodTestResultSchema),
  currentTest: FoodTestResultSchema.optional(),
  currentWashout: WashoutPeriodSchema.optional(),
  phase: ProtocolPhaseSchema,
});
export type ProtocolState = z.infer<typeof ProtocolStateSchema>;
```

#### Next Action (Output)

```typescript
export const NextActionSchema = z.object({
  action: z.enum([
    'start_dose',
    'continue_washout',
    'start_next_food',
    'start_next_group',
    'protocol_complete',
    'error',
  ]),
  phase: ProtocolPhaseSchema,
  currentGroup: FODMAPGroupSchema.optional(),
  currentFood: z.string().optional(),
  currentDayNumber: z.number().int().min(1).max(3).optional(),
  recommendedPortion: z.string().optional(),
  message: z.string(),
  instructions: z.array(z.string()),
  nextMilestone: z
    .object({
      date: z.string().datetime(),
      description: z.string(),
    })
    .optional(),
  washoutDaysRemaining: z.number().int().min(0).optional(),
  summary: z
    .object({
      totalTestsCompleted: z.number().int().min(0),
      groupsCompleted: z.array(FODMAPGroupSchema),
      toleratedFoods: z.array(z.string()),
      sensitiveFoods: z.array(z.string()),
      triggerFoods: z.array(z.string()),
    })
    .optional(),
  errors: z.array(z.string()).optional(),
});
export type NextAction = z.infer<typeof NextActionSchema>;
```

### 2. Protocol Configuration

```typescript
// Standard FODMAP group sequence
export const STANDARD_GROUP_SEQUENCE: FODMAPGroup[] = [
  'fructose',
  'lactose',
  'fructans',
  'galactans',
  'polyols',
];

// Recommended foods for each group
export const RECOMMENDED_FOODS: Record<FODMAPGroup, string[]> = {
  fructose: ['Honey', 'Mango', 'Asparagus'],
  lactose: ['Milk', 'Yogurt', 'Ice cream'],
  fructans: ['Wheat bread', 'Garlic', 'Onion'],
  galactans: ['Chickpeas', 'Lentils', 'Kidney beans'],
  polyols: ['Avocado', 'Mushrooms', 'Cauliflower'],
};

// Portion progression for each group (small, medium, large)
export const PORTION_PROGRESSION: Record<FODMAPGroup, [string, string, string]> = {
  fructose: ['1 tsp', '2 tsp', '1 tbsp'],
  lactose: ['1/4 cup', '1/2 cup', '1 cup'],
  fructans: ['1 slice', '2 slices', '3 slices'],
  galactans: ['1/4 cup', '1/2 cup', '3/4 cup'],
  polyols: ['1/4 cup', '1/2 cup', '1 cup'],
};

// Washout duration based on symptom severity
export const WASHOUT_DURATION: Record<SymptomSeverity, number> = {
  none: 3,
  mild: 3,
  moderate: 7,
  severe: 7,
};
```

### 3. Core Engine Functions

#### Main Entry Point

```typescript
/**
 * Calculate the next action based on current protocol state
 * @param state - Current protocol state with all history
 * @param now - Current timestamp (injected for determinism)
 * @returns Next action the user should take
 */
export function calculateNextAction(state: ProtocolState, now: Date): NextAction {
  // 1. Validate input
  const validatedState = ProtocolStateSchema.parse(state);

  // 2. Check if in washout period
  if (validatedState.currentWashout) {
    return handleWashoutPeriod(validatedState, now);
  }

  // 3. Check if current test is in progress
  if (validatedState.currentTest) {
    return handleCurrentTest(validatedState, now);
  }

  // 4. Determine next test to start
  return determineNextTest(validatedState, now);
}
```

#### Symptom Analysis

```typescript
/**
 * Analyze symptoms for a dose and determine overall severity
 * @param symptoms - Array of symptom records
 * @returns Overall symptom severity
 */
export function analyzeSymptoms(symptoms: SymptomRecord[]): SymptomSeverity {
  if (symptoms.length === 0) return 'none';

  const severities = symptoms.map((s) => s.severity);

  // If any severe symptom, overall is severe
  if (severities.includes('severe')) return 'severe';

  // If any moderate symptom, overall is moderate
  if (severities.includes('moderate')) return 'moderate';

  // If any mild symptom, overall is mild
  if (severities.includes('mild')) return 'mild';

  return 'none';
}

/**
 * Determine if symptoms warrant stopping current test
 * @param severity - Overall symptom severity
 * @param dayNumber - Current day number (1-3)
 * @returns Whether to stop test immediately
 */
export function shouldStopTest(severity: SymptomSeverity, dayNumber: number): boolean {
  // Severe symptoms always stop test
  if (severity === 'severe') return true;

  // Moderate symptoms on day 1 stop test
  if (severity === 'moderate' && dayNumber === 1) return true;

  return false;
}
```

#### Tolerance Classification

```typescript
/**
 * Classify food tolerance based on completed doses
 * @param doses - Array of completed dose records
 * @returns Tolerance status and relevant portion info
 */
export function classifyTolerance(doses: DoseRecord[]): {
  status: ToleranceStatus;
  maxToleratedPortion?: string;
  triggerPortion?: string;
} {
  if (doses.length === 0) {
    return { status: 'untested' };
  }

  // Analyze each dose
  const doseAnalysis = doses.map((dose) => ({
    dayNumber: dose.dayNumber,
    portion: dose.portionSize,
    severity: analyzeSymptoms(dose.symptoms),
  }));

  // Find first dose with moderate or severe symptoms
  const firstProblem = doseAnalysis.find(
    (d) => d.severity === 'moderate' || d.severity === 'severe'
  );

  if (!firstProblem) {
    // All doses tolerated
    return {
      status: 'tolerated',
      maxToleratedPortion: doseAnalysis[doseAnalysis.length - 1].portion,
    };
  }

  if (firstProblem.severity === 'severe') {
    return {
      status: 'trigger',
      triggerPortion: firstProblem.portion,
    };
  }

  // Moderate symptoms
  const lastTolerated = doseAnalysis
    .slice(0, firstProblem.dayNumber - 1)
    .reverse()
    .find((d) => d.severity === 'none' || d.severity === 'mild');

  return {
    status: 'sensitive',
    maxToleratedPortion: lastTolerated?.portion,
    triggerPortion: firstProblem.portion,
  };
}
```

#### Washout Calculation

```typescript
/**
 * Calculate washout period based on symptom severity
 * @param maxSeverity - Maximum symptom severity encountered
 * @param startDate - Washout start date
 * @returns Washout period details
 */
export function calculateWashout(maxSeverity: SymptomSeverity, startDate: Date): WashoutPeriod {
  const durationDays = WASHOUT_DURATION[maxSeverity];
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + durationDays);

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    durationDays,
    reason: `${maxSeverity} symptoms require ${durationDays}-day washout`,
  };
}

/**
 * Check if washout period is complete
 * @param washout - Washout period details
 * @param now - Current timestamp
 * @returns Whether washout is complete and days remaining
 */
export function checkWashoutStatus(
  washout: WashoutPeriod,
  now: Date
): { complete: boolean; daysRemaining: number } {
  const endDate = new Date(washout.endDate);
  const daysRemaining = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  return {
    complete: daysRemaining <= 0,
    daysRemaining: Math.max(0, daysRemaining),
  };
}
```

#### Sequence Management

```typescript
/**
 * Get the sequence of groups to test
 * @param state - Protocol state
 * @returns Ordered array of FODMAP groups
 */
export function getGroupSequence(state: ProtocolState): FODMAPGroup[] {
  return state.groupSequence || STANDARD_GROUP_SEQUENCE;
}

/**
 * Determine next group to test
 * @param state - Protocol state
 * @returns Next group or null if all complete
 */
export function getNextGroup(state: ProtocolState): FODMAPGroup | null {
  const sequence = getGroupSequence(state);
  const completedGroups = new Set(state.completedTests.map((t) => t.fodmapGroup));

  return sequence.find((group) => !completedGroups.has(group)) || null;
}

/**
 * Get recommended foods for a group
 * @param group - FODMAP group
 * @returns Array of recommended food items
 */
export function getRecommendedFoods(group: FODMAPGroup): string[] {
  return RECOMMENDED_FOODS[group];
}

/**
 * Get portion for specific day
 * @param group - FODMAP group
 * @param dayNumber - Day number (1-3)
 * @returns Recommended portion size
 */
export function getPortionForDay(group: FODMAPGroup, dayNumber: number): string {
  if (dayNumber < 1 || dayNumber > 3) {
    throw new Error(`Invalid day number: ${dayNumber}. Must be 1, 2, or 3.`);
  }
  return PORTION_PROGRESSION[group][dayNumber - 1];
}
```

#### State Handlers

```typescript
/**
 * Handle washout period state
 */
function handleWashoutPeriod(state: ProtocolState, now: Date): NextAction {
  const washout = state.currentWashout!;
  const status = checkWashoutStatus(washout, now);

  if (!status.complete) {
    return {
      action: 'continue_washout',
      phase: 'washout',
      message: `Continue low-FODMAP diet during washout period`,
      instructions: [
        `Washout period: ${status.daysRemaining} days remaining`,
        'Avoid all high-FODMAP foods',
        'Monitor symptoms daily',
        'Symptoms should resolve during this period',
      ],
      washoutDaysRemaining: status.daysRemaining,
      nextMilestone: {
        date: washout.endDate,
        description: 'Washout period ends, ready for next test',
      },
    };
  }

  // Washout complete, determine next test
  return determineNextTest(state, now);
}

/**
 * Handle current test in progress
 */
function handleCurrentTest(state: ProtocolState, now: Date): NextAction {
  const test = state.currentTest!;
  const completedDoses = test.doses.length;

  // Check if test should be stopped due to severe symptoms
  if (completedDoses > 0) {
    const lastDose = test.doses[completedDoses - 1];
    const severity = analyzeSymptoms(lastDose.symptoms);

    if (shouldStopTest(severity, lastDose.dayNumber)) {
      // Start washout immediately
      const washout = calculateWashout(severity, now);

      return {
        action: 'continue_washout',
        phase: 'washout',
        currentGroup: test.fodmapGroup,
        currentFood: test.foodItem,
        message: `Test stopped due to ${severity} symptoms. Starting washout period.`,
        instructions: [
          'Stop testing this food immediately',
          'Return to low-FODMAP diet',
          `Washout period: ${washout.durationDays} days`,
          'Symptoms should resolve during washout',
        ],
        washoutDaysRemaining: washout.durationDays,
        nextMilestone: {
          date: washout.endDate,
          description: 'Washout complete, ready for next food',
        },
      };
    }
  }

  // Continue with next dose
  const nextDayNumber = completedDoses + 1;

  if (nextDayNumber > 3) {
    // Test complete, start washout
    const maxSeverity = Math.max(
      ...test.doses.map((d) => {
        const sev = analyzeSymptoms(d.symptoms);
        return ['none', 'mild', 'moderate', 'severe'].indexOf(sev);
      })
    );
    const severity = ['none', 'mild', 'moderate', 'severe'][maxSeverity] as SymptomSeverity;
    const washout = calculateWashout(severity, now);

    return {
      action: 'continue_washout',
      phase: 'washout',
      currentGroup: test.fodmapGroup,
      currentFood: test.foodItem,
      message: `Test complete for ${test.foodItem}. Starting washout period.`,
      instructions: [
        'All 3 doses completed',
        'Return to low-FODMAP diet',
        `Washout period: ${washout.durationDays} days`,
      ],
      washoutDaysRemaining: washout.durationDays,
      nextMilestone: {
        date: washout.endDate,
        description: 'Washout complete, ready for next food',
      },
    };
  }

  const portion = getPortionForDay(test.fodmapGroup, nextDayNumber);

  return {
    action: 'start_dose',
    phase: 'testing',
    currentGroup: test.fodmapGroup,
    currentFood: test.foodItem,
    currentDayNumber: nextDayNumber,
    recommendedPortion: portion,
    message: `Day ${nextDayNumber} of testing ${test.foodItem}`,
    instructions: [
      `Consume ${portion} of ${test.foodItem}`,
      'Monitor symptoms for 24 hours',
      'Record any symptoms immediately',
      'Continue low-FODMAP diet otherwise',
    ],
  };
}

/**
 * Determine next test to start
 */
function determineNextTest(state: ProtocolState, now: Date): NextAction {
  const nextGroup = getNextGroup(state);

  if (!nextGroup) {
    // Protocol complete
    const summary = generateSummary(state);

    return {
      action: 'protocol_complete',
      phase: 'completed',
      message: 'Congratulations! FODMAP reintroduction protocol complete.',
      instructions: [
        'All FODMAP groups tested',
        'Review your tolerance results',
        'Consult with dietitian for personalized diet plan',
      ],
      summary,
    };
  }

  const foods = getRecommendedFoods(nextGroup);
  const firstFood = foods[0];
  const portion = getPortionForDay(nextGroup, 1);

  return {
    action: 'start_next_group',
    phase: 'testing',
    currentGroup: nextGroup,
    currentFood: firstFood,
    currentDayNumber: 1,
    recommendedPortion: portion,
    message: `Starting new FODMAP group: ${nextGroup}`,
    instructions: [
      `Testing ${nextGroup} group`,
      `First food: ${firstFood}`,
      `Day 1: Consume ${portion}`,
      'Monitor symptoms for 24 hours',
    ],
  };
}

/**
 * Generate protocol summary
 */
function generateSummary(state: ProtocolState): NextAction['summary'] {
  const tolerated: string[] = [];
  const sensitive: string[] = [];
  const trigger: string[] = [];

  state.completedTests.forEach((test) => {
    switch (test.toleranceStatus) {
      case 'tolerated':
        tolerated.push(test.foodItem);
        break;
      case 'sensitive':
        sensitive.push(test.foodItem);
        break;
      case 'trigger':
        trigger.push(test.foodItem);
        break;
    }
  });

  return {
    totalTestsCompleted: state.completedTests.length,
    groupsCompleted: [...new Set(state.completedTests.map((t) => t.fodmapGroup))],
    toleratedFoods: tolerated,
    sensitiveFoods: sensitive,
    triggerFoods: trigger,
  };
}
```

## Data Models

All data models are defined using Zod schemas (see Components section above). Key models:

1. **ProtocolState**: Complete history and current state
2. **NextAction**: Engine output with instructions
3. **FoodTestResult**: Results of testing a single food
4. **DoseRecord**: Single day's dose and symptoms
5. **WashoutPeriod**: Washout period details

## Error Handling

### Validation Errors

```typescript
try {
  const action = calculateNextAction(state, now);
} catch (error) {
  if (error instanceof z.ZodError) {
    // Handle validation error
    console.error('Invalid protocol state:', error.errors);
  }
}
```

### Invalid State Detection

```typescript
export function validateProtocolState(state: ProtocolState): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Check for conflicting states
  if (state.currentTest && state.currentWashout) {
    errors.push('Cannot have both active test and washout period');
  }

  // Check dose sequence
  if (state.currentTest) {
    const dayNumbers = state.currentTest.doses.map((d) => d.dayNumber);
    const sorted = [...dayNumbers].sort();
    if (JSON.stringify(dayNumbers) !== JSON.stringify(sorted)) {
      errors.push('Dose day numbers must be sequential');
    }
  }

  // Check date consistency
  if (state.currentWashout) {
    const start = new Date(state.currentWashout.startDate);
    const end = new Date(state.currentWashout.endDate);
    if (end <= start) {
      errors.push('Washout end date must be after start date');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
```

## Testing Strategy

### Unit Test Categories

1. **Symptom Analysis Tests**
   - Empty symptoms → 'none'
   - Single mild symptom → 'mild'
   - Multiple symptoms → highest severity
   - Severe symptom always wins

2. **Tolerance Classification Tests**
   - All doses tolerated → 'tolerated'
   - Moderate on day 2 → 'sensitive'
   - Severe on day 1 → 'trigger'
   - Edge cases (no doses, incomplete)

3. **Washout Calculation Tests**
   - None/mild → 3 days
   - Moderate/severe → 7 days
   - Date arithmetic correctness
   - Washout status checking

4. **Sequence Management Tests**
   - Standard sequence order
   - Custom sequence order
   - Next group determination
   - All groups completed

5. **State Machine Tests**
   - Start protocol → first group
   - Complete dose → next dose
   - Complete test → washout
   - Complete washout → next food
   - Complete all → protocol complete

6. **Determinism Tests**
   - Same input → same output
   - Time injection works correctly
   - No randomness or side effects

7. **Edge Cases**
   - Invalid day numbers
   - Missing required fields
   - Conflicting states
   - Date boundary conditions

### Test Coverage Target

- Minimum 90% code coverage
- 100% coverage of core logic functions
- All error paths tested
- All edge cases covered

### Example Test Structure

```typescript
describe('FODMAPEngine', () => {
  describe('calculateNextAction', () => {
    it('should start first group when protocol begins', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        phase: 'testing',
      };
      const now = new Date('2024-01-01T00:00:00Z');

      const action = calculateNextAction(state, now);

      expect(action.action).toBe('start_next_group');
      expect(action.currentGroup).toBe('fructose');
      expect(action.currentDayNumber).toBe(1);
    });

    it('should require washout after severe symptoms', () => {
      const state: ProtocolState = {
        userId: 'user1',
        startDate: '2024-01-01T00:00:00Z',
        completedTests: [],
        currentTest: {
          foodItem: 'Honey',
          fodmapGroup: 'fructose',
          doses: [
            {
              date: '2024-01-01T00:00:00Z',
              dayNumber: 1,
              foodItem: 'Honey',
              portionSize: '1 tsp',
              portionAmount: 5,
              symptoms: [
                {
                  timestamp: '2024-01-01T12:00:00Z',
                  severity: 'severe',
                  type: 'pain',
                },
              ],
            },
          ],
          toleranceStatus: 'untested',
          startDate: '2024-01-01T00:00:00Z',
        },
        phase: 'testing',
      };
      const now = new Date('2024-01-02T00:00:00Z');

      const action = calculateNextAction(state, now);

      expect(action.action).toBe('continue_washout');
      expect(action.washoutDaysRemaining).toBe(7);
    });
  });
});
```

## Design Decisions and Rationales

### 1. Pure Functions with Time Injection

**Decision**: Pass current time as parameter instead of reading system clock

**Rationale**:

- Makes tests deterministic and reproducible
- Allows testing time-dependent logic without waiting
- Enables time travel in tests
- No hidden dependencies

### 2. Zod for Runtime Validation

**Decision**: Use Zod schemas for all data structures

**Rationale**:

- Runtime type safety catches errors early
- Single source of truth for types
- Excellent error messages
- TypeScript integration
- Validation logic is declarative

### 3. Immutable Data Structures

**Decision**: All inputs and outputs are immutable

**Rationale**:

- Prevents accidental mutations
- Makes reasoning about code easier
- Enables time-travel debugging
- Thread-safe (if needed in future)

### 4. State Machine Pattern

**Decision**: Model protocol as explicit state machine

**Rationale**:

- Clear state transitions
- Easy to visualize and understand
- Prevents invalid states
- Testable state transitions

### 5. Separate Engine from Application

**Decision**: Engine has no dependencies on UI, database, or frameworks

**Rationale**:

- 100% testable without mocks
- Can be used in any context (web, mobile, CLI)
- Easy to reason about
- Fast tests (no I/O)

### 6. Explicit Error Handling

**Decision**: Return errors as values, not exceptions (except validation)

**Rationale**:

- Errors are part of the domain
- Forces handling of error cases
- More functional approach
- Better for testing

## Performance Considerations

### Time Complexity

- `calculateNextAction`: O(n) where n is number of completed tests
- `analyzeSymptoms`: O(m) where m is number of symptoms
- `classifyTolerance`: O(d) where d is number of doses (max 3)

All operations are linear or constant time, suitable for real-time use.

### Memory Usage

- State size grows linearly with number of tests
- No caching or memoization needed (pure functions)
- Typical state size: < 100KB for complete protocol

## Future Enhancements

1. **Custom Portion Sizes**: Allow users to define custom portions
2. **Multi-Food Testing**: Test multiple foods in same group simultaneously
3. **Symptom Prediction**: ML model to predict tolerance based on history
4. **Flexible Protocols**: Support variations like 2-day or 4-day testing
5. **Export/Import**: Serialize state for backup and restore
6. **Visualization**: Generate charts and graphs from state
7. **Recommendations**: Suggest foods to test based on common patterns
