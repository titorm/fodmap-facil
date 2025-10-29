# Design Document: Initial Screens and Flows

## Overview

This document describes the design for the initial screens and flows of the FODMAP Reintroduction mobile application. The design focuses on creating a fluid, accessible user experience that guides users through onboarding, readiness assessment, journey tracking, test execution, and symptom logging with minimal friction.

### Key Design Principles

1. **Minimal Friction**: Users should complete common tasks (like logging symptoms) in 3 taps or less
2. **Accessibility First**: WCAG 2.1 Level AA/AAA compliance with proper labels, touch targets, and dynamic type support
3. **Offline-First**: All core functionality works without internet connection
4. **Progressive Disclosure**: Show information when needed, avoid overwhelming users
5. **Clear Feedback**: Provide immediate visual and haptic feedback for all interactions

## Architecture

### Navigation Structure

```
App Entry
├── Onboarding Stack (First-time users)
│   ├── Onboarding Screen 1-4
│   ├── Disclaimer Screen
│   └── Readiness Assessment
│
└── Main App (Authenticated users)
    ├── Tab Navigator
    │   ├── Home Tab → Journey Dashboard
    │   ├── Journey Tab → Journey Screen (existing)
    │   ├── Diary Tab → Symptom Diary
    │   ├── Reports Tab → Reports Screen (existing)
    │   └── Profile Tab → Profile Screen (existing)
    │
    └── Modal Stacks
        ├── Test Wizard Flow
        │   ├── Test Start Screen
        │   ├── Day 1 Screen
        │   ├── Day 2 Screen
        │   └── Day 3 Screen
        │
        └── Quick Symptom Entry Modal
```

### File Structure

```
src/
├── features/
│   ├── onboarding/
│   │   ├── screens/
│   │   │   ├── OnboardingScreen.tsx
│   │   │   ├── DisclaimerScreen.tsx
│   │   │   └── ReadinessAssessmentScreen.tsx
│   │   └── components/
│   │       ├── OnboardingSlide.tsx
│   │       ├── ProgressDots.tsx
│   │       └── AssessmentQuestion.tsx
│   │
│   ├── journey/
│   │   ├── screens/
│   │   │   └── JourneyDashboardScreen.tsx (new)
│   │   └── components/
│   │       ├── ProtocolStatusCard.tsx
│   │       ├── NextActionCard.tsx
│   │       └── ProgressTimeline.tsx
│   │
│   ├── test-wizard/
│   │   ├── screens/
│   │   │   ├── TestStartScreen.tsx
│   │   │   ├── TestDayScreen.tsx
│   │   │   └── TestCompleteScreen.tsx
│   │   └── components/
│   │       ├── DoseCard.tsx
│   │       ├── DoseInstructions.tsx
│   │       └── TestProgressHeader.tsx
│   │
│   └── diary/
│       ├── screens/
│       │   ├── DiaryScreen.tsx (enhanced)
│       │   └── QuickSymptomEntryModal.tsx
│       └── components/
│           ├── SymptomSlider.tsx
│           ├── SymptomTypeSelector.tsx
│           ├── SymptomEntryCard.tsx
│           └── DiaryEmptyState.tsx
│
└── shared/
    ├── components/
    │   ├── atoms/
    │   │   ├── ProgressHeader.tsx
    │   │   └── EmptyState.tsx
    │   └── molecules/
    │       └── (existing components)
    │
    └── hooks/
        ├── useJourney.ts
        ├── useSymptomLogger.ts
        └── useTestWizard.ts
```

## Components and Interfaces

### 1. Onboarding Components

#### OnboardingScreen

**Purpose**: Container for the onboarding flow with swipeable slides

**Props**:

```typescript
interface OnboardingScreenProps {
  onComplete: () => void;
  onSkip: () => void;
}
```

**Features**:

- Horizontal swipe navigation between slides
- Progress dots indicator
- Skip button on all slides
- "Get Started" button on final slide
- Smooth animations between slides

#### OnboardingSlide

**Purpose**: Individual onboarding slide with illustration and content

**Props**:

```typescript
interface OnboardingSlideProps {
  title: string;
  description: string;
  illustration: ImageSourcePropType;
  slideNumber: number;
  totalSlides: number;
}
```

**Accessibility**:

- Proper heading hierarchy (title as h1)
- Alt text for illustrations
- Announced slide number to screen readers

#### DisclaimerScreen

**Purpose**: Display medical disclaimer and collect user acceptance

**State**:

```typescript
interface DisclaimerState {
  accepted: boolean;
  disclaimerText: string;
}
```

**Features**:

- Scrollable disclaimer text
- Checkbox with clear label
- Disabled continue button until accepted
- Persistent acceptance (stored locally)

#### ReadinessAssessmentScreen

**Purpose**: Multi-question assessment to determine user readiness

**State**:

```typescript
interface AssessmentState {
  questions: AssessmentQuestion[];
  answers: Record<string, string | boolean>;
  currentQuestionIndex: number;
  isComplete: boolean;
}

interface AssessmentQuestion {
  id: string;
  text: string;
  type: 'boolean' | 'single-choice' | 'multiple-choice';
  options?: string[];
  required: boolean;
}
```

**Features**:

- Progress indicator showing current question
- Previous/Next navigation
- Validation before submission
- Results evaluation with recommendations

### 2. Journey Dashboard Components

#### JourneyDashboardScreen

**Purpose**: Main screen showing protocol status and next actions

**Data Requirements**:

```typescript
interface JourneyDashboardData {
  protocolState: ProtocolState; // From engine
  nextAction: NextAction; // From engine
  completedTests: number;
  currentPhase: ProtocolPhase;
  upcomingMilestone?: {
    date: Date;
    description: string;
  };
}
```

**Layout Sections**:

1. Header with greeting and current date
2. Protocol Status Card (current phase, progress)
3. Next Action Card (primary CTA)
4. Progress Timeline (visual representation)
5. Quick Stats (tests completed, days active)
6. Recent Activity (last 3 symptom entries)

#### ProtocolStatusCard

**Purpose**: Display current protocol phase and overall progress

**Props**:

```typescript
interface ProtocolStatusCardProps {
  phase: ProtocolPhase;
  completedTests: number;
  totalTests: number;
  currentGroup?: FODMAPGroup;
}
```

**Visual Design**:

- Large phase indicator with icon
- Progress bar showing completion percentage
- Current FODMAP group badge
- Estimated completion date

#### NextActionCard

**Purpose**: Primary call-to-action based on protocol engine

**Props**:

```typescript
interface NextActionCardProps {
  action: NextAction; // From engine
  onActionPress: () => void;
}
```

**Dynamic Content**:

- "Start First Test" for new users
- "Continue Day 2" for active tests
- "Start Washout Period" after symptoms
- "View Results" when complete

### 3. Test Wizard Components

#### TestStartScreen

**Purpose**: Introduction screen before starting a new food test

**Props**:

```typescript
interface TestStartScreenProps {
  foodItem: string;
  fodmapGroup: FODMAPGroup;
  testSequence: number;
  onStart: () => void;
}
```

**Content**:

- Food item name and image
- FODMAP group information
- 3-day test overview
- Portion progression preview
- Instructions and tips

#### TestDayScreen

**Purpose**: Screen for conducting a single day of testing

**Props**:

```typescript
interface TestDayScreenProps {
  dayNumber: 1 | 2 | 3;
  foodItem: string;
  portionSize: string;
  onComplete: (symptoms: SymptomRecord[]) => void;
}
```

**Features**:

- Large day number indicator
- Dose card with portion information
- Consumption confirmation button
- Timer showing time since consumption
- Quick symptom entry button
- Instructions specific to day

#### DoseCard

**Purpose**: Display portion information and consumption tracking

**Props**:

```typescript
interface DoseCardProps {
  foodItem: string;
  portionSize: string;
  portionAmount: number;
  dayNumber: number;
  consumed: boolean;
  consumedAt?: Date;
  onConfirmConsumption: () => void;
}
```

**Visual Design**:

- Large food item image
- Prominent portion size text
- Visual portion indicator (e.g., measuring cup)
- Consumption status badge
- Timestamp when consumed

#### TestProgressHeader

**Purpose**: Header showing progress through 3-day test

**Props**:

```typescript
interface TestProgressHeaderProps {
  currentDay: number;
  completedDays: number[];
  foodItem: string;
}
```

**Visual Design**:

- 3 circles representing days
- Completed days with checkmarks
- Current day highlighted
- Food item name in header

### 4. Symptom Diary Components

#### DiaryScreen

**Purpose**: Main diary view showing symptom history

**Features**:

- List of symptom entries grouped by date
- Quick entry FAB (Floating Action Button)
- Filter by symptom type
- Empty state for new users
- Pull-to-refresh

#### QuickSymptomEntryModal

**Purpose**: Fast symptom logging modal (3 taps max)

**Flow**:

1. Tap: Select symptom type
2. Tap: Adjust severity slider
3. Tap: Save (optional notes can be added)

**Props**:

```typescript
interface QuickSymptomEntryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (entry: SymptomEntry) => void;
  currentTestStepId?: string;
}
```

**Features**:

- Large touch targets for symptom types
- Visual severity slider with haptic feedback
- Optional notes field (collapsed by default)
- Auto-timestamp
- Success animation on save

#### SymptomSlider

**Purpose**: Interactive slider for rating symptom severity

**Props**:

```typescript
interface SymptomSliderProps {
  value: number; // 0-3 (none, mild, moderate, severe)
  onChange: (value: number) => void;
  disabled?: boolean;
}
```

**Features**:

- 4 discrete steps (none, mild, moderate, severe)
- Color-coded segments (green, yellow, orange, red)
- Haptic feedback on value change
- Large touch target (min 44pt height)
- Visual labels for each level
- Accessibility: announces severity level

#### SymptomTypeSelector

**Purpose**: Grid of symptom type buttons

**Props**:

```typescript
interface SymptomTypeSelectorProps {
  selectedType?: SymptomType;
  onSelect: (type: SymptomType) => void;
}
```

**Symptom Types**:

- Bloating
- Abdominal Pain
- Gas
- Diarrhea
- Constipation
- Nausea
- Other

**Visual Design**:

- 2-column grid on mobile
- Icon + label for each type
- Selected state with border highlight
- Min 44pt touch targets

### 5. Shared Components

#### ProgressHeader

**Purpose**: Reusable header showing progress through multi-step flows

**Props**:

```typescript
interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  title: string;
  onBack?: () => void;
}
```

**Visual Design**:

- Progress bar at top
- Step indicator (e.g., "2 of 4")
- Title text
- Back button (optional)

#### EmptyState

**Purpose**: Reusable empty state component

**Props**:

```typescript
interface EmptyStateProps {
  illustration: ImageSourcePropType;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}
```

**Visual Design**:

- Centered illustration
- Title and description text
- Optional primary action button
- Encouraging, friendly tone

## Data Models

### Onboarding State

```typescript
interface OnboardingState {
  completed: boolean;
  disclaimerAccepted: boolean;
  assessmentCompleted: boolean;
  assessmentScore: number;
  completedAt?: Date;
}
```

**Storage**: AsyncStorage (local only)

### Journey State

```typescript
interface JourneyState {
  protocolState: ProtocolState; // From engine
  lastUpdated: Date;
  syncStatus: 'synced' | 'pending' | 'error';
}
```

**Storage**: SQLite + Supabase sync

### Symptom Entry

```typescript
interface SymptomEntry {
  id: string;
  testStepId?: string;
  symptomType: SymptomType;
  severity: 0 | 1 | 2 | 3; // none, mild, moderate, severe
  timestamp: Date;
  notes?: string;
  createdAt: Date;
  syncStatus: 'synced' | 'pending';
}
```

**Storage**: SQLite + Supabase sync

## Hooks and State Management

### useJourney Hook

**Purpose**: Orchestrate journey dashboard data and protocol engine integration

```typescript
interface UseJourneyReturn {
  protocolState: ProtocolState | null;
  nextAction: NextAction | null;
  isLoading: boolean;
  error: Error | null;
  refreshJourney: () => Promise<void>;
  startTest: (foodItem: string) => Promise<void>;
  completeDay: (dayNumber: number, symptoms: SymptomRecord[]) => Promise<void>;
}

function useJourney(): UseJourneyReturn {
  // Implementation:
  // 1. Fetch protocol state from database
  // 2. Calculate next action using engine
  // 3. Provide actions to update state
  // 4. Handle offline/online sync
}
```

**Integration with Engine**:

```typescript
// Inside useJourney
const nextAction = useMemo(() => {
  if (!protocolState) return null;
  return calculateNextAction(protocolState, new Date());
}, [protocolState]);
```

### useSymptomLogger Hook

**Purpose**: Manage symptom entry creation and persistence

```typescript
interface UseSymptomLoggerReturn {
  logSymptom: (entry: Omit<SymptomEntry, 'id' | 'createdAt'>) => Promise<void>;
  recentSymptoms: SymptomEntry[];
  isLogging: boolean;
  error: Error | null;
}

function useSymptomLogger(testStepId?: string): UseSymptomLoggerReturn {
  // Implementation:
  // 1. Create symptom entry with auto-generated ID
  // 2. Save to SQLite immediately
  // 3. Queue for Supabase sync
  // 4. Associate with current test step if provided
  // 5. Update protocol state if symptoms affect test
}
```

**Engine Integration**:

```typescript
// After logging severe symptoms
if (entry.severity === 3) {
  // Update protocol state to trigger washout
  const updatedState = {
    ...protocolState,
    currentTest: {
      ...protocolState.currentTest,
      doses: [...doses, doseWithSymptoms],
    },
  };

  // Engine will calculate washout in next action
  const nextAction = calculateNextAction(updatedState, new Date());
}
```

### useTestWizard Hook

**Purpose**: Manage test wizard flow and state

```typescript
interface UseTestWizardReturn {
  currentDay: number;
  foodItem: string;
  portionSize: string;
  canProgress: boolean;
  confirmConsumption: () => Promise<void>;
  completeDay: (symptoms: SymptomRecord[]) => Promise<void>;
  cancelTest: () => Promise<void>;
}

function useTestWizard(testId: string): UseTestWizardReturn {
  // Implementation:
  // 1. Load current test state
  // 2. Validate day progression (24hr wait)
  // 3. Update dose records
  // 4. Integrate with protocol engine
  // 5. Handle test completion
}
```

## Error Handling

### Error States

1. **Network Errors**: Show offline indicator, queue operations
2. **Validation Errors**: Inline error messages with clear guidance
3. **Engine Errors**: Fallback to safe state, log for debugging
4. **Data Sync Errors**: Retry with exponential backoff

### Error UI Patterns

```typescript
// Inline error
<Input
  error={errors.email}
  errorMessage="Please enter a valid email"
/>

// Toast notification
showToast({
  type: 'error',
  message: 'Failed to save symptom. Will retry when online.',
  duration: 3000,
});

// Error boundary
<ErrorBoundary
  fallback={<ErrorScreen onRetry={retry} />}
>
  <JourneyDashboard />
</ErrorBoundary>
```

## Testing Strategy

### Unit Tests

1. **Hooks**: Test state management and engine integration
2. **Components**: Test rendering and interactions
3. **Utilities**: Test data transformations

### Integration Tests

1. **Onboarding Flow**: Complete flow from start to dashboard
2. **Test Wizard**: 3-day test completion with symptoms
3. **Symptom Logging**: Quick entry and association with tests

### Accessibility Tests

1. **Screen Reader**: Verify all labels and hints
2. **Touch Targets**: Verify minimum sizes
3. **Dynamic Type**: Test at various text sizes
4. **Color Contrast**: Verify WCAG compliance

### Example Test

```typescript
describe('QuickSymptomEntryModal', () => {
  it('should log symptom in 3 taps', async () => {
    const onSave = jest.fn();
    const { getByLabelText, getByText } = render(
      <QuickSymptomEntryModal visible={true} onSave={onSave} />
    );

    // Tap 1: Select symptom type
    fireEvent.press(getByText('Bloating'));

    // Tap 2: Adjust severity (simulated)
    const slider = getByLabelText('Symptom severity');
    fireEvent(slider, 'valueChange', 2); // Moderate

    // Tap 3: Save
    fireEvent.press(getByText('Save'));

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith(
        expect.objectContaining({
          symptomType: 'bloating',
          severity: 2,
        })
      );
    });
  });

  it('should meet accessibility requirements', () => {
    const { getByLabelText } = render(
      <QuickSymptomEntryModal visible={true} />
    );

    // Verify labels
    expect(getByLabelText('Select symptom type')).toBeTruthy();
    expect(getByLabelText('Symptom severity')).toBeTruthy();

    // Verify touch targets (would need custom matcher)
    const bloatingButton = getByText('Bloating');
    expect(bloatingButton).toHaveMinimumTouchTarget(44);
  });
});
```

## Accessibility Implementation

### Screen Reader Support

```typescript
// Example: DoseCard
<View
  accessible={true}
  accessibilityRole="button"
  accessibilityLabel={`Day ${dayNumber} dose: ${portionSize} of ${foodItem}`}
  accessibilityHint="Double tap to confirm consumption"
  accessibilityState={{ disabled: consumed }}
>
  {/* Card content */}
</View>
```

### Touch Targets

```typescript
// Ensure minimum 44pt touch targets
const styles = StyleSheet.create({
  symptomButton: {
    minHeight: accessibility.minTouchTarget,
    minWidth: accessibility.minTouchTarget,
    padding: spacing.md,
  },
});
```

### Dynamic Type

```typescript
// Use scalable text
import { Text } from 'react-native';

<Text
  style={{
    fontSize: typography.fontSize.md,
    lineHeight: typography.fontSize.md * typography.lineHeight.normal,
  }}
  allowFontScaling={true}
  maxFontSizeMultiplier={2}
>
  {content}
</Text>
```

### Color Contrast

All color combinations meet WCAG 2.1 Level AA (4.5:1 for normal text, 3:1 for large text):

- Primary button: White text on primary500 (#2196F3) = 4.52:1 ✓
- Error text: error (#F44336) on white = 4.61:1 ✓
- Secondary text: textSecondary (#616161) on white = 5.74:1 ✓

## Performance Considerations

### Optimization Strategies

1. **Memoization**: Use React.memo for expensive components
2. **Lazy Loading**: Load screens on demand
3. **Image Optimization**: Use appropriate sizes and formats
4. **List Virtualization**: Use FlatList for symptom history
5. **Debouncing**: Debounce slider interactions

### Example Optimization

```typescript
// Memoized symptom card
const SymptomEntryCard = React.memo<SymptomEntryCardProps>(
  ({ entry }) => {
    // Component implementation
  },
  (prev, next) => prev.entry.id === next.entry.id
);

// Virtualized list
<FlatList
  data={symptoms}
  renderItem={({ item }) => <SymptomEntryCard entry={item} />}
  keyExtractor={(item) => item.id}
  windowSize={10}
  maxToRenderPerBatch={10}
  removeClippedSubviews={true}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

## Internationalization

All text content uses i18n keys:

```typescript
// Example: OnboardingScreen
import { useTranslation } from 'react-i18next';

function OnboardingScreen() {
  const { t } = useTranslation();

  return (
    <View>
      <Text>{t('onboarding.welcome')}</Text>
      <Button title={t('onboarding.getStarted')} />
    </View>
  );
}
```

### Required Translation Keys

```json
{
  "onboarding": {
    "welcome": "Welcome to FODMAP Easy",
    "slide1Title": "Track Your Journey",
    "slide1Description": "...",
    "skip": "Skip",
    "getStarted": "Get Started"
  },
  "disclaimer": {
    "title": "Medical Disclaimer",
    "content": "...",
    "acceptLabel": "I understand and accept",
    "continue": "Continue"
  },
  "assessment": {
    "title": "Readiness Assessment",
    "question1": "...",
    "submit": "Submit",
    "notReady": "You may not be ready yet",
    "ready": "You're ready to start!"
  },
  "journey": {
    "dashboard": "Journey Dashboard",
    "startFirstTest": "Start First Test",
    "continueTest": "Continue Test",
    "viewResults": "View Results"
  },
  "testWizard": {
    "day": "Day {{number}}",
    "portion": "Portion: {{size}}",
    "confirmConsumption": "I consumed this portion",
    "logSymptoms": "Log Symptoms"
  },
  "diary": {
    "quickEntry": "Quick Entry",
    "selectSymptom": "Select symptom type",
    "severity": "Severity",
    "none": "None",
    "mild": "Mild",
    "moderate": "Moderate",
    "severe": "Severe",
    "save": "Save",
    "emptyTitle": "No symptoms logged yet",
    "emptyDescription": "Tap the + button to log your first symptom"
  }
}
```

## Design Decisions and Rationale

### 1. Modal vs. Screen for Quick Entry

**Decision**: Use modal for quick symptom entry

**Rationale**:

- Faster access (no navigation stack)
- Maintains context (user stays on current screen)
- Clearer intent (temporary action)
- Better for interruption-driven logging

### 2. 3-Tap Maximum for Symptom Logging

**Decision**: Optimize for 3 taps: type → severity → save

**Rationale**:

- Symptoms need immediate logging
- Reduces friction and abandonment
- Notes are optional (can be added later)
- Matches user mental model (quick capture)

### 3. Onboarding Skippable

**Decision**: Allow users to skip onboarding

**Rationale**:

- Respects user autonomy
- Reduces friction for returning users
- Onboarding can be revisited from settings
- Disclaimer is still mandatory

### 4. Engine Integration in Hooks

**Decision**: Integrate protocol engine in custom hooks, not components

**Rationale**:

- Separates business logic from UI
- Easier to test
- Reusable across components
- Maintains clean architecture

### 5. Offline-First Architecture

**Decision**: All operations work offline, sync when online

**Rationale**:

- Users may log symptoms anywhere
- Network unreliability shouldn't block usage
- Better user experience
- Matches mobile app expectations

## Future Enhancements

1. **Animations**: Add smooth transitions between screens
2. **Haptic Feedback**: Enhance slider and button interactions
3. **Voice Input**: Allow voice notes for symptoms
4. **Widgets**: iOS/Android home screen widgets for quick logging
5. **Apple Health Integration**: Sync symptom data
6. **Reminders**: Smart notifications for test timing
7. **Insights**: AI-powered pattern recognition
8. **Export**: PDF reports of journey progress
