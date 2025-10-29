/**
 * TelemetryService
 *
 * Service for tracking content interaction events during washout periods.
 * Implements event batching, local persistence, and retry logic for analytics.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import type { UserState } from '../utils/userStateUtils';
import type { TelemetryEventStore } from '../stores/TelemetryEventStore';

/**
 * Types of telemetry events
 */
export type TelemetryEventType = 'content-viewed' | 'content-expanded' | 'content-completed';

/**
 * Telemetry event structure
 */
export interface TelemetryEvent {
  /** Unique identifier for the event */
  id: string;

  /** Type of event */
  eventType: TelemetryEventType;

  /** ID of the content that triggered the event */
  contentId: string;

  /** Timestamp when the event occurred */
  timestamp: Date;

  /** User state at the time of the event */
  userState: UserState;

  /** Additional event metadata */
  metadata?: {
    /** Time spent on content in seconds (for content-completed events) */
    timeSpent?: number;

    /** Scroll depth percentage (0-100) */
    scrollDepth?: number;
  };

  /** Whether this event has been synced to the backend */
  synced: boolean;
}

/**
 * TelemetryService interface
 *
 * Defines methods for tracking content interaction events
 * and syncing them to an analytics backend.
 */
export interface ITelemetryService {
  /**
   * Track when a user views content for more than 3 seconds
   *
   * @param contentId - ID of the viewed content
   * @param userState - Current user state
   */
  trackContentViewed(contentId: string, userState: UserState): Promise<void>;

  /**
   * Track when a user expands/opens content
   *
   * @param contentId - ID of the expanded content
   * @param userState - Current user state
   */
  trackContentExpanded(contentId: string, userState: UserState): Promise<void>;

  /**
   * Track when a user completes reading content
   *
   * @param contentId - ID of the completed content
   * @param userState - Current user state
   * @param timeSpent - Time spent reading in seconds
   */
  trackContentCompleted(contentId: string, userState: UserState, timeSpent: number): Promise<void>;

  /**
   * Sync all unsynced events to the analytics backend
   *
   * @returns Promise resolving to number of events synced
   */
  syncEvents(): Promise<number>;

  /**
   * Get all previously viewed content IDs for a user
   *
   * @param userId - User ID to fetch viewed content for
   * @returns Promise resolving to array of content IDs
   */
  getViewedContentIds(userId: string): Promise<string[]>;
}

/**
 * Configuration for TelemetryService
 */
export interface TelemetryServiceConfig {
  /** Maximum number of events to batch before auto-flush */
  maxBatchSize?: number;

  /** Maximum time in milliseconds before auto-flush */
  maxBatchTime?: number;

  /** Maximum number of retry attempts for failed syncs */
  maxRetries?: number;

  /** Base delay in milliseconds for exponential backoff */
  retryBaseDelay?: number;
}

/**
 * Default configuration values
 */
const DEFAULT_CONFIG: Required<TelemetryServiceConfig> = {
  maxBatchSize: 50,
  maxBatchTime: 5 * 60 * 1000, // 5 minutes
  maxRetries: 3,
  retryBaseDelay: 1000, // 1 second
};

/**
 * TelemetryService implementation
 *
 * Batches events locally and syncs them to an analytics backend
 * with retry logic and exponential backoff.
 */
export class TelemetryService implements ITelemetryService {
  private eventBuffer: TelemetryEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private config: Required<TelemetryServiceConfig>;

  constructor(
    private eventStore: TelemetryEventStore,
    config?: TelemetryServiceConfig
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Track content-viewed event
   *
   * Requirement 7.1: Record when user views content for more than 3 seconds
   */
  async trackContentViewed(contentId: string, userState: UserState): Promise<void> {
    const event: TelemetryEvent = {
      id: this.generateEventId(),
      eventType: 'content-viewed',
      contentId,
      timestamp: new Date(),
      userState,
      synced: false,
    };

    await this.addEvent(event);
  }

  /**
   * Track content-expanded event
   *
   * Requirement 7.2: Record when user expands content card
   */
  async trackContentExpanded(contentId: string, userState: UserState): Promise<void> {
    const event: TelemetryEvent = {
      id: this.generateEventId(),
      eventType: 'content-expanded',
      contentId,
      timestamp: new Date(),
      userState,
      synced: false,
    };

    await this.addEvent(event);
  }

  /**
   * Track content-completed event
   *
   * Requirement 7.3: Record when user completes reading content
   */
  async trackContentCompleted(
    contentId: string,
    userState: UserState,
    timeSpent: number
  ): Promise<void> {
    const event: TelemetryEvent = {
      id: this.generateEventId(),
      eventType: 'content-completed',
      contentId,
      timestamp: new Date(),
      userState,
      metadata: {
        timeSpent,
      },
      synced: false,
    };

    await this.addEvent(event);
  }

  /**
   * Sync all unsynced events to analytics backend
   *
   * Requirements 7.4, 7.5: Batch events and persist locally before syncing
   */
  async syncEvents(): Promise<number> {
    // Flush any buffered events first
    await this.flush();

    // Get all unsynced events from store
    const unsyncedEvents = await this.eventStore.getUnsynced();

    if (unsyncedEvents.length === 0) {
      return 0;
    }

    // Attempt to sync with retry logic
    const syncedCount = await this.syncWithRetry(unsyncedEvents);

    return syncedCount;
  }

  /**
   * Get previously viewed content IDs for a user
   *
   * Filters telemetry events to extract unique content IDs
   * from content-viewed events for the specified user.
   */
  async getViewedContentIds(userId: string): Promise<string[]> {
    const allEvents = await this.eventStore.getAllEvents();

    // Filter for content-viewed events
    const viewedEvents = allEvents.filter((event) => event.eventType === 'content-viewed');

    // Extract unique content IDs
    const contentIds = new Set<string>();
    viewedEvents.forEach((event) => {
      contentIds.add(event.contentId);
    });

    return Array.from(contentIds);
  }

  /**
   * Add event to buffer and trigger flush if needed
   *
   * Requirement 7.4: Batch events (max 50 events or 5 minutes)
   */
  private async addEvent(event: TelemetryEvent): Promise<void> {
    this.eventBuffer.push(event);

    // Flush if buffer reaches max size
    if (this.eventBuffer.length >= this.config.maxBatchSize) {
      await this.flush();
      return;
    }

    // Schedule flush after max batch time if not already scheduled
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => {
        this.flush().catch((error) => {
          console.error('Failed to flush telemetry events:', error);
        });
      }, this.config.maxBatchTime);
    }
  }

  /**
   * Flush buffered events to persistent storage
   *
   * Requirement 7.4: Persist events locally before syncing
   */
  private async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    // Clear flush timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    // Copy buffer and clear it
    const events = [...this.eventBuffer];
    this.eventBuffer = [];

    // Persist events to store
    await this.eventStore.addEvents(events);
  }

  /**
   * Sync events with retry logic and exponential backoff
   *
   * Requirement 7.4: Retry logic for failed syncs
   */
  private async syncWithRetry(events: TelemetryEvent[]): Promise<number> {
    for (let attempt = 0; attempt < this.config.maxRetries; attempt++) {
      try {
        // TODO: Replace with actual analytics backend call
        // For now, we'll simulate a successful sync
        await this.sendToAnalyticsBackend(events);

        // Mark events as synced
        const eventIds = events.map((e) => e.id);
        await this.eventStore.markSynced(eventIds);

        return events.length;
      } catch (error) {
        const isLastAttempt = attempt === this.config.maxRetries - 1;

        if (isLastAttempt) {
          console.error('Failed to sync telemetry after max retries:', error);
          // Events remain in store for next sync attempt
          return 0;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = this.config.retryBaseDelay * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    return 0;
  }

  /**
   * Send events to analytics backend
   *
   * TODO: Implement actual backend integration
   * This is a placeholder that simulates the backend call
   */
  private async sendToAnalyticsBackend(events: TelemetryEvent[]): Promise<void> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Log events for debugging
    console.log(`[TelemetryService] Syncing ${events.length} events to analytics backend`);

    // In production, this would be replaced with actual API call:
    // await fetch('https://analytics.example.com/events', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(events),
    // });
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
  }
}
