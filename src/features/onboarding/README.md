# Onboarding Feature

This directory contains the onboarding flow for first-time users of the FODMAP Reintroduction app.

## Structure

```
onboarding/
├── components/          # Reusable onboarding components
│   ├── OnboardingSlide.tsx
│   ├── ProgressDots.tsx
│   ├── AssessmentQuestion.tsx
│   └── index.ts
├── screens/            # Onboarding screens
│   ├── OnboardingScreen.tsx
│   ├── DisclaimerScreen.tsx
│   ├── ReadinessAssessmentScreen.tsx
│   └── index.ts
├── hooks/              # State management hooks
│   ├── useOnboarding.ts
│   └── index.ts
└── types/              # TypeScript type definitions
    └── navigation.ts
```

## Features

### State Management (useOnboarding hook)

The `useOnboarding` hook manages the onboarding state using AsyncStorage:

- **State**: Tracks completion status, disclaimer acceptance, and assessment results
- **Persistence**: Automatically saves to AsyncStorage
- **Methods**:
  - `completeOnboarding()`: Mark onboarding as complete
  - `acceptDisclaimer()`: Record disclaimer acceptance
  - `completeAssessment(score)`: Save assessment results
  - `resetOnboarding()`: Clear onboarding state (for testing/debugging)

### Navigation Integration

The onboarding flow is integrated into the main app navigation:

1. **First-time users**: See onboarding flow before main app
2. **Returning users**: Skip directly to main app
3. **Flow**: Onboarding → Disclaimer → Assessment → Main App

### Screens

1. **OnboardingScreen**: Introduction slides (3-4 slides)
2. **DisclaimerScreen**: Medical disclaimer with acceptance checkbox
3. **ReadinessAssessmentScreen**: Questionnaire to assess user readiness

## Usage

The onboarding flow is automatically shown to first-time users. The navigation logic in `AppNavigator.tsx` checks the onboarding state and routes accordingly:

```typescript
{!user ? (
  <Stack.Screen name="SignIn" component={SignInScreen} />
) : !onboardingState.completed ? (
  <Stack.Screen name="OnboardingFlow" component={OnboardingFlow} />
) : (
  <Stack.Screen name="Main" component={MainTabs} />
)}
```

## Next Steps

The following components need full implementation:

1. **OnboardingSlide**: Add swipeable slides with illustrations
2. **ProgressDots**: Visual progress indicator
3. **AssessmentQuestion**: Question components with different input types
4. **Screen implementations**: Add full UI and logic for each screen

See `tasks.md` for detailed implementation tasks.
