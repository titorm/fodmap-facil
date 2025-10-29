import { Linking } from 'react-native';

/**
 * Deep linking utility for the FODMAP app
 *
 * Supported deep links:
 * - fodmap://symptom/quick - Open quick symptom entry modal
 * - fodmap://symptom/quick?testStepId=123 - Open quick symptom entry with test step
 * - fodmap://test/123 - Open test wizard for test step 123
 * - fodmap://washout/123?userId=456 - Open washout screen for washout period 123
 * - fodmap://home - Navigate to home tab
 * - fodmap://diary - Navigate to diary tab
 */

export type DeepLinkAction =
  | { type: 'quick_symptom'; testStepId?: string }
  | { type: 'test_wizard'; testStepId: string }
  | { type: 'washout'; washoutPeriodId: string; userId: string }
  | { type: 'navigate'; screen: string };

/**
 * Parse a deep link URL and return the action to perform
 */
export function parseDeepLink(url: string): DeepLinkAction | null {
  try {
    const urlObj = new URL(url);
    const path = urlObj.pathname;

    // Quick symptom entry
    if (path.includes('/symptom/quick')) {
      const testStepId = urlObj.searchParams.get('testStepId') || undefined;
      return { type: 'quick_symptom', testStepId };
    }

    // Test wizard
    const testMatch = path.match(/\/test\/([^/]+)/);
    if (testMatch) {
      return { type: 'test_wizard', testStepId: testMatch[1] };
    }

    // Washout screen
    const washoutMatch = path.match(/\/washout\/([^/]+)/);
    if (washoutMatch) {
      const userId = urlObj.searchParams.get('userId');
      if (!userId) {
        console.error('Washout deep link missing required userId parameter');
        return null;
      }
      return { type: 'washout', washoutPeriodId: washoutMatch[1], userId };
    }

    // Navigation
    if (
      path === '/home' ||
      path === '/diary' ||
      path === '/tests' ||
      path === '/reports' ||
      path === '/profile'
    ) {
      return { type: 'navigate', screen: path.substring(1) };
    }

    return null;
  } catch (error) {
    console.error('Failed to parse deep link:', error);
    return null;
  }
}

/**
 * Get the initial deep link URL when the app is opened
 */
export async function getInitialDeepLink(): Promise<string | null> {
  try {
    return await Linking.getInitialURL();
  } catch (error) {
    console.error('Failed to get initial deep link:', error);
    return null;
  }
}

/**
 * Subscribe to deep link events
 */
export function subscribeToDeepLinks(callback: (action: DeepLinkAction) => void): () => void {
  const handleUrl = (event: { url: string }) => {
    const action = parseDeepLink(event.url);
    if (action) {
      callback(action);
    }
  };

  // Subscribe to URL events
  const subscription = Linking.addEventListener('url', handleUrl);

  // Check for initial URL
  getInitialDeepLink().then((url) => {
    if (url) {
      const action = parseDeepLink(url);
      if (action) {
        callback(action);
      }
    }
  });

  // Return cleanup function
  return () => {
    subscription.remove();
  };
}

/**
 * Create a deep link URL for quick symptom entry
 */
export function createQuickSymptomDeepLink(testStepId?: string): string {
  const base = 'fodmap://symptom/quick';
  if (testStepId) {
    return `${base}?testStepId=${testStepId}`;
  }
  return base;
}

/**
 * Create a deep link URL for test wizard
 */
export function createTestWizardDeepLink(testStepId: string): string {
  return `fodmap://test/${testStepId}`;
}

/**
 * Create a deep link URL for washout screen
 */
export function createWashoutDeepLink(washoutPeriodId: string, userId: string): string {
  return `fodmap://washout/${washoutPeriodId}?userId=${userId}`;
}

/**
 * Open a deep link URL
 */
export async function openDeepLink(url: string): Promise<boolean> {
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to open deep link:', error);
    return false;
  }
}
