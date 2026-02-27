import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';
import * as SecureStore from 'expo-secure-store';

const ENCRYPTION_SALT_KEY = 'pouch_encryption_salt';
const KEY_DERIVATION_ITERATIONS = 100;

/**
 * Generate a random salt for encryption key derivation
 */
export async function generateSalt(): Promise<string> {
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(new Uint8Array(randomBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Get or create the encryption salt
 * This salt is separate from the PIN verification salt
 */
export async function getOrCreateEncryptionSalt(): Promise<string> {
  let salt = await SecureStore.getItemAsync(ENCRYPTION_SALT_KEY);
  if (!salt) {
    salt = await generateSalt();
    await SecureStore.setItemAsync(ENCRYPTION_SALT_KEY, salt);
  }
  return salt;
}

/**
 * Derive an encryption key from PIN using iterative SHA-256
 * Uses 100 iterations for security while remaining performant on mobile
 */
export async function deriveKeyFromPin(pin: string, salt: string): Promise<string> {
  let hash = `${salt}:${pin}`;

  for (let i = 0; i < KEY_DERIVATION_ITERATIONS; i++) {
    hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      hash
    );
  }

  return hash;
}

/**
 * Encrypt data using AES-256
 */
export function encryptData(data: string, key: string): string {
  return CryptoJS.AES.encrypt(data, key).toString();
}

/**
 * Decrypt data using AES-256
 * Returns null if decryption fails (wrong key)
 */
export function decryptData(encrypted: string, key: string): string | null {
  try {
    const bytes = CryptoJS.AES.decrypt(encrypted, key);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // If decryption produces empty string or fails, return null
    if (!decrypted) {
      return null;
    }

    return decrypted;
  } catch {
    return null;
  }
}

/**
 * Encrypt wallet mnemonic with PIN
 */
export async function encryptMnemonic(mnemonic: string, pin: string): Promise<string> {
  const salt = await getOrCreateEncryptionSalt();
  const key = await deriveKeyFromPin(pin, salt);
  return encryptData(mnemonic, key);
}

/**
 * Decrypt wallet mnemonic with PIN
 */
export async function decryptMnemonic(encryptedMnemonic: string, pin: string): Promise<string | null> {
  const salt = await SecureStore.getItemAsync(ENCRYPTION_SALT_KEY);
  if (!salt) {
    return null;
  }

  const key = await deriveKeyFromPin(pin, salt);
  return decryptData(encryptedMnemonic, key);
}

/**
 * Encrypt private key with PIN
 */
export async function encryptPrivateKey(privateKey: string, pin: string): Promise<string> {
  const salt = await getOrCreateEncryptionSalt();
  const key = await deriveKeyFromPin(pin, salt);
  return encryptData(privateKey, key);
}

/**
 * Decrypt private key with PIN
 */
export async function decryptPrivateKey(encryptedPrivateKey: string, pin: string): Promise<string | null> {
  const salt = await SecureStore.getItemAsync(ENCRYPTION_SALT_KEY);
  if (!salt) {
    return null;
  }

  const key = await deriveKeyFromPin(pin, salt);
  return decryptData(encryptedPrivateKey, key);
}

/**
 * Delete the encryption salt (for wallet reset)
 */
export async function deleteEncryptionSalt(): Promise<void> {
  await SecureStore.deleteItemAsync(ENCRYPTION_SALT_KEY);
}

/**
 * Re-encrypt data with a new PIN
 * This is used when changing PIN - decrypts with old PIN and re-encrypts with new PIN
 * Generates a new salt for added security
 */
export async function reEncryptWithNewPin(
  encryptedData: string,
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; newEncrypted: string | null }> {
  try {
    // Get current salt to decrypt
    const currentSalt = await SecureStore.getItemAsync(ENCRYPTION_SALT_KEY);
    if (!currentSalt) {
      return { success: false, newEncrypted: null };
    }

    // Decrypt with old PIN
    const oldKey = await deriveKeyFromPin(oldPin, currentSalt);
    const decrypted = decryptData(encryptedData, oldKey);
    if (!decrypted) {
      return { success: false, newEncrypted: null };
    }

    // Generate new salt for extra security
    const newSalt = await generateSalt();

    // Encrypt with new PIN and new salt
    const newKey = await deriveKeyFromPin(newPin, newSalt);
    const newEncrypted = encryptData(decrypted, newKey);

    // Store new salt (temporarily - caller should commit this after all re-encryptions succeed)
    await SecureStore.setItemAsync(ENCRYPTION_SALT_KEY, newSalt);

    return { success: true, newEncrypted };
  } catch (error) {
    console.error('Re-encryption failed:', error);
    return { success: false, newEncrypted: null };
  }
}

/**
 * Re-encrypt mnemonic with new PIN
 * Used during PIN change flow
 */
export async function reEncryptMnemonicWithNewPin(
  encryptedMnemonic: string,
  oldPin: string,
  newPin: string
): Promise<{ success: boolean; newEncrypted: string | null }> {
  return reEncryptWithNewPin(encryptedMnemonic, oldPin, newPin);
}

/**
 * Re-encrypt private key with new PIN
 * The salt is already updated by reEncryptMnemonicWithNewPin, so use current salt
 */
export async function reEncryptPrivateKeyWithNewPin(
  encryptedPrivateKey: string,
  oldPin: string,
  newPin: string,
  oldSalt: string,
  newSalt: string
): Promise<{ success: boolean; newEncrypted: string | null }> {
  try {
    // Decrypt with old PIN using the original salt
    const oldKey = await deriveKeyFromPin(oldPin, oldSalt);
    const decrypted = decryptData(encryptedPrivateKey, oldKey);
    if (!decrypted) {
      return { success: false, newEncrypted: null };
    }

    // Encrypt with new PIN using the new salt
    const newKey = await deriveKeyFromPin(newPin, newSalt);
    const newEncrypted = encryptData(decrypted, newKey);

    return { success: true, newEncrypted };
  } catch (error) {
    console.error('Private key re-encryption failed:', error);
    return { success: false, newEncrypted: null };
  }
}

/**
 * Get the current encryption salt
 */
export async function getEncryptionSalt(): Promise<string | null> {
  return SecureStore.getItemAsync(ENCRYPTION_SALT_KEY);
}

/**
 * Set a new encryption salt
 */
export async function setEncryptionSalt(salt: string): Promise<void> {
  await SecureStore.setItemAsync(ENCRYPTION_SALT_KEY, salt);
}
