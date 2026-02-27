import * as LocalAuthentication from 'expo-local-authentication';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { BiometricAvailability, AuthenticationResult, BiometricType } from '@/types/auth';

/**
 * Check if running in Expo Go (biometrics not supported)
 */
export function isExpoGo(): boolean {
  return Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
}

/**
 * Check if biometric authentication is available
 */
export async function checkBiometricAvailability(): Promise<BiometricAvailability> {
  // Biometrics don't work in Expo Go
  if (isExpoGo()) {
    return {
      hasHardware: false,
      isEnrolled: false,
      type: null,
    };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let type: BiometricType = null;

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      type = 'faceid';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      type = 'fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      type = 'iris';
    }

    return {
      hasHardware,
      isEnrolled,
      type,
    };
  } catch (error) {
    console.warn('Error checking biometric availability:', error);
    return {
      hasHardware: false,
      isEnrolled: false,
      type: null,
    };
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometric(
  promptMessage: string = 'Authenticate to continue'
): Promise<AuthenticationResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use PIN',
      disableDeviceFallback: true, // We handle our own PIN fallback
      cancelLabel: 'Cancel',
    });

    if (result.success) {
      return { success: true };
    }

    // Handle different error types
    if (result.error === 'user_cancel') {
      return { success: false, error: 'Authentication cancelled' };
    }

    if (result.error === 'user_fallback') {
      return { success: false, error: 'Use PIN' };
    }

    if (result.error === 'lockout') {
      return { success: false, error: 'Too many attempts. Try again later.' };
    }

    return { success: false, error: result.error || 'Authentication failed' };
  } catch (error) {
    console.warn('Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Get user-friendly name for biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case 'faceid':
      return 'Face ID';
    case 'fingerprint':
      return 'Touch ID';
    case 'iris':
      return 'Iris';
    default:
      return 'Biometric';
  }
}
