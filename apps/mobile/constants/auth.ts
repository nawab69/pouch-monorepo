// Storage keys
export const AUTH_STORAGE_KEYS = {
  LOCK_SETTINGS: '@pouch/lock_settings',
  PIN_HASH: 'pouch_pin_hash',
  PIN_SALT: 'pouch_pin_salt',
  FAILED_ATTEMPTS: '@pouch/failed_attempts',
  LOCKOUT_END_TIME: '@pouch/lockout_end_time',
} as const;

// PIN configuration
export const PIN_LENGTH = 6;

// Lockout configuration
export const MAX_FAILED_ATTEMPTS = 5;
export const BASE_LOCKOUT_SECONDS = 30;
export const LOCKOUT_MULTIPLIER = 2;

// Auto-lock timeout values in milliseconds
export const AUTO_LOCK_TIMEOUTS: Record<string, number | null> = {
  immediate: 0,
  '1min': 60 * 1000,
  '5min': 5 * 60 * 1000,
  '15min': 15 * 60 * 1000,
  never: null,
} as const;

// Biometric prompt messages
export const BIOMETRIC_PROMPTS = {
  UNLOCK: 'Unlock your wallet',
  VIEW_RECOVERY: 'View recovery phrase',
  CONFIRM_ACTION: 'Confirm your identity',
} as const;

// Default lock settings
export const DEFAULT_LOCK_SETTINGS = {
  isEnabled: false,
  useBiometric: false,
  hasPin: false,
  autoLockTimeout: 'immediate' as const,
  lockOnBackground: true,
} as const;
