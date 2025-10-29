import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ProtocolState } from '../engine/fodmapEngine/types';

const PROTOCOL_STATE_KEY = '@fodmap:protocol_state';
const PROTOCOL_STATE_TIMESTAMP_KEY = '@fodmap:protocol_state_timestamp';

/**
 * ProtocolStateCache
 *
 * Service for caching protocol state locally using AsyncStorage.
 * Provides offline access to protocol state and reduces need for recalculation.
 *
 * Features:
 * - Stores protocol state in AsyncStorage
 * - Tracks last update timestamp
 * - Provides cache invalidation
 * - Handles serialization/deserialization
 */
export class ProtocolStateCache {
  /**
   * Save protocol state to cache
   *
   * @param state - The protocol state to cache
   * @returns Promise that resolves when state is saved
   */
  static async save(state: ProtocolState): Promise<void> {
    try {
      const serialized = JSON.stringify(state);
      const timestamp = new Date().toISOString();

      await AsyncStorage.multiSet([
        [PROTOCOL_STATE_KEY, serialized],
        [PROTOCOL_STATE_TIMESTAMP_KEY, timestamp],
      ]);

      console.log('Protocol state cached successfully');
    } catch (error) {
      console.error('Failed to cache protocol state:', error);
      throw new Error('Failed to cache protocol state');
    }
  }

  /**
   * Load protocol state from cache
   *
   * @returns Promise resolving to cached protocol state or null if not found
   */
  static async load(): Promise<ProtocolState | null> {
    try {
      const serialized = await AsyncStorage.getItem(PROTOCOL_STATE_KEY);

      if (!serialized) {
        return null;
      }

      const state = JSON.parse(serialized) as ProtocolState;

      // Note: ProtocolState uses string dates (ISO 8601 format), not Date objects
      // No deserialization needed as the engine expects strings

      console.log('Protocol state loaded from cache');
      return state;
    } catch (error) {
      console.error('Failed to load protocol state from cache:', error);
      return null;
    }
  }

  /**
   * Get the timestamp of the last cache update
   *
   * @returns Promise resolving to the timestamp or null if not found
   */
  static async getLastUpdateTimestamp(): Promise<Date | null> {
    try {
      const timestamp = await AsyncStorage.getItem(PROTOCOL_STATE_TIMESTAMP_KEY);

      if (!timestamp) {
        return null;
      }

      return new Date(timestamp);
    } catch (error) {
      console.error('Failed to get cache timestamp:', error);
      return null;
    }
  }

  /**
   * Clear the protocol state cache
   *
   * @returns Promise that resolves when cache is cleared
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([PROTOCOL_STATE_KEY, PROTOCOL_STATE_TIMESTAMP_KEY]);
      console.log('Protocol state cache cleared');
    } catch (error) {
      console.error('Failed to clear protocol state cache:', error);
      throw new Error('Failed to clear protocol state cache');
    }
  }

  /**
   * Check if cache exists
   *
   * @returns Promise resolving to true if cache exists, false otherwise
   */
  static async exists(): Promise<boolean> {
    try {
      const serialized = await AsyncStorage.getItem(PROTOCOL_STATE_KEY);
      return serialized !== null;
    } catch (error) {
      console.error('Failed to check cache existence:', error);
      return false;
    }
  }
}
