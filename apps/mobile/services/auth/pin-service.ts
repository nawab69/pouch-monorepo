import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { AUTH_STORAGE_KEYS } from '@/constants/auth';

/**
 * Generate a random salt for PIN hashing
 */
async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(new Uint8Array(randomBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Hash PIN with salt using SHA-256
 */
async function hashPin(pin: string, salt: string): Promise<string> {
  const dataToHash = `${salt}:${pin}`;
  const hash = await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    dataToHash
  );
  return hash;
}

/**
 * Store a new PIN securely
 */
export async function storePin(pin: string): Promise<void> {
  try {
    const salt = await generateSalt();
    const hash = await hashPin(pin, salt);

    await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.PIN_SALT, salt);
    await SecureStore.setItemAsync(AUTH_STORAGE_KEYS.PIN_HASH, hash);
  } catch (error) {
    console.warn('Error storing PIN:', error);
    throw new Error('Failed to store PIN');
  }
}

/**
 * Verify a PIN against the stored hash
 */
export async function verifyPin(pin: string): Promise<boolean> {
  try {
    const storedSalt = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.PIN_SALT);
    const storedHash = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.PIN_HASH);

    if (!storedSalt || !storedHash) {
      return false;
    }

    const hash = await hashPin(pin, storedSalt);
    return hash === storedHash;
  } catch (error) {
    console.warn('Error verifying PIN:', error);
    return false;
  }
}

/**
 * Check if a PIN is stored
 */
export async function hasStoredPin(): Promise<boolean> {
  try {
    const hash = await SecureStore.getItemAsync(AUTH_STORAGE_KEYS.PIN_HASH);
    return hash !== null;
  } catch (error) {
    console.warn('Error checking stored PIN:', error);
    return false;
  }
}

/**
 * Remove the stored PIN
 */
export async function removeStoredPin(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.PIN_SALT);
    await SecureStore.deleteItemAsync(AUTH_STORAGE_KEYS.PIN_HASH);
  } catch (error) {
    console.warn('Error removing PIN:', error);
    throw new Error('Failed to remove PIN');
  }
}
