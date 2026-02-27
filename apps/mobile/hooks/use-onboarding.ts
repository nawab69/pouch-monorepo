import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = '@pouch/onboarding_complete';

export function useOnboarding() {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      setHasSeenOnboarding(value === 'true');
    } catch (error) {
      console.warn('Error reading onboarding status:', error);
      setHasSeenOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.warn('Error saving onboarding status:', error);
    }
  }, []);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      setHasSeenOnboarding(false);
    } catch (error) {
      console.warn('Error resetting onboarding status:', error);
    }
  }, []);

  return {
    hasSeenOnboarding,
    isLoading,
    completeOnboarding,
    resetOnboarding,
  };
}
