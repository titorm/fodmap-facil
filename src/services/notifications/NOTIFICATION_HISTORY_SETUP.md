# Notification History Table Setup

This document describes how to set up the Notification History table in Appwrite TablesDB.

## Table Schema

Create a new table in your Appwrite database with the following configuration:

### Table Name

`notification_history`

### Columns

| Column Name       | Type     | Required | Array | Default | Description                                                |
| ----------------- | -------- | -------- | ----- | ------- | ---------------------------------------------------------- |
| userId            | string   | Yes      | No    | -       | User ID who received the notification                      |
| notificationType  | string   | Yes      | No    | -       | Type of notification (daily_reminder, dose_reminder, etc.) |
| title             | string   | Yes      | No    | -       | Notification title                                         |
| body              | string   | Yes      | No    | -       | Notification body text                                     |
| scheduledTime     | datetime | Yes      | No    | -       | When the notification was scheduled                        |
| deliveredTime     | datetime | No       | No    | null    | When the notification was actually delivered               |
| actionedTime      | datetime | No       | No    | null    | When the user acted on the notification                    |
| action            | string   | No       | No    | null    | Action taken (opened, dismissed, dose_marked_taken, etc.)  |
| relatedEntityId   | string   | No       | No    | null    | ID of related entity (test step, washout, etc.)            |
| relatedEntityType | string   | No       | No    | null    | Type of related entity                                     |
| createdAt         | datetime | Yes      | No    | -       | When the record was created                                |

### Indexes

Create the following indexes for optimal query performance:

1. **userId_index**
   - Type: Key
   - Columns: userId
   - Order: ASC

2. **scheduledTime_index**
   - Type: Key
   - Columns: scheduledTime
   - Order: DESC

3. **notificationType_index**
   - Type: Key
   - Columns: notificationType
   - Order: ASC

4. **relatedEntity_index**
   - Type: Key
   - Columns: relatedEntityId, relatedEntityType
   - Order: ASC

5. **createdAt_index**
   - Type: Key
   - Columns: createdAt
   - Order: DESC

### Permissions

Set the following permissions:

- **Create**: Users (authenticated users can create their own history entries)
- **Read**: Users (users can read their own history entries)
- **Update**: Users (users can update their own history entries)
- **Delete**: Users (users can delete their own history entries)

Add a permission rule to ensure users can only access their own notification history:

- Rule: `userId` equals `$userId`

## Environment Variable

After creating the table, add the table ID to your `.env` file:

```bash
EXPO_PUBLIC_APPWRITE_TABLE_NOTIFICATION_HISTORY_ID=your_table_id_here
```

## Usage

The `NotificationHistoryRepository` will automatically use this table to:

1. Record notification deliveries
2. Track user actions on notifications
3. Provide notification history for adherence analysis
4. Generate notification statistics
5. Clean up old entries (older than 30 days)

## Automatic Cleanup

The system automatically cleans up notification history entries older than 30 days to prevent database bloat. This cleanup runs:

1. On app initialization
2. Can be manually triggered via `notificationService.cleanupOldHistory()`

## Querying History

You can query notification history using the repository methods:

```typescript
import { notificationHistoryRepository } from '@/services/notifications';

// Get all history for a user
const history = await notificationHistoryRepository.list({
  userId: 'user123',
  startDate: new Date('2024-01-01'),
});

// Get history for a specific notification type
const doseReminders = await notificationHistoryRepository.list({
  userId: 'user123',
  notificationType: 'dose_reminder',
});

// Get history for a specific entity
const testStepHistory = await notificationHistoryRepository.getByRelatedEntity(
  'testStep123',
  'test_step'
);

// Get statistics
const stats = await notificationHistoryRepository.getStatistics('user123', 30);
```

## Migration from AsyncStorage

If you have existing notification history in AsyncStorage, you can migrate it to Appwrite:

```typescript
// This is a one-time migration script
async function migrateNotificationHistory() {
  const deliveriesJson = await AsyncStorage.getItem('@notifications:deliveries');
  const actionsJson = await AsyncStorage.getItem('@notifications:actions');

  const deliveries = deliveriesJson ? JSON.parse(deliveriesJson) : [];
  const actions = actionsJson ? JSON.parse(actionsJson) : [];

  // Create history entries from deliveries
  for (const delivery of deliveries) {
    await notificationHistoryRepository.create({
      userId: 'current_user_id',
      notificationType: delivery.type,
      title: 'Notification',
      body: '',
      scheduledTime: new Date(delivery.deliveredAt),
      deliveredTime: new Date(delivery.deliveredAt),
      relatedEntityId: delivery.relatedEntityId,
      relatedEntityType: delivery.relatedEntityType,
    });
  }

  // Update with actions
  // ... similar process for actions
}
```

## Troubleshooting

### Table not found error

If you see "Table not found" errors:

1. Verify the table ID in your `.env` file matches the Appwrite console
2. Ensure the table exists in the correct database
3. Check that permissions are set correctly

### Permission denied errors

If you see permission errors:

1. Verify the user is authenticated
2. Check that the `userId` field matches the authenticated user
3. Ensure the permission rules are set correctly in Appwrite console

### Slow queries

If queries are slow:

1. Verify all indexes are created
2. Consider adding composite indexes for common query patterns
3. Limit the number of results returned (use pagination)
