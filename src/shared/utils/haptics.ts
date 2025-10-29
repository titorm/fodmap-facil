import * as Haptics from 'expo-haptics';

/**
 * Haptic Feedback Utilities
 *
 * Provides consistent haptic feedback throughout the app.
 * Uses Expo Haptics for cross-platform support.
 */

/**
 * Light haptic feedback for subtle interactions
 * Use for: Button presses, toggle switches, selections
 */
export const lightHaptic = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (error) {
    // Haptics may not be available on all devices
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Medium haptic feedback for standard interactions
 * Use for: Confirmations, slider changes, important selections
 */
export const mediumHaptic = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Heavy haptic feedback for significant interactions
 * Use for: Errors, warnings, critical actions
 */
export const heavyHaptic = async (): Promise<void> => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Success haptic feedback
 * Use for: Successful completions, confirmations
 */
export const successHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Warning haptic feedback
 * Use for: Warnings, cautions
 */
export const warningHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Error haptic feedback
 * Use for: Errors, failures
 */
export const errorHaptic = async (): Promise<void> => {
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Selection haptic feedback
 * Use for: Picker/slider value changes, scrolling through options
 */
export const selectionHaptic = async (): Promise<void> => {
  try {
    await Haptics.selectionAsync();
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
};

/**
 * Custom haptic pattern for specific interactions
 */
export const customHaptic = async (
  style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium
): Promise<void> => {
  try {
    await Haptics.impactAsync(style);
  } catch (error) {
    console.debug('Haptic feedback not available:', error);
  }
};
