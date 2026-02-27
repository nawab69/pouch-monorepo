// This MUST be imported before any crypto libraries (ethers, @scure/bip39, WalletConnect, etc.)
import 'react-native-get-random-values';
import 'fast-text-encoding'; // TextEncoder/TextDecoder polyfill

// Additional expo-crypto polyfill as fallback
import * as ExpoCrypto from 'expo-crypto';

// Ensure crypto.getRandomValues exists
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = {};
}

if (typeof global.crypto.getRandomValues === 'undefined') {
  global.crypto.getRandomValues = <T extends ArrayBufferView | null>(array: T): T => {
    if (array === null) return array;

    const bytes = ExpoCrypto.getRandomBytes(array.byteLength);
    const uint8Array = new Uint8Array(array.buffer, array.byteOffset, array.byteLength);
    uint8Array.set(bytes);

    return array;
  };
}

// Polyfill for WalletConnect - ensure global is defined
if (typeof global.self === 'undefined') {
  (global as any).self = global;
}
