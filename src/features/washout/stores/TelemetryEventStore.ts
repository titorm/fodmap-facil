/**
 * TelemetryEventStore
 *
 * Local storage for telemetry events using AsyncStorage.
 * Provides persistence for events before they are synced to analytics backend.
 *
 * Requirements: 7.4, 7.5
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TelemetryEvent } from '../services/TelemetryService';

/**
 * Storage key for telemetry events
 */
const TELEMETRY_EVENTS_KEY = '@fodmap_app:telemetry_events';

/**
 * Serializable version of TelemetryEvent for storage
 */
interface SerializedTelemetryEvent {
  id: string;
  eventType: string;
  contentId: string;
  timestamp: string; // ISO 8601 string
  userState: {
    experienceLevel: string;
    anxietyLevel: string;
    protocolPhase: string;
    completedTestsCount: number;
    previouslyViewedContentIds: string[];
  };
  metadata?: {
    timeSpent?: number;
    scrollDepth?: number;
  };
  synced: boolean;
}

/**
 * TelemetryEventStore class
 *
 * Manages local persistence of telemetry events using AsyncStorage.
 * Handles serialization/deserialization and provides methods for
 * querying and updating event sync status.
 */
export class TelemetryEventStore {
  /**
   * Add a single event to the store
   *
   * @param event - Telemetry event to add
   */
  async addEvent(event: TelemetryEvent): Promise<void> {
    const events = await this.getAllEvents();
    events.push(event);
    await this.saveEvents(events);
  }

  /**
   * Add multiple events to the store
   *
   * @param events - Array of telemetry events to add
   */
  async addEvents(events: TelemetryEvent[]): Promise<void> {
    if (events.length === 0) {
      return;
    }

    const existingEvents = await this.getAllEvents();
    const updatedEvents = [...existingEvents, ...events];
    await this.saveEvents(updatedEvents);
  }

  /**
   * Get all events from the store
   *
   * @returns Promise resolving to array of all telemetry events
   */
  async getAllEvents(): Promise<TelemetryEvent[]> {
    try {
      const stored = await AsyncStorage.getItem(TELEMETRY_EVENTS_KEY);

      if (!stored) {
        return [];
      }

      const serialized: SerializedTelemetryEvent[] = JSON.parse(stored);
      return serialized.map(this.deserializeEvent);
    } catch (error) {
      console.error('Failed to load telemetry events:', error);
      return [];
    }
  }

  /**
   * Get all unsynced events from the store
   *
   * @returns Promise resolving to array of unsynced telemetry events
   */
  async getUnsynced(): Promise<TelemetryEvent[]> {
    const allEvents = await this.getAllEvents();
    return allEvents.filter((event) => !event.synced);
  }

  /**
   * Mark events as synced
   *
   * @param eventIds - Array of event IDs to mark as synced
   */
  async markSynced(eventIds: string[]): Promise<void> {
    if (eventIds.length === 0) {
      return;
    }

    const events = await this.getAllEvents();
    const eventIdSet = new Set(eventIds);

    // Update synced status for matching events
    const updatedEvents = events.map((event) => {
      if (eventIdSet.has(event.id)) {
        return { ...event, synced: true };
      }
      return event;
    });

    await this.saveEvents(updatedEvents);
  }

  /**
   * Clear all events from the store
   */
  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(TELEMETRY_EVENTS_KEY);
      console.log('Telemetry event store cleared');
    } catch (error) {
      console.error('Failed to clear telemetry events:', error);
      throw error;
    }
  }

  /**
   * Get count of unsynced events
   *
   * @returns Promise resolving to number of unsynced events
   */
  async getUnsyncedCount(): Promise<number> {
    const unsyncedEvents = await this.getUnsynced();
    return unsyncedEvents.length;
  }

  /**
   * Remove old synced events to prevent storage bloat
   *
   * Removes synced events older than the specified number of days.
   *
   * @param daysToKeep - Number of days to keep synced events (default: 30)
   * @returns Promise resolving to number of events removed
   */
  async pruneOldEvents(daysToKeep: number = 30): Promise<number> {
    const events = await this.getAllEvents();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const eventsToKeep = events.filter((event) => {
      // Keep all unsynced events
      if (!event.synced) {
        return true;
      }

      // Keep synced events within the retention period
      return event.timestamp >= cutoffDate;
    });

    const removedCount = events.length - eventsToKeep.length;

    if (removedCount > 0) {
      await this.saveEvents(eventsToKeep);
      console.log(`Pruned ${removedCount} old telemetry events`);
    }

    return removedCount;
  }

  /**
   * Save events to AsyncStorage
   *
   * @param events - Array of events to save
   */
  private async saveEvents(events: TelemetryEvent[]): Promise<void> {
    try {
      const serialized = events.map(this.serializeEvent);
      await AsyncStorage.setItem(TELEMETRY_EVENTS_KEY, JSON.stringify(serialized));
    } catch (error) {
      console.error('Failed to save telemetry events:', error);
      throw error;
    }
  }

  /**
   * Serialize a telemetry event for storage
   *
   * @param event - Event to serialize
   * @returns Serialized event
   */
  private serializeEvent(event: TelemetryEvent): SerializedTelemetryEvent {
    return {
      id: event.id,
      eventType: event.eventType,
      contentId: event.contentId,
      timestamp: event.timestamp.toISOString(),
      userState: {
        experienceLevel: event.userState.experienceLevel,
        anxietyLevel: event.userState.anxietyLevel,
        protocolPhase: event.userState.protocolPhase,
        completedTestsCount: event.userState.completedTestsCount,
        previouslyViewedContentIds: event.userState.previouslyViewedContentIds,
      },
      metadata: event.metadata,
      synced: event.synced,
    };
  }

  /**
   * Deserialize a telemetry event from storage
   *
   * @param serialized - Serialized event
   * @returns Deserialized event
   */
  private deserializeEvent(serialized: SerializedTelemetryEvent): TelemetryEvent {
    return {
      id: serialized.id,
      eventType: serialized.eventType as any,
      contentId: serialized.contentId,
      timestamp: new Date(serialized.timestamp),
      userState: {
        experienceLevel: serialized.userState.experienceLevel as any,
        anxietyLevel: serialized.userState.anxietyLevel as any,
        protocolPhase: serialized.userState.protocolPhase as any,
        completedTestsCount: serialized.userState.completedTestsCount,
        previouslyViewedContentIds: serialized.userState.previouslyViewedContentIds,
      },
      metadata: serialized.metadata,
      synced: serialized.synced,
    };
  }
}
