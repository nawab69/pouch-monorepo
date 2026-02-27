import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AuthContextType,
  LockSettings,
  BiometricType,
} from '@/types/auth';
import {
  AUTH_STORAGE_KEYS,
  DEFAULT_LOCK_SETTINGS,
  MAX_FAILED_ATTEMPTS,
  BASE_LOCKOUT_SECONDS,
  LOCKOUT_MULTIPLIER,
  BIOMETRIC_PROMPTS,
} from '@/constants/auth';
import {
  checkBiometricAvailability,
  authenticateWithBiometric,
} from '@/services/auth/biometric-service';
import {
  storePin,
  verifyPin,
  hasStoredPin,
  removeStoredPin,
} from '@/services/auth/pin-service';
import {
  startInactivityTimer,
  stopInactivityTimer,
  shouldLockAfterBackground,
  resetInactivityTimer,
  updateTimeout,
} from '@/services/auth/lock-service';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLocked, setIsLocked] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [lockSettings, setLockSettings] = useState<LockSettings>(DEFAULT_LOCK_SETTINGS);
  const [biometricType, setBiometricType] = useState<BiometricType>(null);
  const [hasBiometricHardware, setHasBiometricHardware] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutEndTime, setLockoutEndTime] = useState<number | null>(null);

  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTime = useRef<number>(Date.now());
  const unlockTime = useRef<number>(0);
  const wentToBackground = useRef<boolean>(false);

  // Initialize auth state
  useEffect(() => {
    initializeAuth();
  }, []);

  // Handle app state changes for auto-lock
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
      stopInactivityTimer();
    };
  }, [lockSettings, isLocked]);

  // Start inactivity timer when unlocked
  useEffect(() => {
    if (!isLocked && lockSettings.isEnabled) {
      startInactivityTimer(lockSettings.autoLockTimeout, lock);
    }
    return () => {
      stopInactivityTimer();
    };
  }, [isLocked, lockSettings.isEnabled, lockSettings.autoLockTimeout]);

  // Update inactivity timer when timeout changes
  useEffect(() => {
    if (!isLocked && lockSettings.isEnabled) {
      updateTimeout(lockSettings.autoLockTimeout);
    }
  }, [lockSettings.autoLockTimeout]);

  const handleAppStateChange = useCallback(
    (nextAppState: AppStateStatus) => {
      // App going to background/inactive
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        backgroundTime.current = Date.now();
        // Track if we actually went to background (not just inactive from Face ID/system dialogs)
        if (nextAppState === 'background') {
          wentToBackground.current = true;
        }
      }

      // Track transition to background from inactive state as well
      if (appState.current === 'inactive' && nextAppState === 'background') {
        wentToBackground.current = true;
      }

      // App coming to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        if (lockSettings.isEnabled && !isLocked) {
          // Skip locking if we just unlocked (biometric prompt causes inactive→active transition)
          const timeSinceUnlock = Date.now() - unlockTime.current;
          if (timeSinceUnlock < 2000) {
            wentToBackground.current = false;
            appState.current = nextAppState;
            return;
          }

          // Only lock if we actually went to background (not just inactive from Face ID)
          if (wentToBackground.current) {
            if (lockSettings.lockOnBackground) {
              // Lock immediately when returning from background
              lock();
            } else if (shouldLockAfterBackground(lockSettings.autoLockTimeout)) {
              // Lock if timeout exceeded
              lock();
            }
          }
        }
        wentToBackground.current = false;
      }

      appState.current = nextAppState;
    },
    [lockSettings, isLocked]
  );

  const initializeAuth = async () => {
    try {
      // Check biometric availability
      const biometricStatus = await checkBiometricAvailability();
      setBiometricType(biometricStatus.type);
      setHasBiometricHardware(biometricStatus.hasHardware && biometricStatus.isEnrolled);

      // Load lock settings
      const settingsJson = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.LOCK_SETTINGS);
      if (settingsJson) {
        const savedSettings = JSON.parse(settingsJson) as LockSettings;

        // Verify PIN still exists if settings say it should
        if (savedSettings.hasPin) {
          const pinExists = await hasStoredPin();
          savedSettings.hasPin = pinExists;
        }

        setLockSettings(savedSettings);

        // If app lock is enabled, start locked
        if (savedSettings.isEnabled && savedSettings.hasPin) {
          setIsLocked(true);
        } else {
          setIsLocked(false);
        }
      } else {
        setIsLocked(false);
      }

      // Load failed attempts
      const attemptsStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
      if (attemptsStr) {
        setFailedAttempts(parseInt(attemptsStr, 10));
      }

      // Load lockout end time
      const lockoutStr = await AsyncStorage.getItem(AUTH_STORAGE_KEYS.LOCKOUT_END_TIME);
      if (lockoutStr) {
        const endTime = parseInt(lockoutStr, 10);
        if (endTime > Date.now()) {
          setLockoutEndTime(endTime);
        } else {
          // Lockout has expired, clear it
          await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LOCKOUT_END_TIME);
          await AsyncStorage.removeItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
          setFailedAttempts(0);
        }
      }
    } catch (error) {
      console.warn('Error initializing auth:', error);
      setIsLocked(false);
    } finally {
      setIsInitialized(true);
    }
  };

  const lock = useCallback(() => {
    if (lockSettings.isEnabled) {
      setIsLocked(true);
      stopInactivityTimer();
    }
  }, [lockSettings.isEnabled]);

  const unlock = useCallback(() => {
    setIsLocked(false);
    unlockTime.current = Date.now();
    setFailedAttempts(0);
    AsyncStorage.removeItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
    AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LOCKOUT_END_TIME);
    setLockoutEndTime(null);
    resetInactivityTimer();
  }, []);

  const handleFailedAttempt = useCallback(async () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);
    await AsyncStorage.setItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS, newAttempts.toString());

    if (newAttempts >= MAX_FAILED_ATTEMPTS) {
      // Calculate lockout duration with exponential backoff
      const lockoutMultiplier = Math.floor(newAttempts / MAX_FAILED_ATTEMPTS);
      const lockoutSeconds = BASE_LOCKOUT_SECONDS * Math.pow(LOCKOUT_MULTIPLIER, lockoutMultiplier - 1);
      const endTime = Date.now() + lockoutSeconds * 1000;

      setLockoutEndTime(endTime);
      await AsyncStorage.setItem(AUTH_STORAGE_KEYS.LOCKOUT_END_TIME, endTime.toString());
    }
  }, [failedAttempts]);

  const authenticateWithBiometricHandler = useCallback(async (): Promise<boolean> => {
    if (!lockSettings.useBiometric || !hasBiometricHardware) {
      return false;
    }

    const result = await authenticateWithBiometric(BIOMETRIC_PROMPTS.UNLOCK);

    if (result.success) {
      unlock();
      return true;
    }

    return false;
  }, [lockSettings.useBiometric, hasBiometricHardware, unlock]);

  const authenticateWithPinHandler = useCallback(
    async (pin: string): Promise<boolean> => {
      // Check if locked out
      if (lockoutEndTime && lockoutEndTime > Date.now()) {
        return false;
      }

      const isValid = await verifyPin(pin);

      if (isValid) {
        unlock();
        return true;
      }

      await handleFailedAttempt();
      return false;
    },
    [lockoutEndTime, unlock, handleFailedAttempt]
  );

  const setupPinHandler = useCallback(async (pin: string): Promise<void> => {
    await storePin(pin);

    const newSettings: LockSettings = {
      ...lockSettings,
      hasPin: true,
      isEnabled: true,
    };

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEYS.LOCK_SETTINGS,
      JSON.stringify(newSettings)
    );
    setLockSettings(newSettings);
  }, [lockSettings]);

  /**
   * Change PIN and re-encrypt all wallet data
   * This ensures the mnemonic and private keys are encrypted with the new PIN
   */
  const changePinHandler = useCallback(
    async (
      oldPin: string,
      newPin: string,
      reEncryptWalletData: (oldPin: string, newPin: string) => Promise<boolean>
    ): Promise<boolean> => {
      try {
        // Step 1: Re-encrypt all wallet data with new PIN
        // This also verifies the old PIN is correct (decryption will fail if wrong)
        const reEncryptSuccess = await reEncryptWalletData(oldPin, newPin);
        if (!reEncryptSuccess) {
          // Old PIN was wrong or re-encryption failed
          return false;
        }

        // Step 2: Update PIN hash for app lock
        await storePin(newPin);

        // Step 3: Update settings to ensure PIN is marked as set
        const newSettings: LockSettings = {
          ...lockSettings,
          hasPin: true,
          isEnabled: true,
        };

        await AsyncStorage.setItem(
          AUTH_STORAGE_KEYS.LOCK_SETTINGS,
          JSON.stringify(newSettings)
        );
        setLockSettings(newSettings);

        return true;
      } catch (error) {
        console.error('PIN change failed:', error);
        return false;
      }
    },
    [lockSettings]
  );

  const removePinHandler = useCallback(async (): Promise<void> => {
    await removeStoredPin();

    const newSettings: LockSettings = {
      ...DEFAULT_LOCK_SETTINGS,
      hasPin: false,
      isEnabled: false,
    };

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEYS.LOCK_SETTINGS,
      JSON.stringify(newSettings)
    );
    setLockSettings(newSettings);
    setIsLocked(false);
  }, []);

  /**
   * Disable app lock without removing PIN
   * This keeps the PIN for wallet encryption but disables the lock screen
   * PIN is still required for sensitive operations like viewing recovery phrase
   */
  const disableLockHandler = useCallback(async (): Promise<void> => {
    // DON'T call removeStoredPin() - keep PIN for encryption verification
    const newSettings: LockSettings = {
      ...lockSettings,
      isEnabled: false,
      useBiometric: false,
      lockOnBackground: false,
    };

    await AsyncStorage.setItem(
      AUTH_STORAGE_KEYS.LOCK_SETTINGS,
      JSON.stringify(newSettings)
    );
    setLockSettings(newSettings);
    setIsLocked(false);
  }, [lockSettings]);

  const updateLockSettingsHandler = useCallback(
    async (newSettings: Partial<LockSettings>): Promise<void> => {
      const updatedSettings: LockSettings = {
        ...lockSettings,
        ...newSettings,
      };

      // If disabling biometric but no PIN, disable lock entirely
      if (!updatedSettings.useBiometric && !updatedSettings.hasPin) {
        updatedSettings.isEnabled = false;
      }

      await AsyncStorage.setItem(
        AUTH_STORAGE_KEYS.LOCK_SETTINGS,
        JSON.stringify(updatedSettings)
      );
      setLockSettings(updatedSettings);

      // If disabling lock, unlock immediately
      if (!updatedSettings.isEnabled) {
        setIsLocked(false);
      }
    },
    [lockSettings]
  );

  const resetFailedAttemptsHandler = useCallback(() => {
    setFailedAttempts(0);
    setLockoutEndTime(null);
    AsyncStorage.removeItem(AUTH_STORAGE_KEYS.FAILED_ATTEMPTS);
    AsyncStorage.removeItem(AUTH_STORAGE_KEYS.LOCKOUT_END_TIME);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        isLocked,
        isInitialized,
        lockSettings,
        biometricType,
        hasBiometricHardware,
        failedAttempts,
        lockoutEndTime,
        lock,
        unlock,
        authenticateWithBiometric: authenticateWithBiometricHandler,
        authenticateWithPin: authenticateWithPinHandler,
        setupPin: setupPinHandler,
        changePin: changePinHandler,
        removePin: removePinHandler,
        disableLock: disableLockHandler,
        updateLockSettings: updateLockSettingsHandler,
        resetFailedAttempts: resetFailedAttemptsHandler,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
