import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_STORAGE_KEY = '@fodmap_app:onboarding_state';

export interface OnboardingState {
  completed: boolean;
  disclaimerAccepted: boolean;
  assessmentCompleted: boolean;
  assessmentScore: number;
  completedAt?: string;
}

const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  disclaimerAccepted: false,
  assessmentCompleted: false,
  assessmentScore: 0,
  completedAt: undefined,
};

export function useOnboarding() {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>(DEFAULT_ONBOARDING_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Load onboarding state from AsyncStorage
  useEffect(() => {
    loadOnboardingState();
  }, []);

  const loadOnboardingState = async () => {
    try {
      setLoading(true);
      const storedState = await AsyncStorage.getItem(ONBOARDING_STORAGE_KEY);

      if (storedState) {
        const parsedState = JSON.parse(storedState) as OnboardingState;
        setOnboardingState(parsedState);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load onboarding state'));
      console.error('Error loading onboarding state:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveOnboardingState = async (newState: Partial<OnboardingState>) => {
    try {
      const updatedState = { ...onboardingState, ...newState };
      await AsyncStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify(updatedState));
      setOnboardingState(updatedState);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save onboarding state'));
      console.error('Error saving onboarding state:', err);
      throw err;
    }
  };

  const completeOnboarding = useCallback(async () => {
    await saveOnboardingState({
      completed: true,
      completedAt: new Date().toISOString(),
    });
  }, [onboardingState]);

  const acceptDisclaimer = useCallback(async () => {
    await saveOnboardingState({
      disclaimerAccepted: true,
    });
  }, [onboardingState]);

  const completeAssessment = useCallback(
    async (score: number) => {
      await saveOnboardingState({
        assessmentCompleted: true,
        assessmentScore: score,
      });
    },
    [onboardingState]
  );

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_STORAGE_KEY);
      setOnboardingState(DEFAULT_ONBOARDING_STATE);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to reset onboarding state'));
      console.error('Error resetting onboarding state:', err);
      throw err;
    }
  }, []);

  return {
    onboardingState,
    loading,
    error,
    completeOnboarding,
    acceptDisclaimer,
    completeAssessment,
    resetOnboarding,
  };
}
