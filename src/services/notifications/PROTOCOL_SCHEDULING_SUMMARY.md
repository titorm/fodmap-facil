# Protocol-Specific Notification Scheduling Implementation

## Overview

This document summarizes the implementation of Task 6: Protocol-specific notification scheduling for the FODMAP Fácil application.

## Implemented Features

### 6.1 Daily Symptom Reminder Scheduling ✅

**Methods:**

- `scheduleDailyReminder(time?: Date): Promise<string>`
  - Schedules recurring daily notification at user's preferred time
  - Respects quiet hours and adaptive frequency through NotificationScheduler
  - Cancels existing daily reminders before scheduling new ones
  - Uses daily repeating trigger
  - Requirements: 1.1, 1.2, 1.3, 1.4, 1.5

- `cancelDailyReminderForToday(): Promise<void>`
  - Called when symptoms are logged for the day
  - Reschedules reminder for tomorrow (since we can't cancel single instance of repeating notification)
  - Requirements: 1.2

**Key Features:**

- Default time: 9:00 AM if not configured
- Checks permission before scheduling
- Validates preferences are enabled
- Automatic quiet hours adjustment via scheduler

### 6.2 Dose Reminder Scheduling ✅

**Methods:**

- `scheduleDoseReminder(testStep): Promise<string[]>`
  - Schedules pre-dose notification (30 min before by default)
  - Schedules dose-time notification with action buttons
  - Returns array of notification IDs
  - Requirements: 2.1, 2.2, 2.3, 2.4, 2.5

- `snoozeDoseReminder(testStepId: string): Promise<string>`
  - Snoozes dose reminder by 15 minutes
  - Cancels existing reminder and creates new one
  - Requirements: 2.4

- `cancelDoseReminders(testStepId: string): Promise<void>`
  - Cancels all dose reminders for a test step
  - Called when dose is marked as taken
  - Requirements: 2.3

**Key Features:**

- Pre-dose notification configurable (default 30 min)
- Action buttons: "Mark as Taken" and "Snooze 15 min"
- Only schedules if time is in the future
- Includes food name and dose amount in notification body
- Cancels existing reminders before scheduling new ones

### 6.3 Washout Notification Scheduling ✅

**Methods:**

- `scheduleWashoutNotifications(washout): Promise<string[]>`
  - Schedules washout start notification
  - Schedules 24-hour warning before end
  - Schedules washout end notification
  - Returns array of notification IDs
  - Requirements: 3.1, 3.2, 3.3, 3.4, 3.5

- `updateWashoutNotifications(washout): Promise<string[]>`
  - Updates notifications when washout is extended
  - Simply reschedules all washout notifications
  - Requirements: 3.4

- `cancelWashoutNotifications(washoutId: string): Promise<void>`
  - Cancels all washout notifications for a specific washout period

**Key Features:**

- Three notification types: start, warning (24h before end), end
- Calculates washout duration in days for notification body
- Only schedules if time is in the future
- Includes protocol run ID for tracking
- Cancels existing notifications before scheduling new ones

### 6.4 Test Start Reminder Scheduling ✅

**Methods:**

- `scheduleTestStartReminder(testStep): Promise<string[]>`
  - Schedules immediate notification (2 hours after availability)
  - Schedules follow-up reminder after 48 hours
  - Returns array of notification IDs
  - Requirements: 4.1, 4.2, 4.3, 4.4, 4.5

- `cancelTestStartReminders(testStepId: string): Promise<void>`
  - Cancels test start reminders when test is started
  - Requirements: 4.3

- `disableTestStartRemindersForProtocol(protocolRunId: string): Promise<void>`
  - Disables all test start reminders for a protocol when paused
  - Requirements: 4.4

- `enableTestStartRemindersForProtocol(protocolRunId, pendingTests): Promise<void>`
  - Re-enables test start reminders when protocol is resumed
  - Schedules reminders for all pending tests
  - Requirements: 4.5

**Key Features:**

- Two-stage reminder: immediate (2h) and follow-up (48h)
- Respects protocol pause status
- Includes food name in notification body
- Tracks whether notification is follow-up
- Protocol-level enable/disable support

## Common Patterns

All scheduling methods follow these patterns:

1. **Permission Check**: Verify notification permission is granted
2. **Preference Check**: Verify specific notification type is enabled in preferences
3. **Cancellation**: Cancel existing notifications before scheduling new ones
4. **Future Check**: Only schedule notifications if time is in the future
5. **Error Handling**: Catch and wrap errors in NotificationError
6. **Quiet Hours**: Automatic adjustment via NotificationScheduler
7. **Tracking**: Store notification metadata for history and management

## Integration Points

### NotificationScheduler

- All scheduling goes through `NotificationScheduler.schedule()`
- Automatic quiet hours enforcement
- Trigger validation and conversion
- Notification tracking in AsyncStorage

### NotificationPreferencesStore

- Checks if notification types are enabled
- Gets user's preferred times
- Gets advance minutes for dose reminders
- Gets quiet hours configuration

### Expo Notifications

- Uses native scheduling APIs
- Supports action buttons (categories)
- Handles background delivery
- Provides notification response handling

## Data Flow

```
User Action (e.g., create test step)
  ↓
Call scheduleDoseReminder()
  ↓
Check permission & preferences
  ↓
Cancel existing reminders
  ↓
Create ScheduleNotificationInput
  ↓
NotificationScheduler.schedule()
  ↓
Check & adjust for quiet hours
  ↓
Convert to Expo trigger format
  ↓
Expo Notifications API
  ↓
Track in AsyncStorage
  ↓
Return notification ID(s)
```

## Testing Recommendations

1. **Unit Tests**: Test each scheduling method with various inputs
2. **Permission Tests**: Test behavior when permission is denied
3. **Preference Tests**: Test behavior when notification types are disabled
4. **Time Tests**: Test scheduling in past vs future
5. **Cancellation Tests**: Test cancellation of existing notifications
6. **Quiet Hours Tests**: Verify automatic time adjustment
7. **Integration Tests**: Test complete flows (create test → schedule → receive)

## Next Steps

The following tasks remain to complete the notification system:

- Task 7: Implement AdherenceAnalyzer for adaptive notifications
- Task 8: Implement notification history tracking
- Task 9: Build notification settings UI
- Task 10: Build notification history UI
- Task 11: Integrate notifications with existing features
- Task 12: Implement error handling and fallbacks
- Task 13: Add notification action buttons
- Task 14: Write comprehensive tests
- Task 15: Optimize performance and battery usage
- Task 16: Add internationalization support
- Task 17: Final integration and polish

## Files Modified

- `src/services/notifications/NotificationService.ts`: Added all protocol-specific scheduling methods

## Requirements Coverage

✅ Requirement 1.1-1.5: Daily symptom reminders
✅ Requirement 2.1-2.5: Dose reminders with snooze
✅ Requirement 3.1-3.5: Washout notifications
✅ Requirement 4.1-4.5: Test start reminders with protocol pause support
