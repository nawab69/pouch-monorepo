export type BiometricType = 'faceid' | 'fingerprint' | 'iris' | null;
export type AutoLockTimeout = 'immediate' | '1min' | '5min' | '15min' | 'never';

export interface LockSettings {
  isEnabled: boolean;
  useBiometric: boolean;
  hasPin: boolean;
  autoLockTimeout: AutoLockTimeout;
  lockOnBackground: boolean;
}

export interface AuthContextType {
  isLocked: boolean;
  isInitialized: boolean;
  lockSettings: LockSettings;
  biometricType: BiometricType;
  hasBiometricHardware: boolean;
  failedAttempts: number;
  lockoutEndTime: number | null;

  lock: () => void;
  unlock: () => void;
  authenticateWithBiometric: () => Promise<boolean>;
  authenticateWithPin: (pin: string) => Promise<boolean>;
  setupPin: (pin: string) => Promise<void>;
  changePin: (
    oldPin: string,
    newPin: string,
    reEncryptWalletData: (oldPin: string, newPin: string) => Promise<boolean>
  ) => Promise<boolean>;
  removePin: () => Promise<void>;
  disableLock: () => Promise<void>;
  updateLockSettings: (settings: Partial<LockSettings>) => Promise<void>;
  resetFailedAttempts: () => void;
}

export interface BiometricAvailability {
  hasHardware: boolean;
  isEnrolled: boolean;
  type: BiometricType;
}

export interface AuthenticationResult {
  success: boolean;
  error?: string;
}
