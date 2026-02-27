import { AUTO_LOCK_TIMEOUTS } from '@/constants/auth';
import type { AutoLockTimeout } from '@/types/auth';

type TimerCallback = () => void;

let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
let lastActivityTime: number = Date.now();
let currentTimeout: AutoLockTimeout = 'immediate';
let onLockCallback: TimerCallback | null = null;

/**
 * Start the inactivity timer
 */
export function startInactivityTimer(
  timeout: AutoLockTimeout,
  onLock: TimerCallback
): void {
  currentTimeout = timeout;
  onLockCallback = onLock;
  resetInactivityTimer();
}

/**
 * Reset the inactivity timer (call on user activity)
 */
export function resetInactivityTimer(): void {
  lastActivityTime = Date.now();

  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }

  const timeoutMs = AUTO_LOCK_TIMEOUTS[currentTimeout];

  // If timeout is null (never) or 0 (immediate), don't set a timer
  if (timeoutMs === null || timeoutMs === 0) {
    return;
  }

  inactivityTimer = setTimeout(() => {
    if (onLockCallback) {
      onLockCallback();
    }
  }, timeoutMs);
}

/**
 * Stop the inactivity timer
 */
export function stopInactivityTimer(): void {
  if (inactivityTimer) {
    clearTimeout(inactivityTimer);
    inactivityTimer = null;
  }
  onLockCallback = null;
}

/**
 * Get the time elapsed since last activity
 */
export function getTimeSinceLastActivity(): number {
  return Date.now() - lastActivityTime;
}

/**
 * Check if we should lock based on elapsed time
 */
export function shouldLockAfterBackground(timeout: AutoLockTimeout): boolean {
  const timeoutMs = AUTO_LOCK_TIMEOUTS[timeout];

  // Immediate timeout always locks
  if (timeoutMs === 0) {
    return true;
  }

  // Never timeout never locks
  if (timeoutMs === null) {
    return false;
  }

  // Check if elapsed time exceeds timeout
  return getTimeSinceLastActivity() >= timeoutMs;
}

/**
 * Update the current timeout setting
 */
export function updateTimeout(timeout: AutoLockTimeout): void {
  currentTimeout = timeout;
  resetInactivityTimer();
}
