# Washout Hooks

Custom React hooks for managing washout period experience.

## useWashout

The main hook for washout period management, providing countdown tracking, personalized educational content, and reminder management.

### Usage

```tsx
import { useWashout } from '@/features/washout/hooks';

function WashoutScreen({ washoutPeriodId, userId }) {
  const {
    washoutPeriod,
    countdown,
    educationalContent,
    reminders,
    isLoading,
    error,
    refreshContent,
    updateReminderFrequency,
  } = useWashout(washoutPeriodId, userId);

  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <View>
      <WashoutCountdown countdown={countdown} />
      {reminders.map((reminder) => (
        <ReminderBanner key={reminder.id} message={reminder.message} />
      ))}
      {educationalContent.map((content) => (
        <EducationalContentCard key={content.id} content={content} />
      ))}
    </View>
  );
}
```

### Features

#### Countdown Timer

- Automatically calculates days, hours, and minutes remaining
- Updates every minute for real-time accuracy
- Detects completion and triggers cache invalidation

#### Personalized Content

- Fetches 2-5 educational content items based on user state
- Considers experience level, anxiety level, and viewing history
- Content can be manually refreshed via `refreshContent()`

#### Reminder Management

- Fetches scheduled reminder messages
- Allows updating reminder frequency via `updateReminderFrequency(hours)`
- Automatically reschedules reminders when frequency changes

### Return Values

| Property                  | Type                               | Description                                               |
| ------------------------- | ---------------------------------- | --------------------------------------------------------- |
| `washoutPeriod`           | `WashoutPeriod \| null`            | Current washout period data                               |
| `countdown`               | `Countdown`                        | Countdown timer values (days, hours, minutes, isComplete) |
| `educationalContent`      | `EducationalContent[]`             | Personalized content items (2-5 items)                    |
| `reminders`               | `ReminderMessage[]`                | Scheduled reminder messages                               |
| `isLoading`               | `boolean`                          | Combined loading state for all queries                    |
| `error`                   | `Error \| null`                    | Combined error state                                      |
| `refreshContent`          | `() => Promise<void>`              | Manually refresh educational content                      |
| `updateReminderFrequency` | `(hours: number) => Promise<void>` | Update reminder frequency (1-24 hours)                    |

### Requirements Implemented

- **1.1**: Display countdown showing days and hours remaining
- **1.2**: Update countdown display every minute
- **2.1**: Fetch and display reminder messages
- **3.1**: Request personalized content based on user state
- **3.2**: Allow refreshing content dynamically

### Dependencies

- `WashoutPeriodRepository` - Fetch washout period data
- `ContentSurfacingEngine` - Select personalized content
- `NotificationService` - Manage reminders
- `TelemetryService` - Track viewed content for personalization
- `UserStateUtils` - Derive user state from multiple sources

### Performance Considerations

- Content query has 5-minute stale time to reduce unnecessary fetches
- Countdown updates only every minute (not every second) for efficiency
- All queries use React Query caching for optimal performance
- Service instances are created once at module level (singleton pattern)
