# Protocol-Specific Notification Scheduling - Usage Examples

## Daily Symptom Reminders

### Schedule Daily Reminder

```typescript
import { notificationService } from '@/services/notifications';

// Schedule with default time (9:00 AM) or user's preferred time
const notificationId = await notificationService.scheduleDailyReminder();

// Schedule with specific time
const customTime = new Date();
customTime.setHours(20, 30, 0, 0); // 8:30 PM
const notificationId = await notificationService.scheduleDailyReminder(customTime);
```

### Cancel Daily Reminder for Today

```typescript
// Call this when user logs symptoms for the day
await notificationService.cancelDailyReminderForToday();
```

## Dose Reminders

### Schedule Dose Reminder

```typescript
import { notificationService } from '@/services/notifications';

// When creating or updating a test step
const testStep = {
  id: 'test-step-123',
  scheduledDate: new Date('2025-10-30T14:00:00'), // 2:00 PM
  foodItemId: 'food-456',
  foodName: 'Wheat Bread',
  doseAmount: '2 slices',
};

// Returns array of notification IDs [preDoseId, doseTimeId]
const notificationIds = await notificationService.scheduleDoseReminder(testStep);
```

### Snooze Dose Reminder

```typescript
// When user taps "Snooze 15 min" action button
const newNotificationId = await notificationService.snoozeDoseReminder('test-step-123');
```

### Cancel Dose Reminders

```typescript
// When user marks dose as taken
await notificationService.cancelDoseReminders('test-step-123');
```

## Washout Notifications

### Schedule Washout Notifications

```typescript
import { notificationService } from '@/services/notifications';

// When creating a washout period
const washout = {
  id: 'washout-789',
  startDate: new Date('2025-10-31T00:00:00'),
  endDate: new Date('2025-11-03T00:00:00'), // 3-day washout
  protocolRunId: 'protocol-001',
};

// Returns array of notification IDs [startId, warningId, endId]
const notificationIds = await notificationService.scheduleWashoutNotifications(washout);
```

### Update Washout Notifications

```typescript
// When washout period is extended
const updatedWashout = {
  id: 'washout-789',
  startDate: new Date('2025-10-31T00:00:00'),
  endDate: new Date('2025-11-05T00:00:00'), // Extended to 5 days
  protocolRunId: 'protocol-001',
};

const notificationIds = await notificationService.updateWashoutNotifications(updatedWashout);
```

### Cancel Washout Notifications

```typescript
// When washout is cancelled or completed early
await notificationService.cancelWashoutNotifications('washout-789');
```

## Test Start Reminders

### Schedule Test Start Reminder

```typescript
import { notificationService } from '@/services/notifications';

// When a new test becomes available
const testStep = {
  id: 'test-step-456',
  foodItemId: 'food-789',
  foodName: 'Garlic',
  protocolRunId: 'protocol-001',
  availableDate: new Date(), // Available now
};

// Returns array of notification IDs [immediateId, followUpId]
const notificationIds = await notificationService.scheduleTestStartReminder(testStep);
```

### Cancel Test Start Reminders

```typescript
// When user starts the test
await notificationService.cancelTestStartReminders('test-step-456');
```

### Disable Test Start Reminders for Protocol

```typescript
// When protocol is paused
await notificationService.disableTestStartRemindersForProtocol('protocol-001');
```

### Enable Test Start Reminders for Protocol

```typescript
// When protocol is resumed
const pendingTests = [
  {
    id: 'test-step-456',
    foodItemId: 'food-789',
    foodName: 'Garlic',
    protocolRunId: 'protocol-001',
    availableDate: new Date(),
  },
  {
    id: 'test-step-457',
    foodItemId: 'food-790',
    foodName: 'Onion',
    protocolRunId: 'protocol-001',
    availableDate: new Date(),
  },
];

await notificationService.enableTestStartRemindersForProtocol('protocol-001', pendingTests);
```

## Integration with Test Wizard

```typescript
// In TestWizard component or hook
import { notificationService } from '@/services/notifications';

// When creating a new test step
const createTestStep = async (testStepData) => {
  // 1. Create test step in database
  const testStep = await testStepRepository.create(testStepData);

  // 2. Schedule dose reminders
  try {
    await notificationService.scheduleDoseReminder({
      id: testStep.id,
      scheduledDate: testStep.scheduledDate,
      foodItemId: testStep.foodItemId,
      foodName: testStep.foodItem?.name,
      doseAmount: testStep.doseAmount,
    });
  } catch (error) {
    console.error('Failed to schedule dose reminders:', error);
    // Continue - notification failure shouldn't block test creation
  }

  return testStep;
};

// When marking dose as taken
const markDoseAsTaken = async (testStepId: string) => {
  // 1. Update test step status
  await testStepRepository.update(testStepId, {
    status: 'completed',
    completedDate: new Date(),
  });

  // 2. Cancel dose reminders
  await notificationService.cancelDoseReminders(testStepId);

  // 3. Schedule washout notifications if test is complete
  // ... (see washout example above)
};
```

## Integration with Symptom Logging

```typescript
// In DiaryScreen or symptom logging component
import { notificationService } from '@/services/notifications';

const logSymptoms = async (symptomData) => {
  // 1. Save symptoms to database
  await symptomRepository.create(symptomData);

  // 2. Cancel today's daily reminder
  await notificationService.cancelDailyReminderForToday();
};
```

## Integration with Protocol Management

```typescript
// In protocol management service
import { notificationService } from '@/services/notifications';

const pauseProtocol = async (protocolRunId: string) => {
  // 1. Update protocol status
  await protocolRunRepository.update(protocolRunId, {
    status: 'paused',
  });

  // 2. Disable test start reminders
  await notificationService.disableTestStartRemindersForProtocol(protocolRunId);
};

const resumeProtocol = async (protocolRunId: string) => {
  // 1. Update protocol status
  await protocolRunRepository.update(protocolRunId, {
    status: 'active',
  });

  // 2. Get pending tests
  const pendingTests = await testStepRepository.findPending(protocolRunId);

  // 3. Re-enable test start reminders
  await notificationService.enableTestStartRemindersForProtocol(
    protocolRunId,
    pendingTests.map((test) => ({
      id: test.id,
      foodItemId: test.foodItemId,
      foodName: test.foodItem?.name,
      protocolRunId: test.protocolRunId,
      availableDate: new Date(),
    }))
  );
};
```

## Error Handling

All scheduling methods throw `NotificationError` with specific error codes:

```typescript
import { notificationService, NotificationErrorCode } from '@/services/notifications';

try {
  await notificationService.scheduleDailyReminder();
} catch (error) {
  if (error instanceof NotificationError) {
    switch (error.code) {
      case NotificationErrorCode.PERMISSION_DENIED:
        // Show permission request modal
        break;
      case NotificationErrorCode.SCHEDULING_FAILED:
        // Show error message, continue without notifications
        break;
      default:
        // Log error, show generic message
        break;
    }
  }
}
```

## Notification Response Handling

```typescript
// In App.tsx or notification setup
import { notificationService } from '@/services/notifications';

// Handle notification actions
notificationService.onNotificationResponse(async (response) => {
  const { actionIdentifier, notification } = response;
  const { data } = notification.request.content;

  if (actionIdentifier === 'mark-taken') {
    // Mark dose as taken
    await markDoseAsTaken(data.relatedEntityId);
  } else if (actionIdentifier === 'snooze') {
    // Snooze dose reminder
    await notificationService.snoozeDoseReminder(data.relatedEntityId);
  } else if (actionIdentifier === 'log-now') {
    // Navigate to symptom logging
    navigation.navigate('DiaryScreen');
  }

  // Handle deep linking
  const deepLink = notificationService.handleDeepLink(response);
  if (deepLink) {
    navigation.navigate(deepLink.screen, deepLink.params);
  }
});
```

## Best Practices

1. **Always check permissions**: All scheduling methods check permissions, but you can also check beforehand to show appropriate UI
2. **Handle errors gracefully**: Notification failures shouldn't block core functionality
3. **Cancel before rescheduling**: Methods automatically cancel existing notifications before scheduling new ones
4. **Use try-catch**: Wrap scheduling calls in try-catch to handle errors
5. **Provide feedback**: Show user feedback when notifications are scheduled or cancelled
6. **Test with different times**: Test scheduling in past, present, and future
7. **Test quiet hours**: Verify notifications are adjusted for quiet hours
8. **Test preferences**: Verify notifications respect user preferences
