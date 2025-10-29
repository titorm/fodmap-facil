# Notification Action Handlers Usage Guide

This guide explains how to use the notification action handlers to respond to user interactions with notification buttons.

## Overview

The notification action handlers system allows users to interact with notifications through action buttons without opening the app. This includes:

- **Mark Taken**: Mark a dose as taken directly from the notification
- **Snooze**: Snooze a dose reminder for 15 minutes
- **Log Now**: Open the symptom logging screen
- **Start Test**: Open the test start screen

## Setup

### 1. Initialize in App Root

Set up the notification system in your app's root component (e.g., `App.tsx`):

```typescript
import { useNotificationSetup } from './services/notifications';
import { useNavigation } from '@react-navigation/native';

function App() {
  const navigation = useNavigation();

  // Set up notifications with action handler context
  useNotificationSetup({
    navigation,
    onTestStepUpdate: async (testStepId, updates) => {
      // Update test step in your database
      await testStepRepository.update(testStepId, updates);
    },
    onSymptomLogOpen: () => {
      // Optional: Custom logic when symptom log is opened
      console.log('Opening symptom log');
    },
  });

  return <YourAppContent />;
}
```

### 2. Configure Action Handlers Context

The action handlers need context to perform their operations. You can set this up in two ways:

#### Option A: Pass context to useNotificationSetup (Recommended)

```typescript
useNotificationSetup({
  navigation: navigationRef.current,
  onTestStepUpdate: async (testStepId, updates) => {
    // Your update logic here
    await updateTestStep(testStepId, updates);
  },
  onSymptomLogOpen: () => {
    // Your navigation logic here
    navigationRef.current?.navigate('DiaryScreen');
  },
});
```

#### Option B: Set context manually

```typescript
import { notificationActionHandlers } from './services/notifications';

notificationActionHandlers.setContext({
  navigation: navigationRef.current,
  onTestStepUpdate: async (testStepId, updates) => {
    await updateTestStep(testStepId, updates);
  },
  onSymptomLogOpen: () => {
    navigationRef.current?.navigate('DiaryScreen');
  },
});
```

## Action Handler Details

### Mark Taken Action

When a user taps "Mark Taken" on a dose reminder:

1. The test step is updated with `doseTaken: true` and `doseTakenAt: Date`
2. All remaining dose reminders for that test step are cancelled
3. The action is tracked in notification history

**Requirements:**

- `onTestStepUpdate` callback must be provided in context
- Test step ID must be in notification data as `relatedEntityId`

### Snooze Action

When a user taps "Snooze 15min" on a dose reminder:

1. The current dose reminder is cancelled
2. A new reminder is scheduled 15 minutes from now
3. The action is tracked in notification history

**Requirements:**

- Test step ID must be in notification data as `relatedEntityId`

### Log Now Action

When a user taps "Log Now" on a daily reminder:

1. The app opens to the symptom logging screen (DiaryScreen)
2. The action is tracked in notification history

**Requirements:**

- `navigation` or `onSymptomLogOpen` callback must be provided in context

### Start Test Action

When a user taps "Start Test" on a test start reminder:

1. The app opens to the test start screen with the test step ID
2. The action is tracked in notification history

**Requirements:**

- `navigation` must be provided in context
- Test step ID must be in notification data as `relatedEntityId`

## Notification Data Structure

For action handlers to work correctly, notifications must include the following data:

```typescript
{
  type: NotificationType, // e.g., 'dose_reminder', 'daily_reminder'
  relatedEntityId: string, // ID of the related entity (test step, washout, etc.)
  relatedEntityType: string, // Type of entity ('test_step', 'washout', etc.)
  // ... other custom data
}
```

## Example: Scheduling a Notification with Actions

```typescript
import { notificationService } from './services/notifications';

// Schedule a dose reminder with action buttons
await notificationService.scheduleDoseReminder({
  id: 'test-step-123',
  scheduledDate: new Date('2024-01-15T10:00:00'),
  foodItemId: 'food-456',
  foodName: 'Wheat Bread',
  doseAmount: '2 slices',
});

// The notification will automatically include:
// - "Mark Taken" button
// - "Snooze 15min" button
// - Proper category identifier ('dose_reminder')
```

## Testing Action Handlers

### Manual Testing

1. Schedule a notification with actions
2. Wait for the notification to appear
3. Tap an action button
4. Verify the expected behavior occurs

### Programmatic Testing

```typescript
import { notificationActionHandlers } from './services/notifications';

// Set up test context
notificationActionHandlers.setContext({
  onTestStepUpdate: async (testStepId, updates) => {
    console.log('Test step updated:', testStepId, updates);
  },
});

// Simulate a notification response
const mockResponse = {
  actionIdentifier: 'mark-taken',
  notification: {
    request: {
      identifier: 'test-notification-id',
      content: {
        data: {
          type: 'dose_reminder',
          relatedEntityId: 'test-step-123',
          relatedEntityType: 'test_step',
        },
      },
    },
  },
};

await notificationActionHandlers.handleNotificationResponse(mockResponse);
```

## Troubleshooting

### Action buttons not appearing

1. Verify notification categories are registered:

   ```typescript
   import { setupNotificationCategories } from './services/notifications';
   await setupNotificationCategories();
   ```

2. Check that the notification has the correct `categoryIdentifier`:
   - Dose reminders: `'dose_reminder'`
   - Daily reminders: `'daily_reminder'`
   - Test start: `'test_start'`

### Actions not working

1. Verify context is set up correctly:

   ```typescript
   const context = notificationActionHandlers.getContext();
   console.log('Current context:', context);
   ```

2. Check notification data includes required fields:
   - `type`: NotificationType
   - `relatedEntityId`: string (for entity-specific actions)

3. Check console logs for error messages

### Navigation not working

1. Ensure navigation ref is passed to context
2. Verify screen names match your navigation configuration
3. Check that navigation is ready before handling actions

## Best Practices

1. **Always set context early**: Set up the action handler context as early as possible in your app lifecycle

2. **Handle errors gracefully**: Action handlers log errors but don't throw them to avoid crashing the app

3. **Test on both platforms**: Action button behavior can differ between iOS and Android

4. **Provide feedback**: Consider showing a toast or alert when an action completes successfully

5. **Track actions**: All actions are automatically tracked in notification history for analytics

## Related Documentation

- [Notification Service Usage](./USAGE_EXAMPLE.md)
- [Notification Scheduler Usage](./SCHEDULER_USAGE.md)
- [Protocol Scheduling Usage](./PROTOCOL_SCHEDULING_USAGE.md)
