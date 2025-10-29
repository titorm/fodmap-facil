# Requirements Document

## Introduction

This document specifies the requirements for a personalized push and local notification system for the FODMAP Fácil application. The system SHALL provide intelligent, context-aware reminders to help users maintain adherence to their FODMAP reintroduction protocol while respecting user preferences and avoiding notification fatigue.

## Glossary

- **Notification System**: The software component responsible for scheduling, delivering, and managing push and local notifications
- **User Profile**: The persistent data structure containing user preferences and settings
- **Reminder Schedule**: A collection of scheduled notifications for protocol-related events
- **Quiet Hours**: User-defined time periods during which notifications SHALL NOT be delivered
- **Adherence Pattern**: Historical data reflecting user engagement with the protocol
- **Washout Period**: A rest period between food reintroduction tests
- **Test Step**: A single dose administration within a reintroduction test
- **Protocol Run**: An active execution of the FODMAP reintroduction protocol

## Requirements

### Requirement 1

**User Story:** As a user, I want to receive timely reminders for daily symptom logging, so that I maintain consistent tracking throughout my protocol

#### Acceptance Criteria

1. WHEN a user enables daily logging reminders, THE Notification System SHALL schedule a recurring notification at the user's preferred time
2. WHEN the user logs symptoms for the current day, THE Notification System SHALL cancel the scheduled reminder for that day
3. IF the user has not logged symptoms by the scheduled time, THEN THE Notification System SHALL deliver a notification prompting symptom entry
4. WHERE the user has configured quiet hours, THE Notification System SHALL defer the notification until after the quiet period ends
5. WHILE the user has an active Protocol Run, THE Notification System SHALL maintain daily logging reminders

### Requirement 2

**User Story:** As a user, I want to be reminded when to take my next test dose, so that I follow the correct timing for my reintroduction protocol

#### Acceptance Criteria

1. WHEN a Test Step is scheduled, THE Notification System SHALL create a notification for 30 minutes before the scheduled dose time
2. WHEN the scheduled dose time arrives, THE Notification System SHALL deliver a notification with the food name and dose amount
3. IF the user marks the dose as consumed, THEN THE Notification System SHALL cancel any pending reminders for that dose
4. WHEN a dose notification is delivered, THE Notification System SHALL include actionable buttons to mark the dose as taken or snooze for 15 minutes
5. WHERE multiple doses are scheduled on the same day, THE Notification System SHALL deliver separate notifications for each dose

### Requirement 3

**User Story:** As a user, I want to be notified when my washout period starts and ends, so that I know when to avoid trigger foods and when I can begin my next test

#### Acceptance Criteria

1. WHEN a Washout Period begins, THE Notification System SHALL deliver a notification informing the user of the washout start and expected duration
2. WHEN a Washout Period is scheduled to end within 24 hours, THE Notification System SHALL deliver a reminder notification
3. WHEN a Washout Period ends, THE Notification System SHALL deliver a notification indicating the user can begin their next test
4. IF the user extends a Washout Period, THEN THE Notification System SHALL update the end notification accordingly
5. WHILE a Washout Period is active, THE Notification System SHALL include washout status in daily reminder notifications

### Requirement 4

**User Story:** As a user, I want to be notified when it's time to start my next reintroduction test, so that I maintain momentum in my protocol

#### Acceptance Criteria

1. WHEN a new Test Step is available to start, THE Notification System SHALL deliver a notification within 2 hours of availability
2. WHEN the user has completed a test and washout, THE Notification System SHALL suggest the next recommended test based on the protocol sequence
3. IF the user has not started a new test within 48 hours of availability, THEN THE Notification System SHALL deliver a gentle reminder notification
4. WHERE the user has paused their protocol, THE Notification System SHALL NOT deliver test start reminders
5. WHEN the user resumes their protocol, THE Notification System SHALL re-enable test start notifications

### Requirement 5

**User Story:** As a user, I want to control when I receive notifications through quiet hours settings, so that I'm not disturbed during sleep or important activities

#### Acceptance Criteria

1. WHEN a user configures quiet hours with start and end times, THE Notification System SHALL store these preferences in the User Profile
2. WHILE quiet hours are active, THE Notification System SHALL NOT deliver any notifications
3. WHEN quiet hours end, THE Notification System SHALL deliver any deferred notifications within 15 minutes
4. IF a critical notification (dose reminder within 1 hour) is scheduled during quiet hours, THEN THE Notification System SHALL deliver it immediately before the quiet period begins
5. WHERE the user disables quiet hours, THE Notification System SHALL resume normal notification delivery

### Requirement 6

**User Story:** As a user, I want the app to reduce notification frequency if I'm consistently engaged, so that I don't feel spammed by unnecessary reminders

#### Acceptance Criteria

1. WHEN the user logs symptoms for 7 consecutive days without reminders, THE Notification System SHALL reduce daily reminder frequency to every other day
2. WHEN the user consistently takes doses on time for 5 consecutive tests, THE Notification System SHALL disable pre-dose reminders (30 minutes before)
3. IF the user misses 2 consecutive daily logs, THEN THE Notification System SHALL restore full reminder frequency
4. WHILE analyzing Adherence Pattern, THE Notification System SHALL consider a 14-day rolling window
5. WHERE the user manually re-enables full reminders, THE Notification System SHALL override adaptive behavior

### Requirement 7

**User Story:** As a user, I want a clear process to grant and revoke notification permissions, so that I maintain control over how the app communicates with me

#### Acceptance Criteria

1. WHEN the user first launches the app, THE Notification System SHALL present a clear explanation of notification benefits before requesting permission
2. WHEN the user grants notification permission, THE Notification System SHALL store the permission status in the User Profile
3. IF the user denies notification permission, THEN THE Notification System SHALL provide in-app alternatives (dashboard alerts, badges)
4. WHEN the user revokes notification permission in device settings, THE Notification System SHALL detect the change and update the User Profile
5. WHERE the user wants to re-enable notifications after denial, THE Notification System SHALL provide clear instructions to access device settings

### Requirement 8

**User Story:** As a user, I want to customize which types of notifications I receive, so that I only get reminders that are relevant to my needs

#### Acceptance Criteria

1. WHEN the user accesses notification preferences, THE Notification System SHALL display toggles for each notification type (daily log, dose, washout, test start)
2. WHEN the user disables a notification type, THE Notification System SHALL cancel all scheduled notifications of that type
3. WHEN the user enables a notification type, THE Notification System SHALL schedule appropriate notifications based on current protocol state
4. WHERE the user has disabled all notification types, THE Notification System SHALL display a warning about potential adherence impact
5. WHILE notification preferences are being modified, THE Notification System SHALL persist changes immediately to the User Profile

### Requirement 9

**User Story:** As a user, I want notifications to be delivered reliably even when the app is closed, so that I don't miss important protocol milestones

#### Acceptance Criteria

1. WHEN a notification is scheduled, THE Notification System SHALL use the device's native notification scheduling API
2. WHEN the app is in the background or closed, THE Notification System SHALL ensure scheduled notifications are delivered at the correct time
3. IF the device is powered off during a scheduled notification, THEN THE Notification System SHALL deliver the notification when the device powers on
4. WHEN the user taps a notification, THE Notification System SHALL open the app to the relevant screen (symptom log, test details, etc.)
5. WHERE the device has low battery or power-saving mode enabled, THE Notification System SHALL still deliver critical notifications

### Requirement 10

**User Story:** As a user, I want to see a history of notifications I've received, so that I can review past reminders and verify my adherence

#### Acceptance Criteria

1. WHEN a notification is delivered, THE Notification System SHALL record the delivery in a notification history log
2. WHEN the user accesses notification history, THE Notification System SHALL display notifications from the past 30 days
3. WHERE a notification was acted upon (e.g., dose marked as taken), THE Notification System SHALL indicate the action in the history
4. WHEN the user filters notification history by type, THE Notification System SHALL display only notifications matching the selected type
5. IF the user clears notification history, THEN THE Notification System SHALL remove records older than 30 days while preserving recent notifications
