# NotificationService Usage Examples

This document provides examples of how to use the NotificationService for managing notifications in the FODMAP Fácil app.

## Basic Setup

```typescript
import { notificationService } from '@/services/notifications';
```

## Permission Management

### Request Permission

```typescript
// Request notification permission from the user
const status = await notificationService.requestPermission();

if (status === 'granted') {
  console.log('Permission granted!');
} else if (status === 'denied') {
  console.log('Permission denied');
}
```

### Check Permission Status

```typescript
// Check current permission status
const status = await notificationService.checkPermission();
console.log('Current permission status:', status);
```

### Open Settings

```typescript
// Guide user to device settings to enable notifications
await notificationService.openSettings();
```

## Scheduling Notifications

### Schedule a Daily Reminder

```typescript
// Schedule a daily reminder at 8 PM
const notificationId = await notificationService.schedule({
  title: 'Time to log your symptoms',
  body: "Take a moment to record how you're feeling today",
  data: {
    type: 'daily_reminder',
  },
  trigger: {
    type: 'daily',
    hour: 20,
    minute: 0,
    repeats: true,
  },
  categoryIdentifier: 'daily-reminder',
  sound: true,
});

console.log('Scheduled notification:', notificationId);
```

### Schedule a One-Time Notification

```typescript
// Schedule a notification for a specific date/time
const doseTime = new Date();
doseTime.setHours(doseTime.getHours() + 2); // 2 hours from now

const notificationId = await notificationService.schedule({
  title: 'Time for your test dose',
  body: 'Take 1 tablespoon of honey',
  data: {
    type: 'dose_reminder',
    relatedEntityId: 'test-step-123',
    relatedEntityType: 'test_step',
  },
  trigger: {
    type: 'date',
    date: doseTime,
  },
  categoryIdentifier: 'dose-reminder',
  sound: true,
  badge: 1,
});
```

### Schedule Multiple Notifications

```typescript
// Schedule washout start, warning, and end notifications
const washoutStart = new Date();
const washoutEnd = new Date(washoutStart);
washoutEnd.setDate(washoutEnd.getDate() + 3); // 3 days later

const washoutWarning = new Date(washoutEnd);
washoutWarning.setHours(washoutWarning.getHours() - 24); // 24 hours before end

const notifications = await Promise.all([
  notificationService.schedule({
    title: 'Washout period started',
    body: 'Avoid trigger foods for the next 3 days',
    data: { type: 'washout_start', relatedEntityId: 'washout-456' },
    trigger: { type: 'date', date: washoutStart },
  }),
  notificationService.schedule({
    title: 'Washout ending soon',
    body: 'Your washout period ends in 24 hours',
    data: { type: 'washout_warning', relatedEntityId: 'washout-456' },
    trigger: { type: 'date', date: washoutWarning },
  }),
  notificationService.schedule({
    title: 'Washout complete',
    body: 'You can now start your next test',
    data: { type: 'washout_end', relatedEntityId: 'washout-456' },
    trigger: { type: 'date', date: washoutEnd },
  }),
]);

console.log('Scheduled washout notifications:', notifications);
```

## Canceling Notifications

### Cancel a Specific Notification

```typescript
// Cancel a notification by ID
await notificationService.cancel(notificationId);
```

### Cancel All Notifications

```typescript
// Cancel all scheduled notifications
await notificationService.cancelAll();
```

### Cancel Notifications by Type

```typescript
// Cancel all daily reminders
await notificationService.cancelNotificationsByType('daily_reminder');

// Cancel all dose reminders
await notificationService.cancelNotificationsByType('dose_reminder');
```

## Handling Notification Responses

### Set Up Notification Listeners

```typescript
import { useEffect } from 'react';

function App() {
  useEffect(() => {
    // Listen for notifications received while app is open
    const receivedSubscription = notificationService.onNotificationReceived(
      (notification) => {
        console.log('Notification received:', notification);
        // Show in-app alert or update UI
      }
    );

    // Listen for notification taps
    const responseSubscription = notificationService.onNotificationResponse(
      (response) => {
        console.log('Notification tapped:', response);

        // Handle deep linking
        const deepLink = notificationService.handleDeepLink(response);
        if (deepLink) {
          navigation.navigate(deepLink.screen, deepLink.params);
        }

        // Handle action buttons
        const actionId = response.actionIdentifier;
        if (actionId === 'mark-taken') {
          // Mark dose as taken
          handleDoseTaken(response.notification.request.content.data.relatedEntityId);
        } else if (actionId === 'snooze') {
          // Snooze the notification
          handleSnooze(response.notification.request.identifier);
        }
      }
    );

    // Check for notification that launched the app
    notificationService.getLastNotificationResponse().then((response) => {
      if (response) {
        const deepLink = notificationService.handleDeepLink(response);
        if (deepLink) {
          navigation.navigate(deepLink.screen, deepLink.params);
        }
      }
    });

    // Cleanup
    return () => {
      receivedSubscription.remove();
      responseSubscription.remove();
    };
  }, []);

  return <YourApp />;
}
```

## Querying Scheduled Notifications

### Get All Scheduled Notifications

```typescript
// Get all currently scheduled notifications
const scheduled = await notificationService.getScheduledNotifications();
console.log('Scheduled notifications:', scheduled);
```

## Notification History

### Get Notification History

```typescript
// Get notification history for the last 30 days
const history = await notificationService.getNotificationHistory(30);
console.log('Notification history:', history);

// Get history for the last 7 days
const recentHistory = await notificationService.getNotificationHistory(7);
```

### Mark Notification as Actioned

```typescript
// Manually mark a notification as actioned
await notificationService.markNotificationAsActioned(notificationId, 'dose_marked_taken');
```

## Error Handling

```typescript
import { NotificationError, NotificationErrorCode } from '@/services/notifications';

try {
  await notificationService.schedule({
    title: 'Test',
    body: 'Test notification',
    data: { type: 'daily_reminder' },
    trigger: { type: 'daily', hour: 20, minute: 0 },
  });
} catch (error) {
  if (error instanceof NotificationError) {
    switch (error.code) {
      case NotificationErrorCode.PERMISSION_DENIED:
        // Show UI to guide user to settings
        console.log('Permission denied. Please enable notifications in settings.');
        break;
      case NotificationErrorCode.SCHEDULING_FAILED:
        // Retry or show error message
        console.log('Failed to schedule notification. Please try again.');
        break;
      default:
        console.error('Notification error:', error.message);
    }
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Integration with Preferences Store

```typescript
import { useNotificationPreferencesStore } from '@/shared/stores/notificationPreferencesStore';

function NotificationSettings() {
  const permissionStatus = useNotificationPreferencesStore(
    (state) => state.permissionStatus
  );
  const setPermissionStatus = useNotificationPreferencesStore(
    (state) => state.setPermissionStatus
  );

  const handleRequestPermission = async () => {
    const status = await notificationService.requestPermission();
    // Store automatically updates via the service
    console.log('Permission status:', status);
  };

  return (
    <View>
      <Text>Permission Status: {permissionStatus}</Text>
      {permissionStatus !== 'granted' && (
        <Button title="Enable Notifications" onPress={handleRequestPermission} />
      )}
    </View>
  );
}
```

## Best Practices

1. **Always check permission before scheduling**: The service does this automatically, but you can check beforehand to show appropriate UI.

2. **Handle errors gracefully**: Use try-catch blocks and provide user-friendly error messages.

3. **Clean up listeners**: Always remove notification listeners when components unmount.

4. **Track notification IDs**: Store notification IDs if you need to cancel them later.

5. **Use appropriate categories**: Set `categoryIdentifier` to enable action buttons.

6. **Respect user preferences**: Check the preferences store before scheduling notifications.

7. **Test on real devices**: Notifications behave differently on simulators vs real devices.

## Testing

```typescript
// Example test setup
import { notificationService } from '@/services/notifications';

describe('NotificationService', () => {
  it('should request permission', async () => {
    const status = await notificationService.requestPermission();
    expect(['granted', 'denied', 'undetermined']).toContain(status);
  });

  it('should schedule a notification', async () => {
    const id = await notificationService.schedule({
      title: 'Test',
      body: 'Test notification',
      data: { type: 'daily_reminder' },
      trigger: { type: 'daily', hour: 20, minute: 0 },
    });
    expect(id).toBeTruthy();
  });

  it('should cancel a notification', async () => {
    const id = await notificationService.schedule({
      title: 'Test',
      body: 'Test notification',
      data: { type: 'daily_reminder' },
      trigger: { type: 'daily', hour: 20, minute: 0 },
    });
    await expect(notificationService.cancel(id)).resolves.not.toThrow();
  });
});
```
