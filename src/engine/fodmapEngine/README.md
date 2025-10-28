# FODMAP Engine Documentation

## Overview

The FODMAP Engine is a pure, deterministic state machine that implements the complete FODMAP reintroduction protocol. It provides framework-agnostic functions that accept protocol state as input and return the next action the user should take.

**Key Features:**

- ✅ Pure functions with no side effects
- ✅ 100% deterministic and testable
- ✅ Runtime type validation with Zod
- ✅ Time injection for testing
- ✅ Framework-agnostic (works with any UI/database)

## Installation

```typescript
import { calculateNextAction, ProtocolState } from './engine/fodmapEngine';
```

## Quick Start

```typescript
import { calculateNextAction, ProtocolState } from './engine/fodmapEngine';

// Create initial protocol state
const state: ProtocolState = {
  userId: 'user123',
  startDate: new Date().toISOString(),
  completedTests: [],
  phase: 'testing',
};

// Calculate next action
const now = new Date();
const nextAction = calculateNextAction(state, now);

console.log(nextAction.message);
// "Starting new FODMAP group: fructose"

console.log(nextAction.instructions);
// ["Testing fructose group", "First food: Honey", "Day 1: Consume 1 tsp", ...]
```

## Core Concepts

### Main Entry Point: `calculateNextAction`

The primary function that drives the entire protocol:

```typescript
function calculateNextAction(state: ProtocolState, now: Date): NextAction;
```

**Parameters:**

- `state`: Complete protocol state including history and current position
- `now`: Current timestamp (injected for determinism)

**Returns:**

- `NextAction`: Object containing what the user should do next

**Throws:**

- `z.ZodError`: If state validation fails

### ProtocolState Structure

The `ProtocolState` represents the complete history and current position in the protocol:

```typescript
interface ProtocolState {
  userId: string; // Unique user identifier
  startDate: string; // ISO 8601 datetime when protocol started
  groupSequence?: FODMAPGroup[]; // Optional custom group order
  completedTests: FoodTestResult[]; // All completed food tests
  currentTest?: FoodTestResult; // Test currently in progress
  currentWashout?: WashoutPeriod; // Active washout period
  phase: 'testing' | 'washout' | 'completed';
}
```

**Building a ProtocolState:**

```typescript
// Starting a new protocol
const initialState: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  completedTests: [],
  phase: 'testing',
};

// Protocol with custom group sequence
const customState: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  groupSequence: ['lactose', 'fructose', 'polyols', 'fructans', 'galactans'],
  completedTests: [],
  phase: 'testing',
};

// Protocol with active test
const activeTestState: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  completedTests: [],
  currentTest: {
    foodItem: 'Honey',
    fodmapGroup: 'fructose',
    doses: [
      {
        date: '2024-01-05T08:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: 5,
        symptoms: [],
      },
    ],
    toleranceStatus: 'untested',
    startDate: '2024-01-05T08:00:00Z',
  },
  phase: 'testing',
};
```

### NextAction Structure

The `NextAction` tells the application what the user should do next:

```typescript
interface NextAction {
  action:
    | 'start_dose'
    | 'continue_washout'
    | 'start_next_food'
    | 'start_next_group'
    | 'protocol_complete'
    | 'error';
  phase: 'testing' | 'washout' | 'completed';
  currentGroup?: FODMAPGroup;
  currentFood?: string;
  currentDayNumber?: number; // 1, 2, or 3
  recommendedPortion?: string;
  message: string; // User-friendly message
  instructions: string[]; // Step-by-step instructions
  nextMilestone?: {
    date: string;
    description: string;
  };
  washoutDaysRemaining?: number;
  summary?: {
    // Only present when protocol_complete
    totalTestsCompleted: number;
    groupsCompleted: FODMAPGroup[];
    toleratedFoods: string[];
    sensitiveFoods: string[];
    triggerFoods: string[];
  };
  errors?: string[]; // Only present on error
}
```

**Interpreting NextAction:**

```typescript
const action = calculateNextAction(state, now);

switch (action.action) {
  case 'start_dose':
    // User should consume the recommended portion
    console.log(`Eat ${action.recommendedPortion} of ${action.currentFood}`);
    console.log(`This is day ${action.currentDayNumber} of 3`);
    break;

  case 'continue_washout':
    // User should continue low-FODMAP diet
    console.log(`Washout: ${action.washoutDaysRemaining} days remaining`);
    console.log(`Next milestone: ${action.nextMilestone?.description}`);
    break;

  case 'start_next_group':
    // Starting a new FODMAP group
    console.log(`New group: ${action.currentGroup}`);
    console.log(`First food: ${action.currentFood}`);
    break;

  case 'protocol_complete':
    // All groups tested
    console.log('Protocol complete!');
    console.log(`Tolerated: ${action.summary?.toleratedFoods.join(', ')}`);
    console.log(`Sensitive: ${action.summary?.sensitiveFoods.join(', ')}`);
    console.log(`Triggers: ${action.summary?.triggerFoods.join(', ')}`);
    break;

  case 'error':
    // Invalid state detected
    console.error('Errors:', action.errors);
    break;
}
```

## Usage Examples

### Example 1: Starting a New Protocol

```typescript
import { calculateNextAction, ProtocolState } from './engine/fodmapEngine';

// Initialize protocol
const state: ProtocolState = {
  userId: 'user123',
  startDate: new Date().toISOString(),
  completedTests: [],
  phase: 'testing',
};

const now = new Date();
const action = calculateNextAction(state, now);

console.log(action);
// {
//   action: 'start_next_group',
//   phase: 'testing',
//   currentGroup: 'fructose',
//   currentFood: 'Honey',
//   currentDayNumber: 1,
//   recommendedPortion: '1 tsp',
//   message: 'Starting new FODMAP group: fructose',
//   instructions: [
//     'Testing fructose group',
//     'First food: Honey',
//     'Day 1: Consume 1 tsp',
//     'Monitor symptoms for 24 hours'
//   ]
// }
```

### Example 2: Recording Symptoms

```typescript
import { calculateNextAction, ProtocolState, SymptomRecord } from './engine/fodmapEngine';

// User completed Day 1 with mild symptoms
const symptoms: SymptomRecord[] = [
  {
    timestamp: '2024-01-05T14:00:00Z',
    severity: 'mild',
    type: 'bloating',
    notes: 'Slight discomfort after 2 hours',
  },
];

const state: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  completedTests: [],
  currentTest: {
    foodItem: 'Honey',
    fodmapGroup: 'fructose',
    doses: [
      {
        date: '2024-01-05T08:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: 5,
        symptoms: symptoms, // Add recorded symptoms
      },
    ],
    toleranceStatus: 'untested',
    startDate: '2024-01-05T08:00:00Z',
  },
  phase: 'testing',
};

const now = new Date('2024-01-06T08:00:00Z');
const action = calculateNextAction(state, now);

console.log(action);
// {
//   action: 'start_dose',
//   phase: 'testing',
//   currentGroup: 'fructose',
//   currentFood: 'Honey',
//   currentDayNumber: 2,
//   recommendedPortion: '2 tsp',
//   message: 'Day 2 of testing Honey',
//   instructions: [
//     'Consume 2 tsp of Honey',
//     'Monitor symptoms for 24 hours',
//     'Record any symptoms immediately',
//     'Continue low-FODMAP diet otherwise'
//   ]
// }
```

### Example 3: Handling Severe Symptoms

```typescript
import { calculateNextAction, ProtocolState } from './engine/fodmapEngine';

// User had severe symptoms on Day 1
const state: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  completedTests: [],
  currentTest: {
    foodItem: 'Honey',
    fodmapGroup: 'fructose',
    doses: [
      {
        date: '2024-01-05T08:00:00Z',
        dayNumber: 1,
        foodItem: 'Honey',
        portionSize: '1 tsp',
        portionAmount: 5,
        symptoms: [
          {
            timestamp: '2024-01-05T12:00:00Z',
            severity: 'severe',
            type: 'pain',
            notes: 'Intense abdominal pain',
          },
        ],
      },
    ],
    toleranceStatus: 'untested',
    startDate: '2024-01-05T08:00:00Z',
  },
  phase: 'testing',
};

const now = new Date('2024-01-06T08:00:00Z');
const action = calculateNextAction(state, now);

console.log(action);
// {
//   action: 'continue_washout',
//   phase: 'washout',
//   currentGroup: 'fructose',
//   currentFood: 'Honey',
//   message: 'Test stopped due to severe symptoms. Starting washout period.',
//   instructions: [
//     'Stop testing this food immediately',
//     'Return to low-FODMAP diet',
//     'Washout period: 7 days',
//     'Symptoms should resolve during washout'
//   ],
//   washoutDaysRemaining: 7,
//   nextMilestone: {
//     date: '2024-01-13T08:00:00Z',
//     description: 'Washout complete, ready for next food'
//   }
// }
```

### Example 4: Continuing Washout Period

```typescript
import { calculateNextAction, ProtocolState } from './engine/fodmapEngine';

// User is in the middle of a washout period
const state: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  completedTests: [],
  currentWashout: {
    startDate: '2024-01-06T08:00:00Z',
    endDate: '2024-01-13T08:00:00Z',
    durationDays: 7,
    reason: 'severe symptoms require 7-day washout',
  },
  phase: 'washout',
};

const now = new Date('2024-01-09T08:00:00Z'); // Day 3 of washout
const action = calculateNextAction(state, now);

console.log(action);
// {
//   action: 'continue_washout',
//   phase: 'washout',
//   message: 'Continue low-FODMAP diet during washout period',
//   instructions: [
//     'Washout period: 4 days remaining',
//     'Avoid all high-FODMAP foods',
//     'Monitor symptoms daily',
//     'Symptoms should resolve during this period'
//   ],
//   washoutDaysRemaining: 4,
//   nextMilestone: {
//     date: '2024-01-13T08:00:00Z',
//     description: 'Washout period ends, ready for next test'
//   }
// }
```

### Example 5: Completing the Protocol

```typescript
import { calculateNextAction, ProtocolState } from './engine/fodmapEngine';

// User has completed all FODMAP groups
const state: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  completedTests: [
    {
      foodItem: 'Honey',
      fodmapGroup: 'fructose',
      doses: [
        /* ... */
      ],
      toleranceStatus: 'tolerated',
      maxToleratedPortion: '1 tbsp',
      startDate: '2024-01-05T00:00:00Z',
      endDate: '2024-01-08T00:00:00Z',
    },
    {
      foodItem: 'Milk',
      fodmapGroup: 'lactose',
      doses: [
        /* ... */
      ],
      toleranceStatus: 'sensitive',
      maxToleratedPortion: '1/4 cup',
      triggerPortion: '1/2 cup',
      startDate: '2024-01-15T00:00:00Z',
      endDate: '2024-01-18T00:00:00Z',
    },
    // ... tests for fructans, galactans, polyols
  ],
  phase: 'completed',
};

const now = new Date();
const action = calculateNextAction(state, now);

console.log(action);
// {
//   action: 'protocol_complete',
//   phase: 'completed',
//   message: 'Congratulations! FODMAP reintroduction protocol complete.',
//   instructions: [
//     'All FODMAP groups tested',
//     'Review your tolerance results',
//     'Consult with dietitian for personalized diet plan'
//   ],
//   summary: {
//     totalTestsCompleted: 5,
//     groupsCompleted: ['fructose', 'lactose', 'fructans', 'galactans', 'polyols'],
//     toleratedFoods: ['Honey', 'Wheat bread'],
//     sensitiveFoods: ['Milk', 'Chickpeas'],
//     triggerFoods: ['Avocado']
//   }
// }
```

## Time Injection Pattern

The engine uses **time injection** for deterministic behavior. Always pass the current time as a parameter instead of reading the system clock.

### Why Time Injection?

- ✅ Makes tests deterministic and reproducible
- ✅ Allows testing time-dependent logic without waiting
- ✅ Enables time travel in tests
- ✅ No hidden dependencies

### Testing with Time Injection

```typescript
import { calculateNextAction, ProtocolState } from './engine/fodmapEngine';

describe('FODMAP Engine', () => {
  it('should calculate washout days remaining correctly', () => {
    const state: ProtocolState = {
      userId: 'user123',
      startDate: '2024-01-01T00:00:00Z',
      completedTests: [],
      currentWashout: {
        startDate: '2024-01-05T00:00:00Z',
        endDate: '2024-01-12T00:00:00Z',
        durationDays: 7,
        reason: 'severe symptoms',
      },
      phase: 'washout',
    };

    // Inject specific time for testing
    const now = new Date('2024-01-08T00:00:00Z'); // Day 3 of washout
    const action = calculateNextAction(state, now);

    expect(action.washoutDaysRemaining).toBe(4);
  });

  it('should be deterministic - same input produces same output', () => {
    const state: ProtocolState = {
      userId: 'user123',
      startDate: '2024-01-01T00:00:00Z',
      completedTests: [],
      phase: 'testing',
    };

    const now = new Date('2024-01-05T10:30:00Z');

    // Call multiple times with same inputs
    const action1 = calculateNextAction(state, now);
    const action2 = calculateNextAction(state, now);
    const action3 = calculateNextAction(state, now);

    // All results should be identical
    expect(action1).toEqual(action2);
    expect(action2).toEqual(action3);
  });
});
```

### Production Usage

```typescript
// In production, pass current time
const now = new Date();
const action = calculateNextAction(state, now);

// In tests, inject specific time
const testTime = new Date('2024-01-05T10:00:00Z');
const action = calculateNextAction(state, testTime);
```

## Utility Functions

The engine exports several utility functions for working with protocol data:

### Symptom Analysis

```typescript
import { analyzeSymptoms, shouldStopTest, SymptomRecord } from './engine/fodmapEngine';

const symptoms: SymptomRecord[] = [
  { timestamp: '2024-01-05T12:00:00Z', severity: 'mild', type: 'bloating' },
  { timestamp: '2024-01-05T14:00:00Z', severity: 'moderate', type: 'pain' },
];

const overallSeverity = analyzeSymptoms(symptoms);
console.log(overallSeverity); // 'moderate' (highest severity wins)

const shouldStop = shouldStopTest('severe', 1);
console.log(shouldStop); // true (severe symptoms always stop test)

const shouldContinue = shouldStopTest('mild', 2);
console.log(shouldContinue); // false (mild symptoms don't stop test)
```

### Tolerance Classification

```typescript
import { classifyTolerance, DoseRecord } from './engine/fodmapEngine';

const doses: DoseRecord[] = [
  {
    date: '2024-01-05T00:00:00Z',
    dayNumber: 1,
    foodItem: 'Honey',
    portionSize: '1 tsp',
    portionAmount: 5,
    symptoms: [], // No symptoms
  },
  {
    date: '2024-01-06T00:00:00Z',
    dayNumber: 2,
    foodItem: 'Honey',
    portionSize: '2 tsp',
    portionAmount: 10,
    symptoms: [{ timestamp: '2024-01-06T12:00:00Z', severity: 'moderate', type: 'bloating' }],
  },
];

const result = classifyTolerance(doses);
console.log(result);
// {
//   status: 'sensitive',
//   maxToleratedPortion: '1 tsp',
//   triggerPortion: '2 tsp'
// }
```

### Washout Calculations

```typescript
import { calculateWashout, checkWashoutStatus } from './engine/fodmapEngine';

// Calculate washout period
const washout = calculateWashout('severe', new Date('2024-01-05T00:00:00Z'));
console.log(washout);
// {
//   startDate: '2024-01-05T00:00:00Z',
//   endDate: '2024-01-12T00:00:00Z',
//   durationDays: 7,
//   reason: 'severe symptoms require 7-day washout'
// }

// Check washout status
const status = checkWashoutStatus(washout, new Date('2024-01-08T00:00:00Z'));
console.log(status);
// {
//   complete: false,
//   daysRemaining: 4
// }
```

### Sequence Management

```typescript
import {
  getGroupSequence,
  getNextGroup,
  getRecommendedFoods,
  getPortionForDay,
  STANDARD_GROUP_SEQUENCE,
} from './engine/fodmapEngine';

// Get group sequence
const sequence = getGroupSequence(state);
console.log(sequence); // ['fructose', 'lactose', 'fructans', 'galactans', 'polyols']

// Get next untested group
const nextGroup = getNextGroup(state);
console.log(nextGroup); // 'fructose' (if none completed)

// Get recommended foods for a group
const foods = getRecommendedFoods('fructose');
console.log(foods); // ['Honey', 'Mango', 'Asparagus']

// Get portion for specific day
const portion = getPortionForDay('fructose', 2);
console.log(portion); // '2 tsp' (day 2 medium portion)
```

## Configuration

The engine includes predefined configurations that can be imported:

```typescript
import {
  STANDARD_GROUP_SEQUENCE,
  RECOMMENDED_FOODS,
  PORTION_PROGRESSION,
  WASHOUT_DURATION,
} from './engine/fodmapEngine';

console.log(STANDARD_GROUP_SEQUENCE);
// ['fructose', 'lactose', 'fructans', 'galactans', 'polyols']

console.log(RECOMMENDED_FOODS.fructose);
// ['Honey', 'Mango', 'Asparagus']

console.log(PORTION_PROGRESSION.lactose);
// ['1/4 cup', '1/2 cup', '1 cup']

console.log(WASHOUT_DURATION.severe);
// 7
```

## Error Handling

### Validation Errors

The engine uses Zod for runtime validation. Invalid inputs throw `ZodError`:

```typescript
import { calculateNextAction } from './engine/fodmapEngine';
import { z } from 'zod';

try {
  const invalidState = {
    userId: 'user123',
    // Missing required fields
  };

  const action = calculateNextAction(invalidState as any, new Date());
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error('Validation failed:', error.errors);
    // [
    //   {
    //     code: 'invalid_type',
    //     expected: 'string',
    //     received: 'undefined',
    //     path: ['startDate'],
    //     message: 'Required'
    //   }
    // ]
  }
}
```

### State Validation Errors

Invalid protocol states return an error action:

```typescript
const invalidState: ProtocolState = {
  userId: 'user123',
  startDate: '2024-01-01T00:00:00Z',
  completedTests: [],
  currentTest: {
    /* ... */
  },
  currentWashout: {
    /* ... */
  }, // Can't have both!
  phase: 'testing',
};

const action = calculateNextAction(invalidState, new Date());

if (action.action === 'error') {
  console.error('Invalid state:', action.errors);
  // ['Cannot have both active test and washout period']
}
```

## TypeScript Types

All types are exported and can be imported:

```typescript
import type {
  ProtocolState,
  NextAction,
  FODMAPGroup,
  SymptomSeverity,
  ToleranceStatus,
  ProtocolPhase,
  SymptomRecord,
  DoseRecord,
  FoodTestResult,
  WashoutPeriod,
} from './engine/fodmapEngine';

// Use types for type safety
const state: ProtocolState = {
  userId: 'user123',
  startDate: new Date().toISOString(),
  completedTests: [],
  phase: 'testing',
};

const handleAction = (action: NextAction): void => {
  // TypeScript ensures type safety
  console.log(action.message);
};
```

## Best Practices

### 1. Always Validate State

```typescript
// Good: Let the engine validate
const action = calculateNextAction(state, now);

// Bad: Assuming state is valid
if (state.currentTest && state.currentWashout) {
  // This should never happen - let engine catch it
}
```

### 2. Use Time Injection

```typescript
// Good: Inject time for testability
const now = new Date();
const action = calculateNextAction(state, now);

// Bad: Reading system clock inside logic
const action = calculateNextAction(state, new Date()); // Still OK for production
```

### 3. Immutable State Updates

```typescript
// Good: Create new state object
const newState: ProtocolState = {
  ...oldState,
  currentTest: updatedTest,
};

// Bad: Mutating state
oldState.currentTest = updatedTest; // Don't do this!
```

### 4. Handle All Action Types

```typescript
// Good: Handle all possible actions
switch (action.action) {
  case 'start_dose':
    // ...
    break;
  case 'continue_washout':
    // ...
    break;
  case 'start_next_group':
    // ...
    break;
  case 'protocol_complete':
    // ...
    break;
  case 'error':
    // ...
    break;
  default:
    // TypeScript will error if you miss a case
    const _exhaustive: never = action.action;
}
```

## Integration Example

Here's a complete example of integrating the engine with a React application:

```typescript
import { useState, useEffect } from 'react';
import { calculateNextAction, ProtocolState, NextAction } from './engine/fodmapEngine';

function ProtocolScreen() {
  const [state, setState] = useState<ProtocolState>({
    userId: 'user123',
    startDate: new Date().toISOString(),
    completedTests: [],
    phase: 'testing',
  });

  const [action, setAction] = useState<NextAction | null>(null);

  // Calculate next action whenever state changes
  useEffect(() => {
    const now = new Date();
    const nextAction = calculateNextAction(state, now);
    setAction(nextAction);
  }, [state]);

  const handleRecordSymptoms = (symptoms: SymptomRecord[]) => {
    // Update current test with symptoms
    if (state.currentTest) {
      const updatedDoses = [...state.currentTest.doses];
      updatedDoses[updatedDoses.length - 1].symptoms = symptoms;

      setState({
        ...state,
        currentTest: {
          ...state.currentTest,
          doses: updatedDoses,
        },
      });
    }
  };

  if (!action) return <div>Loading...</div>;

  return (
    <div>
      <h1>{action.message}</h1>
      <ul>
        {action.instructions.map((instruction, i) => (
          <li key={i}>{instruction}</li>
        ))}
      </ul>

      {action.action === 'start_dose' && (
        <button onClick={() => handleRecordSymptoms([])}>
          Complete Day {action.currentDayNumber}
        </button>
      )}

      {action.action === 'protocol_complete' && action.summary && (
        <div>
          <h2>Results</h2>
          <p>Tolerated: {action.summary.toleratedFoods.join(', ')}</p>
          <p>Sensitive: {action.summary.sensitiveFoods.join(', ')}</p>
          <p>Triggers: {action.summary.triggerFoods.join(', ')}</p>
        </div>
      )}
    </div>
  );
}
```

## Additional Resources

- See `types.ts` for complete type definitions
- See `config.ts` for protocol configuration
- See `__tests__/` directory for comprehensive test examples
- See design document for architecture details

## Support

For questions or issues, please refer to the test suite for usage examples or consult the design documentation.
