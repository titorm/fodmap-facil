# NotificationScheduler Usage Guide

This document demonstrates how to use the NotificationScheduler with quiet hours support.

## Overview

The NotificationScheduler provides intelligent notification scheduling with automatic quiet hours enforcement. It handles:

- Daily, weekly, and one-time notification triggers
- Automatic quiet hours detection and adjustment
- Critical notification override for urgent reminders
- Batch scheduling operations
- Validation of trigger times

## Basic Usage

### Schedule a Daily Reminder

```typescript
import { notificationScheduler } from './services/notifications';

// Schedule a daily symptom reminder at 8 PM
const notificationId = await notificationScheduler.schedule({
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
});
```

### Schedule a One-Time Dose Reminder

```typescript
// Schedule a dose reminder for tomorrow at 2 PM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(14, 0, 0, 0);

const notificationId = await notificationScheduler.schedule({
  title: 'Time for your test dose',
  body: 'Take 1/4 cup of wheat bread',
  data: {
    type: 'dose_reminder',
    relatedEntityId: 'test-step-123',
    relatedEntityType: 'test_step',
  },
  trigger: {
    type: 'date',
    date: tomorrow,
    repeats: false,
  },
  categoryIdentifier: 'dose-reminder',
});
```

### Schedule Multiple Notifications

```typescript
// Schedule washout start, warning, and end notifications
const washoutStart = new Date();
const washoutWarning = new Date(washoutStart.getTime() + 2 * 24 * 60 * 60 * 1000); // 2 days later
const washoutEnd = new Date(washoutStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days later

const notificationIds = await notificationScheduler.scheduleMultiple([
  {
    title: 'Washout period started',
    body: 'Avoid trigger foods for the next 3 days',
    data: { type: 'washout_start', relatedEntityId: 'washout-456' },
    trigger: { type: 'date', date: washoutStart },
  },
  {
    title: 'Washout ending soon',
    body: 'Your washout period ends in 24 hours',
    data: { type: 'washout_warning', relatedEntityId: 'washout-456' },
    trigger: { type: 'date', date: washoutWarning },
  },
  {
    title: 'Washout complete',
    body: 'You can now start your next test',
    data: { type: 'washout_end', relatedEntityId: 'washout-456' },
    trigger: { type: 'date', date: washoutEnd },
  },
]);
```

## Quiet Hours

### Configure Quiet Hours

```typescript
import { quietHoursManager } from './services/notifications';

// Set quiet hours from 10 PM to 7 AM
await quietHoursManager.setQuietHours(
  { hour: 22, minute: 0 }, // 10 PM
  { hour: 7, minute: 0 } // 7 AM
);
```

### Check if Time is in Quiet Hours

```typescript
const now = new Date();
const isQuiet = quietHoursManager.isInQuietHours(now);

if (isQuiet) {
  console.log('Currently in quiet hours');
}
```

### Get Next Available Time

```typescript
// If scheduling during quiet hours, get the adjusted time
const scheduledTime = new Date();
scheduledTime.setHours(23, 0, 0, 0); // 11 PM (during quiet hours)

const adjustedTime = await quietHoursManager.getNextAvailableTime(scheduledTime);
// Returns 7:15 AM the next day (15 minutes after quiet hours end)
```

## Automatic Quiet Hours Adjustment

The scheduler automatically adjusts notification times when they fall within quiet hours:

```typescript
// Schedule a notification at 11 PM (during quiet hours 10 PM - 7 AM)
const notificationId = await notificationScheduler.schedule({
  title: 'Daily reminder',
  body: 'Log your symptoms',
  data: { type: 'daily_reminder' },
  trigger: {
    type: 'daily',
    hour: 23, // 11 PM
    minute: 0,
    repeats: true,
  },
});

// The notification will automatically be adjusted to 7:15 AM
// The notification data will include:
// - originalTime: "2024-10-29T23:00:00.000Z"
// - adjustedTime: "2024-10-30T07:15:00.000Z"
// - wasAdjusted: true
```

## Critical Notifications

Critical notifications (dose reminders within 1 hour) can override quiet hours:

```typescript
// Schedule a dose reminder for 30 minutes from now
const doseTime = new Date();
doseTime.setMinutes(doseTime.getMinutes() + 30);

// Even if this falls during quiet hours, it will be delivered
// because it's a critical dose reminder within 1 hour
const notificationId = await notificationScheduler.schedule({
  title: 'URGENT: Dose reminder',
  body: 'Take your test dose now',
  data: {
    type: 'dose_reminder',
    relatedEntityId: 'test-step-789',
  },
  trigger: {
    type: 'date',
    date: doseTime,
  },
  categoryIdentifier: 'dose-reminder',
});
```

## Query Scheduled Notifications

```typescript
// Get all scheduled notifications
const allNotifications = await notificationScheduler.getScheduledNotifications();

// Get notifications by type
const doseReminders = await notificationScheduler.getScheduledNotificationsByType('dose_reminder');

console.log(`You have ${doseReminders.length} dose reminders scheduled`);
```

## Cancel Notifications

```typescript
// Cancel a specific notification
await notificationScheduler.cancel(notificationId);

// Cancel multiple notifications
await notificationScheduler.cancelMultiple([id1, id2, id3]);
```

## Reschedule a Notification

```typescript
// Reschedule a notification to a new time
const newTime = new Date();
newTime.setHours(newTime.getHours() + 2);

await notificationScheduler.reschedule(notificationId, newTime);
```

## Error Handling

```typescript
import { NotificationError, NotificationErrorCode } from './services/notifications';

try {
  await notificationScheduler.schedule({
    title: 'Test',
    body: 'Test notification',
    data: { type: 'daily_reminder' },
    trigger: {
      type: 'daily',
      hour: 25, // Invalid hour
      minute: 0,
    },
  });
} catch (error) {
  if (error instanceof NotificationError) {
    switch (error.code) {
      case NotificationErrorCode.INVALID_TIME:
        console.error('Invalid time specified:', error.message);
        break;
      case NotificationErrorCode.SCHEDULING_FAILED:
        console.error('Failed to schedule:', error.message);
        break;
      case NotificationErrorCode.PERMISSION_DENIED:
        console.error('Permission not granted:', error.message);
        break;
      default:
        console.error('Unknown error:', error.message);
    }
  }
}
```

## Integration with NotificationService

The NotificationService automatically uses the NotificationScheduler:

```typescript
import { notificationService } from './services/notifications';

// This will use the scheduler with quiet hours support
const notificationId = await notificationService.schedule({
  title: 'Daily reminder',
  body: 'Log your symptoms',
  data: { type: 'daily_reminder' },
  trigger: {
    type: 'daily',
    hour: 20,
    minute: 0,
    repeats: true,
  },
});
```

## Best Practices

1. **Always validate trigger times** - The scheduler validates triggers, but it's good practice to validate on the UI side too
2. **Handle quiet hours gracefully** - Inform users when their notification times are adjusted
3. **Use batch operations** - When scheduling multiple related notifications, use `scheduleMultiple()` for better performance
4. **Track notification IDs** - Store notification IDs so you can cancel or reschedule them later
5. **Check permission first** - Always ensure notification permission is granted before scheduling
6. **Use appropriate categories** - Set the correct `categoryIdentifier` to enable action buttons

## Midnight Boundary Handling

The QuietHoursManager correctly handles quiet hours that span midnight:

```typescript
// Quiet hours from 10 PM to 7 AM (spans midnight)
await quietHoursManager.setQuietHours({ hour: 22, minute: 0 }, { hour: 7, minute: 0 });

// Check various times
const time1 = new Date();
time1.setHours(23, 0); // 11 PM - IN quiet hours
console.log(quietHoursManager.isInQuietHours(time1)); // true

const time2 = new Date();
time2.setHours(2, 0); // 2 AM - IN quiet hours
console.log(quietHoursManager.isInQuietHours(time2)); // true

const time3 = new Date();
time3.setHours(8, 0); // 8 AM - NOT in quiet hours
console.log(quietHoursManager.isInQuietHours(time3)); // false
```

## Requirements Coverage

This implementation satisfies the following requirements:

- **1.1**: Daily trigger calculation for symptom reminders
- **2.1**: One-time trigger calculation for dose reminders
- **2.2**: Trigger validation
- **5.2**: Quiet hours time checking with midnight boundary handling
- **5.3**: Automatic notification time adjustment for quiet hours
- **5.4**: Critical notification override for urgent reminders

## Next Steps

After implementing the scheduler, you can:

1. Build the notification settings UI (Task 9)
2. Implement protocol-specific scheduling (Task 6)
3. Add adaptive frequency based on adherence (Task 7)
4. Integrate with existing features (Task 11)
