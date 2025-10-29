# Navigation Integration

This module handles the navigation structure for the FODMAP Reintroduction app, including deep linking support.

## Structure

### AppNavigator

The main navigation component that orchestrates the app's navigation flow:

1. **Authentication Flow**: SignIn screen for unauthenticated users
2. **Onboarding Flow**: Multi-step onboarding for first-time users
3. **Main App**: Tab-based navigation for authenticated users
4. **Modal Stacks**: Test wizard and quick symptom entry modals

### Navigation Hierarchy

```
Root Stack
├── SignIn (if not authenticated)
├── OnboardingFlow (if not completed onboarding)
│   ├── Onboarding
│   ├── Disclaimer
│   └── ReadinessAssessment
└── Main (authenticated & onboarded)
    ├── Tab Navigator
    │   ├── Home (Journey Dashboard)
    │   ├── Diário (Symptom Diary)
    │   ├── Testes (Tests)
    │   ├── Relatórios (Reports)
    │   └── Perfil (Profile)
    └── Modal Stacks
        └── TestWizardFlow
            ├── TestStart
            ├── TestDay
            └── TestComplete
```

## Deep Linking

### Supported Deep Links

The app supports the following deep link patterns:

#### Quick Symptom Entry

```
fodmap://symptom/quick
fodmap://symptom/quick?testStepId=123
```

Opens the quick symptom entry modal, optionally associated with a specific test step.

#### Test Wizard

```
fodmap://test/123
```

Opens the test wizard for the specified test step ID.

#### Navigation

```
fodmap://home
fodmap://diary
fodmap://tests
fodmap://reports
fodmap://profile
```

Navigates to the specified tab in the main app.

### Usage

#### Opening Quick Symptom Entry Programmatically

```typescript
import { useQuickSymptom } from '../navigation';

function MyComponent() {
  const { openQuickSymptom } = useQuickSymptom();

  const handleLogSymptom = () => {
    // Open without test step
    openQuickSymptom();

    // Or with test step
    openQuickSymptom('test-step-123');
  };

  return <Button onPress={handleLogSymptom} title="Log Symptom" />;
}
```

#### Creating Deep Links

```typescript
import { createQuickSymptomDeepLink, createTestWizardDeepLink } from '../navigation';

// Create a deep link for quick symptom entry
const symptomLink = createQuickSymptomDeepLink();
// Result: "fodmap://symptom/quick"

const symptomLinkWithTest = createQuickSymptomDeepLink('test-123');
// Result: "fodmap://symptom/quick?testStepId=test-123"

// Create a deep link for test wizard
const testLink = createTestWizardDeepLink('test-456');
// Result: "fodmap://test/test-456"
```

#### Subscribing to Deep Links

```typescript
import { subscribeToDeepLinks } from '../navigation';

useEffect(() => {
  const unsubscribe = subscribeToDeepLinks((action) => {
    switch (action.type) {
      case 'quick_symptom':
        console.log('Open quick symptom entry', action.testStepId);
        break;
      case 'test_wizard':
        console.log('Open test wizard', action.testStepId);
        break;
      case 'navigate':
        console.log('Navigate to', action.screen);
        break;
    }
  });

  return unsubscribe;
}, []);
```

## Test Wizard Integration

The test wizard is implemented as a modal stack that can be opened from anywhere in the app:

```typescript
// From any screen with navigation access
navigation.navigate('TestWizardFlow', {
  testStepId: 'test-123',
  foodItem: 'Wheat',
  fodmapGroup: 'oligosaccharides',
  testSequence: 1,
});
```

The test wizard flow includes:

1. **TestStart**: Introduction screen with test overview
2. **TestDay**: Daily dose tracking and symptom logging
3. **TestComplete**: Results and tolerance status

## Accessibility

All navigation elements include proper accessibility labels:

- Tab bar items have descriptive labels explaining their purpose
- Modal presentations announce their context to screen readers
- Navigation actions provide appropriate hints

## Future Enhancements

- [ ] Add support for universal links (https://fodmap.app/...)
- [ ] Implement notification-triggered deep links
- [ ] Add widget support for quick symptom entry
- [ ] Support for sharing test results via deep links
