# Design Document

## Overview

This design establishes a comprehensive testing and reliability infrastructure for FODMAP Facil. The solution includes:

1. **Storybook Integration**: Visual component development and testing environment for critical UI components
2. **Test Coverage Strategy**: Layered testing approach covering engine logic, hooks, screens, and optional e2e tests
3. **MSW API Mocking**: Network-level API interception for AppWrite backend simulation
4. **CI/CD Pipeline**: Automated quality gates with test execution, linting, and coverage reporting

The design prioritizes developer experience with fast feedback loops, clear test organization, and minimal configuration overhead.

## Architecture

### Testing Pyramid

```
        ┌─────────────┐
        │   E2E (5%)  │  Optional Detox tests for critical flows
        └─────────────┘
       ┌───────────────┐
       │ Integration   │  Screen-level tests with navigation
       │    (15%)      │  and data flow verification
       └───────────────┘
      ┌─────────────────┐
      │  Unit Tests     │  Engine logic, hooks, utilities
      │    (80%)        │  Fast, isolated, comprehensive
      └─────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Developer Tools                       │
├─────────────────────────────────────────────────────────┤
│  Storybook          │  Jest Test Runner  │  CI Pipeline │
│  - Component Dev    │  - Unit Tests      │  - GitHub    │
│  - Visual Testing   │  - Integration     │    Actions   │
│  - Documentation    │  - Coverage        │  - Quality   │
│                     │                    │    Gates     │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                    Test Infrastructure                   │
├─────────────────────────────────────────────────────────┤
│  MSW Handlers       │  Test Fixtures     │  Test Utils  │
│  - AppWrite API     │  - Mock Data       │  - Helpers   │
│  - Auth Mocking     │  - Scenarios       │  - Matchers  │
│  - DB Operations    │  - Edge Cases      │  - Setup     │
└─────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Under Test                  │
├─────────────────────────────────────────────────────────┤
│  Engine Logic       │  React Hooks       │  UI Screens  │
│  - FODMAP Engine    │  - useAuth         │  - Diary     │
│  - Sequence Gen     │  - useProtocol     │  - TestDay   │
│  - Tolerance Calc   │  - useSymptoms     │  - Reports   │
└─────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Storybook Configuration

**Purpose**: Provide isolated component development environment with React Native Web support

**Configuration Structure**:

```
.storybook/
├── main.js              # Storybook configuration
├── preview.js           # Global decorators and parameters
└── webpack.config.js    # Custom webpack for RN Web
```

**Key Features**:

- React Native Web integration for web-based component preview
- Theme provider decorator for consistent styling
- Accessibility addon for a11y testing
- Controls addon for interactive prop manipulation
- Viewport addon for responsive testing

**Story Structure**:

```typescript
// Component.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Component } from './Component';

const meta: Meta<typeof Component> = {
  title: 'Feature/Component',
  component: Component,
  decorators: [ThemeDecorator],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Component>;

export const Default: Story = {
  args: {
    /* props */
  },
};
```

### 2. Test Organization

**Directory Structure**:

```
src/
├── engine/
│   └── fodmapEngine/
│       └── __tests__/
│           ├── sequence.test.ts
│           ├── tolerance.test.ts
│           ├── washout.test.ts
│           └── integration.test.ts
├── shared/
│   └── hooks/
│       └── __tests__/
│           ├── useAuth.test.ts
│           ├── useProtocolRuns.test.ts
│           └── useSymptomEntries.test.ts
├── features/
│   ├── diary/
│   │   └── screens/
│   │       └── __tests__/
│   │           └── DiaryScreen.integration.test.tsx
│   └── test-wizard/
│       └── screens/
│           └── __tests__/
│               └── TestDayScreen.integration.test.tsx
└── __e2e__/                    # Optional
    ├── onboarding.e2e.ts
    └── symptom-entry.e2e.ts
```

**Test File Naming**:

- Unit tests: `*.test.ts` or `*.test.tsx`
- Integration tests: `*.integration.test.tsx`
- E2E tests: `*.e2e.ts`

### 3. MSW Configuration

**Handler Organization**:

```typescript
// src/shared/mocks/handlers/
├── auth.handlers.ts        # Authentication endpoints
├── database.handlers.ts    # TablesDB CRUD operations
├── storage.handlers.ts     # File storage operations
└── index.ts               # Aggregate all handlers
```

**Handler Pattern**:

```typescript
// database.handlers.ts
import { http, HttpResponse } from 'msw';

const APPWRITE_ENDPOINT = process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;

export const databaseHandlers = [
  // List rows with query support
  http.get(
    `${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows`,
    async ({ request, params }) => {
      const url = new URL(request.url);
      const queries = url.searchParams.get('queries');

      // Parse queries and filter mock data
      const filteredData = applyQueries(mockData, queries);

      return HttpResponse.json({
        rows: filteredData,
        total: filteredData.length,
      });
    }
  ),

  // Create row
  http.post(
    `${APPWRITE_ENDPOINT}/databases/:databaseId/tables/:tableId/rows`,
    async ({ request }) => {
      const body = await request.json();
      const newRow = createMockRow(body);

      return HttpResponse.json(newRow, { status: 201 });
    }
  ),
];
```

**Server Setup**:

```typescript
// src/shared/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);

// jest.setup.js
import { server } from './src/shared/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

### 4. Test Utilities

**Custom Render Function**:

```typescript
// src/shared/test-utils/render.tsx
import { render, RenderOptions } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

export function renderWithProviders(
  ui: React.ReactElement,
  options?: RenderOptions
) {
  const queryClient = createTestQueryClient();

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}
```

**Custom Matchers**:

```typescript
// src/shared/test-utils/matchers.ts
export const customMatchers = {
  toHaveSymptomSeverity(received: any, expected: string) {
    const severity = received.props.severity;
    const pass = severity === expected;

    return {
      pass,
      message: () => `Expected symptom severity to be ${expected}, but got ${severity}`,
    };
  },
};
```

### 5. Jest Configuration

**Multiple Config Files**:

```javascript
// jest.config.js (main)
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/**/index.ts',
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    'src/engine/fodmapEngine/**/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};

// jest.config.engine.js (engine-specific)
module.exports = {
  ...require('./jest.config'),
  testMatch: ['**/engine/**/__tests__/**/*.test.ts'],
  collectCoverageFrom: ['src/engine/**/*.ts'],
};

// jest.config.integration.js (integration tests)
module.exports = {
  ...require('./jest.config'),
  testMatch: ['**/__tests__/**/*.integration.test.tsx'],
  testTimeout: 10000,
};
```

### 6. CI/CD Pipeline

**GitHub Actions Workflow**:

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Type check
        run: pnpm type-check

      - name: Lint
        run: pnpm lint

      - name: Run tests
        run: pnpm test:ci

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unittests
          name: codecov-umbrella

      - name: Comment PR with coverage
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

## Data Models

### Test Fixtures

**Mock Data Structure**:

```typescript
// src/shared/fixtures/testData.ts
export const mockProtocolState: ProtocolState = {
  userId: 'test-user-1',
  startDate: '2024-01-01T08:00:00Z',
  completedTests: [],
  currentTest: undefined,
  currentWashout: undefined,
  phase: 'testing',
};

export const mockSymptomEntry: SymptomEntry = {
  id: 'symptom-1',
  userId: 'test-user-1',
  timestamp: '2024-01-01T12:00:00Z',
  type: 'bloating',
  severity: 'moderate',
  notes: 'Felt uncomfortable after lunch',
};

export const mockDoseRecord: DoseRecord = {
  date: '2024-01-01T08:00:00Z',
  dayNumber: 1,
  foodItem: 'Honey',
  portionSize: '1 tsp',
  portionAmount: 5,
  symptoms: [],
};
```

### Test Scenarios

**Scenario Builder Pattern**:

```typescript
// src/shared/fixtures/scenarios.ts
export class ProtocolScenarioBuilder {
  private state: ProtocolState;

  constructor() {
    this.state = { ...mockProtocolState };
  }

  withCompletedTest(test: ReintroductionTest) {
    this.state.completedTests.push(test);
    return this;
  }

  withCurrentTest(test: ReintroductionTest) {
    this.state.currentTest = test;
    return this;
  }

  inWashout(washout: WashoutPeriod) {
    this.state.currentWashout = washout;
    this.state.phase = 'washout';
    return this;
  }

  build(): ProtocolState {
    return this.state;
  }
}

// Usage in tests
const scenario = new ProtocolScenarioBuilder()
  .withCompletedTest(toleratedHoneyTest)
  .withCurrentTest(ongoingMilkTest)
  .build();
```

## Error Handling

### Test Error Scenarios

**MSW Error Handlers**:

```typescript
// src/shared/mocks/handlers/errors.ts
export const errorHandlers = {
  networkError: http.get('*', () => HttpResponse.error()),

  serverError: http.get('*', () =>
    HttpResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  ),

  unauthorized: http.get('*', () =>
    HttpResponse.json(
      { message: 'Unauthorized' },
      { status: 401 }
    )
  ),

  notFound: http.get('*', () =>
    HttpResponse.json(
      { message: 'Resource not found' },
      { status: 404 }
    )
  ),
};

// Usage in tests
import { server } from '@/shared/mocks/server';
import { errorHandlers } from '@/shared/mocks/handlers/errors';

test('handles network error gracefully', async () => {
  server.use(errorHandlers.networkError);

  const { getByText } = renderWithProviders(<DiaryScreen />);

  await waitFor(() => {
    expect(getByText(/network error/i)).toBeTruthy();
  });
});
```

### Test Failure Debugging

**Enhanced Error Messages**:

```typescript
// Custom assertion helpers
export function assertSymptomSeverity(component: any, expected: string, context?: string) {
  const actual = component.props.severity;

  if (actual !== expected) {
    throw new Error(
      `Symptom severity mismatch${context ? ` in ${context}` : ''}:\n` +
        `  Expected: ${expected}\n` +
        `  Received: ${actual}\n` +
        `  Component: ${JSON.stringify(component.props, null, 2)}`
    );
  }
}
```

## Testing Strategy

### 1. Engine Tests (90%+ Coverage)

**Test Categories**:

- **Sequence Generation**: Verify correct FODMAP group ordering
- **Tolerance Calculation**: Test dose-dependent tolerance classification
- **Washout Logic**: Validate washout duration based on symptom severity
- **Symptom Scoring**: Ensure accurate symptom aggregation
- **Edge Cases**: Handle invalid states, missing data, boundary conditions

**Example Test Structure**:

```typescript
describe('FODMAP Engine - Tolerance Calculation', () => {
  describe('tolerated foods', () => {
    it('classifies food as tolerated with no symptoms across all doses', () => {
      // Arrange
      const test = createTestWithSymptoms([]);

      // Act
      const result = calculateTolerance(test);

      // Assert
      expect(result.status).toBe('tolerated');
      expect(result.maxToleratedPortion).toBe('1 tbsp');
    });
  });

  describe('sensitive foods', () => {
    it('identifies trigger portion when moderate symptoms appear', () => {
      // Arrange
      const test = createTestWithSymptoms([
        { day: 1, severity: 'none' },
        { day: 2, severity: 'moderate' },
        { day: 3, severity: 'none' },
      ]);

      // Act
      const result = calculateTolerance(test);

      // Assert
      expect(result.status).toBe('sensitive');
      expect(result.maxToleratedPortion).toBe('1 tsp');
      expect(result.triggerPortion).toBe('2 tsp');
    });
  });
});
```

### 2. Hook Tests

**Testing Patterns**:

- **State Management**: Verify state updates and persistence
- **Side Effects**: Test API calls, notifications, storage operations
- **Error Handling**: Ensure graceful degradation on failures
- **Loading States**: Validate loading indicators and transitions

**Example Hook Test**:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useProtocolRuns } from '../useProtocolRuns';
import { wrapper } from '@/shared/test-utils';

describe('useProtocolRuns', () => {
  it('fetches protocol runs for authenticated user', async () => {
    const { result } = renderHook(() => useProtocolRuns(), { wrapper });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(2);
    expect(result.current.data[0].userId).toBe('test-user-1');
  });

  it('handles authentication error', async () => {
    server.use(errorHandlers.unauthorized);

    const { result } = renderHook(() => useProtocolRuns(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error.message).toContain('Unauthorized');
  });
});
```

### 3. Screen Integration Tests

**Testing Focus**:

- **User Interactions**: Button presses, form inputs, navigation
- **Data Flow**: Component → Hook → API → Component
- **Navigation**: Screen transitions and parameter passing
- **Accessibility**: Screen reader support, keyboard navigation

**Example Screen Test**:

```typescript
import { fireEvent, waitFor } from '@testing-library/react-native';
import { DiaryScreen } from '../DiaryScreen';
import { renderWithProviders } from '@/shared/test-utils';

describe('DiaryScreen', () => {
  it('allows user to create symptom entry', async () => {
    const { getByText, getByLabelText } = renderWithProviders(<DiaryScreen />);

    // Open modal
    fireEvent.press(getByText('Add Symptom'));

    // Select symptom type
    fireEvent.press(getByText('Bloating'));

    // Set severity
    const slider = getByLabelText('Symptom severity');
    fireEvent(slider, 'valueChange', 2); // moderate

    // Submit
    fireEvent.press(getByText('Save'));

    // Verify entry appears
    await waitFor(() => {
      expect(getByText(/bloating/i)).toBeTruthy();
      expect(getByText(/moderate/i)).toBeTruthy();
    });
  });
});
```

### 4. Storybook Stories

**Story Coverage**:

- **SymptomSlider**: All severity levels, disabled state, interaction feedback
- **DoseCard**: All dose sizes, consumed/unconsumed states, with/without image
- **ProgressHeader**: Various progress percentages, with/without back button

**Example Story**:

```typescript
// SymptomSlider.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { SymptomSlider } from './SymptomSlider';

const meta: Meta<typeof SymptomSlider> = {
  title: 'Diary/SymptomSlider',
  component: SymptomSlider,
  decorators: [ThemeDecorator],
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 3, step: 1 },
    },
    disabled: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SymptomSlider>;

export const None: Story = {
  args: {
    value: 0,
    onChange: (value) => console.log('Changed to:', value),
  },
};

export const Mild: Story = {
  args: { value: 1, onChange: () => {} },
};

export const Moderate: Story = {
  args: { value: 2, onChange: () => {} },
};

export const Severe: Story = {
  args: { value: 3, onChange: () => {} },
};

export const Disabled: Story = {
  args: { value: 2, disabled: true, onChange: () => {} },
};
```

### 5. Optional E2E Tests (Detox)

**Critical Flows**:

- Onboarding: Complete assessment and start protocol
- Symptom Entry: Log symptom from diary screen
- Test Start: Begin reintroduction test for a food

**Example E2E Test**:

```typescript
// __e2e__/symptom-entry.e2e.ts
describe('Symptom Entry Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should log a symptom entry', async () => {
    // Navigate to diary
    await element(by.text('Diary')).tap();

    // Open symptom modal
    await element(by.text('Add Symptom')).tap();

    // Select bloating
    await element(by.text('Bloating')).tap();

    // Set severity to moderate
    await element(by.id('symptom-slider')).swipe('right', 'slow', 0.5);

    // Save
    await element(by.text('Save')).tap();

    // Verify entry appears
    await expect(element(by.text('Bloating'))).toBeVisible();
    await expect(element(by.text('Moderate'))).toBeVisible();
  });
});
```

## NPM Scripts

**Package.json Scripts**:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --maxWorkers=2",
    "test:engine": "jest --config jest.config.engine.js",
    "test:hooks": "jest --testPathPattern=hooks/__tests__",
    "test:integration": "jest --config jest.config.integration.js",
    "test:e2e": "detox test --configuration ios.sim.debug",
    "test:e2e:build": "detox build --configuration ios.sim.debug",
    "storybook": "storybook dev -p 6006",
    "storybook:build": "storybook build",
    "coverage:report": "open coverage/lcov-report/index.html"
  }
}
```

## Performance Considerations

### Test Execution Speed

**Optimization Strategies**:

1. **Parallel Execution**: Use `--maxWorkers` for CI environments
2. **Test Isolation**: Avoid shared state between tests
3. **Mock Optimization**: Cache MSW handlers, reuse fixtures
4. **Selective Testing**: Run only affected tests during development

**Expected Performance**:

- Unit tests: < 5 seconds for full suite
- Integration tests: < 30 seconds for full suite
- E2E tests: < 5 minutes for critical flows

### Coverage Collection

**Incremental Coverage**:

```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/*.stories.tsx', '!src/**/__tests__/**'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: 'coverage',
};
```

## Security Considerations

### Test Data Isolation

**Principles**:

- Never use production credentials in tests
- Generate unique test user IDs per test run
- Clear test data after each test
- Use environment-specific API endpoints

**Implementation**:

```typescript
// jest.setup.js
beforeEach(() => {
  // Generate unique test user ID
  global.testUserId = `test-user-${Date.now()}-${Math.random()}`;
});

afterEach(() => {
  // Clear any persisted test data
  AsyncStorage.clear();
});
```

### Sensitive Data Handling

**Mock Data Guidelines**:

- Use generic placeholder data (no real PII)
- Sanitize any logged data in test output
- Exclude `.env.test` from version control

## Accessibility Testing

### Storybook Accessibility Addon

**Configuration**:

```javascript
// .storybook/main.js
module.exports = {
  addons: ['@storybook/addon-a11y', '@storybook/addon-controls', '@storybook/addon-viewport'],
};
```

### Automated A11y Checks

**Test Integration**:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('SymptomSlider has no accessibility violations', async () => {
  const { container } = renderWithProviders(
    <SymptomSlider value={1} onChange={() => {}} />
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

## Documentation

### Test Documentation

**README Structure**:

```markdown
# Testing Guide

## Running Tests

- `pnpm test` - Run all tests
- `pnpm test:watch` - Watch mode for development
- `pnpm test:engine` - Engine tests only
- `pnpm test:ci` - CI mode with coverage

## Writing Tests

### Unit Tests

- Place in `__tests__` directory next to source
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)

### Integration Tests

- Suffix with `.integration.test.tsx`
- Test complete user flows
- Mock external dependencies

## Coverage Requirements

- Engine: 90%+ coverage
- Hooks: 80%+ coverage
- Screens: 70%+ coverage
```

### Storybook Documentation

**Story Documentation**:

```typescript
const meta: Meta<typeof SymptomSlider> = {
  title: 'Diary/SymptomSlider',
  component: SymptomSlider,
  parameters: {
    docs: {
      description: {
        component: `
Interactive slider for rating symptom severity.

Features:
- 4 discrete levels (none, mild, moderate, severe)
- Color-coded visual feedback
- Haptic feedback on value change
- Full accessibility support
        `,
      },
    },
  },
};
```

## Migration Strategy

### Phase 1: Foundation (Week 1)

1. Configure Storybook with React Native Web
2. Set up MSW with basic AppWrite handlers
3. Create test utilities and custom render function
4. Configure Jest with coverage thresholds

### Phase 2: Component Stories (Week 1-2)

1. Create stories for SymptomSlider
2. Create stories for DoseCard
3. Create stories for ProgressHeader
4. Document component usage in Storybook

### Phase 3: Engine Tests (Week 2)

1. Achieve 90%+ coverage for sequence generation
2. Achieve 90%+ coverage for tolerance calculation
3. Achieve 90%+ coverage for washout logic
4. Add integration tests for complete protocol flows

### Phase 4: Hook & Screen Tests (Week 3)

1. Test critical hooks (useAuth, useProtocolRuns, useSymptomEntries)
2. Test DiaryScreen integration
3. Test TestDayScreen integration
4. Test ReportsScreen integration

### Phase 5: CI/CD Integration (Week 3-4)

1. Set up GitHub Actions workflow
2. Configure coverage reporting
3. Add PR comment bot for coverage
4. Set up quality gates

### Phase 6: Optional E2E (Week 4)

1. Configure Detox (if desired)
2. Create onboarding flow test
3. Create symptom entry test
4. Document E2E setup process
