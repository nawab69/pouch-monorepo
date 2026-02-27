import SignClient from '@walletconnect/sign-client';
import { WALLETCONNECT_PROJECT_ID, WALLET_METADATA } from '@/constants/walletconnect';

let signClientInstance: SignClient | null = null;
let initializationPromise: Promise<SignClient> | null = null;

/**
 * Initialize the WalletConnect SignClient
 * Uses singleton pattern to ensure only one instance exists
 */
export async function initializeSignClient(): Promise<SignClient> {
  // Return existing instance if available
  if (signClientInstance) {
    return signClientInstance;
  }

  // Return existing initialization promise if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = SignClient.init({
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: WALLET_METADATA,
    relayUrl: 'wss://relay.walletconnect.com',
  });

  try {
    signClientInstance = await initializationPromise;
    console.log('[WalletConnect] SignClient initialized successfully');
    return signClientInstance;
  } catch (error) {
    console.error('[WalletConnect] Failed to initialize SignClient:', error);
    initializationPromise = null;
    throw error;
  }
}

/**
 * Get the SignClient instance
 * Throws if not initialized
 */
export function getSignClient(): SignClient {
  if (!signClientInstance) {
    throw new Error('SignClient not initialized. Call initializeSignClient() first.');
  }
  return signClientInstance;
}

/**
 * Check if SignClient is initialized
 */
export function isSignClientInitialized(): boolean {
  return signClientInstance !== null;
}

/**
 * Reset SignClient (for testing or cleanup)
 */
export async function resetSignClient(): Promise<void> {
  if (signClientInstance) {
    try {
      // Disconnect all sessions
      const sessions = signClientInstance.session.getAll();
      for (const session of sessions) {
        try {
          await signClientInstance.disconnect({
            topic: session.topic,
            reason: {
              code: 6000,
              message: 'Wallet reset',
            },
          });
        } catch {
          // Ignore disconnect errors during reset
        }
      }
    } catch {
      // Ignore errors during cleanup
    }
  }
  signClientInstance = null;
  initializationPromise = null;
}
