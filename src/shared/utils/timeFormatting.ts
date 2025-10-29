/**
 * Time Formatting Utilities
 *
 * Locale-aware time and date formatting utilities for notifications
 * Requirements: 5.1, 10.2
 */

import * as Localization from 'expo-localization';
import { format, formatDistance, formatRelative, isToday, isYesterday } from 'date-fns';
import { enUS, ptBR } from 'date-fns/locale';

/**
 * Get the date-fns locale based on device locale
 */
export function getDateFnsLocale(): Locale {
  const deviceLocale = Localization.getLocales()[0]?.languageCode || 'en';

  switch (deviceLocale) {
    case 'pt':
      return ptBR;
    case 'en':
    default:
      return enUS;
  }
}

/**
 * Format time according to device locale (12/24 hour format)
 * Requirements: 5.1
 *
 * @param date - Date to format
 * @returns Formatted time string (e.g., "9:00 AM" or "09:00")
 */
export function formatTime(date: Date): string {
  const locale = getDateFnsLocale();
  const uses24Hour = Localization.getCalendars()[0]?.uses24hourClock ?? false;

  if (uses24Hour) {
    return format(date, 'HH:mm', { locale });
  } else {
    return format(date, 'h:mm a', { locale });
  }
}

/**
 * Format time from hour and minute components
 * Requirements: 5.1
 *
 * @param hour - Hour (0-23)
 * @param minute - Minute (0-59)
 * @returns Formatted time string
 */
export function formatTimeFromComponents(hour: number, minute: number): string {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  return formatTime(date);
}

/**
 * Format date according to device locale
 * Requirements: 10.2
 *
 * @param date - Date to format
 * @param formatString - Optional custom format string
 * @returns Formatted date string
 */
export function formatDate(date: Date, formatString?: string): string {
  const locale = getDateFnsLocale();
  const defaultFormat = 'PPP'; // Long localized date (e.g., "April 29, 2023" or "29 de abril de 2023")

  return format(date, formatString || defaultFormat, { locale });
}

/**
 * Format date and time together
 * Requirements: 10.2
 *
 * @param date - Date to format
 * @returns Formatted date and time string
 */
export function formatDateTime(date: Date): string {
  const locale = getDateFnsLocale();
  const uses24Hour = Localization.getCalendars()[0]?.uses24hourClock ?? false;

  if (uses24Hour) {
    return format(date, 'PPP HH:mm', { locale });
  } else {
    return format(date, 'PPP h:mm a', { locale });
  }
}

/**
 * Format date in short format (e.g., "Apr 29" or "29 abr")
 * Requirements: 10.2
 *
 * @param date - Date to format
 * @returns Short formatted date string
 */
export function formatDateShort(date: Date): string {
  const locale = getDateFnsLocale();
  return format(date, 'MMM d', { locale });
}

/**
 * Format relative time (e.g., "2 hours ago", "in 3 days")
 * Requirements: 10.2
 *
 * @param date - Date to format
 * @param baseDate - Base date to compare against (defaults to now)
 * @returns Relative time string
 */
export function formatRelativeTime(date: Date, baseDate: Date = new Date()): string {
  const locale = getDateFnsLocale();
  return formatDistance(date, baseDate, { addSuffix: true, locale });
}

/**
 * Format date relative to today (e.g., "today at 3:00 PM", "yesterday at 9:00 AM")
 * Requirements: 10.2
 *
 * @param date - Date to format
 * @returns Relative date string
 */
export function formatRelativeDate(date: Date): string {
  const locale = getDateFnsLocale();
  return formatRelative(date, new Date(), { locale });
}

/**
 * Format notification timestamp for display in history
 * Shows relative time for recent notifications, absolute time for older ones
 * Requirements: 10.2
 *
 * @param date - Date to format
 * @returns Formatted timestamp string
 */
export function formatNotificationTimestamp(date: Date): string {
  const now = new Date();
  const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

  // If less than 24 hours ago, show relative time
  if (diffInHours < 24) {
    return formatRelativeTime(date);
  }

  // If today or yesterday, show "Today at X" or "Yesterday at X"
  if (isToday(date)) {
    return `Today at ${formatTime(date)}`;
  }

  if (isYesterday(date)) {
    return `Yesterday at ${formatTime(date)}`;
  }

  // Otherwise show full date and time
  return formatDateTime(date);
}

/**
 * Format duration in hours and minutes
 * Requirements: 5.1
 *
 * @param durationInMinutes - Duration in minutes
 * @returns Formatted duration string (e.g., "2h 30m" or "45m")
 */
export function formatDuration(durationInMinutes: number): string {
  const hours = Math.floor(durationInMinutes / 60);
  const minutes = durationInMinutes % 60;

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    return `${minutes}m`;
  }
}

/**
 * Format time range (e.g., "9:00 AM - 5:00 PM" or "09:00 - 17:00")
 * Requirements: 5.1
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Formatted time range string
 */
export function formatTimeRange(startDate: Date, endDate: Date): string {
  return `${formatTime(startDate)} - ${formatTime(endDate)}`;
}

/**
 * Format time range from hour/minute components
 * Requirements: 5.1
 *
 * @param startHour - Start hour (0-23)
 * @param startMinute - Start minute (0-59)
 * @param endHour - End hour (0-23)
 * @param endMinute - End minute (0-59)
 * @returns Formatted time range string
 */
export function formatTimeRangeFromComponents(
  startHour: number,
  startMinute: number,
  endHour: number,
  endMinute: number
): string {
  const startTime = formatTimeFromComponents(startHour, startMinute);
  const endTime = formatTimeFromComponents(endHour, endMinute);
  return `${startTime} - ${endTime}`;
}

/**
 * Parse time string to hour and minute components
 * Handles both 12-hour and 24-hour formats
 *
 * @param timeString - Time string to parse
 * @returns Object with hour and minute, or null if invalid
 */
export function parseTimeString(timeString: string): { hour: number; minute: number } | null {
  // Try 24-hour format first (HH:mm)
  const match24 = timeString.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hour = parseInt(match24[1], 10);
    const minute = parseInt(match24[2], 10);
    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return { hour, minute };
    }
  }

  // Try 12-hour format (h:mm AM/PM)
  const match12 = timeString.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (match12) {
    let hour = parseInt(match12[1], 10);
    const minute = parseInt(match12[2], 10);
    const period = match12[3].toUpperCase();

    if (hour >= 1 && hour <= 12 && minute >= 0 && minute <= 59) {
      // Convert to 24-hour format
      if (period === 'PM' && hour !== 12) {
        hour += 12;
      } else if (period === 'AM' && hour === 12) {
        hour = 0;
      }
      return { hour, minute };
    }
  }

  return null;
}

/**
 * Check if device uses 24-hour time format
 *
 * @returns True if device uses 24-hour format
 */
export function uses24HourFormat(): boolean {
  return Localization.getCalendars()[0]?.uses24hourClock ?? false;
}

/**
 * Get time format pattern for the current locale
 * Useful for displaying format hints to users
 *
 * @returns Time format pattern string (e.g., "HH:mm" or "h:mm a")
 */
export function getTimeFormatPattern(): string {
  return uses24HourFormat() ? 'HH:mm' : 'h:mm a';
}

/**
 * Format date for notification scheduling display
 * Shows date and time in a compact format
 * Requirements: 10.2
 *
 * @param date - Date to format
 * @returns Formatted string for scheduling display
 */
export function formatScheduledDate(date: Date): string {
  const locale = getDateFnsLocale();
  const uses24Hour = Localization.getCalendars()[0]?.uses24hourClock ?? false;

  if (isToday(date)) {
    return `Today, ${formatTime(date)}`;
  }

  if (isYesterday(date)) {
    return `Yesterday, ${formatTime(date)}`;
  }

  // For dates within the next week, show day name
  const now = new Date();
  const diffInDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays >= 0 && diffInDays <= 7) {
    if (uses24Hour) {
      return format(date, 'EEEE, HH:mm', { locale });
    } else {
      return format(date, 'EEEE, h:mm a', { locale });
    }
  }

  // For dates further out, show full date
  return formatDateTime(date);
}
