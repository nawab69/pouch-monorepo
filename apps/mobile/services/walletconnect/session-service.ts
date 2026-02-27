import { getSdkError } from '@walletconnect/utils';
import { getSignClient } from './sign-client';
import {
  toWCChainId,
  formatAccount,
  filterSupportedChains,
} from './chain-utils';
import {
  SUPPORTED_METHODS,
  SUPPORTED_EVENTS,
  EIP155_NAMESPACE,
} from '@/constants/walletconnect';
import type { WCSession } from '@/types/walletconnect';
import type { SessionTypes, ProposalTypes } from '@walletconnect/types';

/**
 * Clear inactive/expired pairings to prevent conflicts
 */
async function clearStalePairings(): Promise<void> {
  const signClient = getSignClient();

  try {
    const pairings = signClient.core.pairing.getPairings();
    const now = Date.now() / 1000;

    for (const pairing of pairings) {
      // Remove expired or inactive pairings
      if (pairing.expiry < now || !pairing.active) {
        try {
          await signClient.core.pairing.disconnect({ topic: pairing.topic });
          console.log('[WalletConnect] Cleared stale pairing:', pairing.topic);
        } catch {
          // Ignore errors when clearing stale pairings
        }
      }
    }
  } catch (error) {
    console.warn('[WalletConnect] Error clearing stale pairings:', error);
  }
}

/**
 * Pair with a dApp using a WalletConnect URI
 * This triggers the session_proposal event
 */
export async function pairWithUri(uri: string): Promise<void> {
  const signClient = getSignClient();

  // Clear any stale pairings first
  await clearStalePairings();

  // Retry pairing up to 3 times (relay subscription can be flaky)
  const maxRetries = 3;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[WalletConnect] Pairing attempt ${attempt}/${maxRetries}`);
      await signClient.core.pairing.pair({ uri });
      console.log('[WalletConnect] Pairing initiated with URI');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.warn(`[WalletConnect] Pairing attempt ${attempt} failed:`, lastError.message);

      // If it's the last attempt, don't wait
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  throw lastError || new Error('Pairing failed after retries');
}

/**
 * Build namespaces for session approval
 */
function buildNamespaces(
  address: string,
  chainIds: number[],
  requiredNamespaces: ProposalTypes.RequiredNamespaces,
  optionalNamespaces: ProposalTypes.OptionalNamespaces = {}
): SessionTypes.Namespaces {
  // Get all chains from required and optional namespaces
  const requiredChains = requiredNamespaces[EIP155_NAMESPACE]?.chains || [];
  const optionalChains = optionalNamespaces[EIP155_NAMESPACE]?.chains || [];

  // Filter to only chains we support and user selected
  const selectedWCChains = chainIds.map(toWCChainId);
  const supportedRequired = filterSupportedChains(requiredChains);
  const supportedOptional = filterSupportedChains(optionalChains);

  // Combine chains - include all required and selected optional
  const allChains = [
    ...new Set([
      ...supportedRequired,
      ...supportedOptional.filter(c => selectedWCChains.includes(c)),
    ]),
  ];

  // If no specific chains, use all selected
  const finalChains = allChains.length > 0 ? allChains : selectedWCChains;

  // Build accounts for all chains
  const accounts = finalChains.map(wcChain => {
    const chainId = parseInt(wcChain.split(':')[1], 10);
    return formatAccount(chainId, address);
  });

  // Get methods and events from required namespace
  const requiredMethods = requiredNamespaces[EIP155_NAMESPACE]?.methods || [];
  const requiredEvents = requiredNamespaces[EIP155_NAMESPACE]?.events || [];

  // Filter to methods and events we support
  const methods = requiredMethods.filter((m: string) =>
    (SUPPORTED_METHODS as readonly string[]).includes(m)
  );
  const events = requiredEvents.filter((e: string) =>
    (SUPPORTED_EVENTS as readonly string[]).includes(e)
  );

  // Ensure we have at least the basic methods
  const finalMethods = methods.length > 0 ? methods : [...SUPPORTED_METHODS];
  const finalEvents = events.length > 0 ? events : [...SUPPORTED_EVENTS];

  return {
    [EIP155_NAMESPACE]: {
      chains: finalChains,
      accounts,
      methods: finalMethods,
      events: finalEvents,
    },
  };
}

/**
 * Approve a session proposal
 */
export async function approveSession(
  proposalId: number,
  address: string,
  chainIds: number[],
  requiredNamespaces: ProposalTypes.RequiredNamespaces,
  optionalNamespaces: ProposalTypes.OptionalNamespaces = {}
): Promise<SessionTypes.Struct> {
  const signClient = getSignClient();

  const namespaces = buildNamespaces(
    address,
    chainIds,
    requiredNamespaces,
    optionalNamespaces
  );

  console.log('[WalletConnect] Approving session with namespaces:', namespaces);

  const { topic, acknowledged } = await signClient.approve({
    id: proposalId,
    namespaces,
  });

  // Wait for acknowledgment from dApp
  const session = await acknowledged();
  console.log('[WalletConnect] Session approved:', session.topic);

  return session;
}

/**
 * Reject a session proposal
 */
export async function rejectSession(proposalId: number): Promise<void> {
  const signClient = getSignClient();

  await signClient.reject({
    id: proposalId,
    reason: getSdkError('USER_REJECTED'),
  });

  console.log('[WalletConnect] Session rejected');
}

/**
 * Disconnect a session
 */
export async function disconnectSession(topic: string): Promise<void> {
  const signClient = getSignClient();

  await signClient.disconnect({
    topic,
    reason: getSdkError('USER_DISCONNECTED'),
  });

  console.log('[WalletConnect] Session disconnected:', topic);
}

/**
 * Get all active sessions
 */
export function getActiveSessions(): SessionTypes.Struct[] {
  const signClient = getSignClient();
  return signClient.session.getAll();
}

/**
 * Get a session by topic
 */
export function getSession(topic: string): SessionTypes.Struct | undefined {
  const signClient = getSignClient();
  try {
    return signClient.session.get(topic);
  } catch {
    return undefined;
  }
}

/**
 * Convert a SignClient session to our WCSession format
 */
export function toWCSession(session: SessionTypes.Struct): WCSession {
  return {
    topic: session.topic,
    peerMeta: {
      name: session.peer.metadata.name,
      description: session.peer.metadata.description,
      url: session.peer.metadata.url,
      icons: session.peer.metadata.icons,
    },
    namespaces: session.namespaces,
    expiry: session.expiry,
    acknowledged: session.acknowledged,
  };
}

/**
 * Get all sessions in WCSession format
 */
export function getAllWCSessions(): WCSession[] {
  return getActiveSessions().map(toWCSession);
}

/**
 * Update session with new accounts (e.g., after account change)
 */
export async function updateSessionAccounts(
  topic: string,
  address: string,
  chainIds: number[]
): Promise<void> {
  const signClient = getSignClient();
  const session = getSession(topic);

  if (!session) {
    throw new Error(`Session not found: ${topic}`);
  }

  const accounts = chainIds.map(chainId => formatAccount(chainId, address));

  await signClient.update({
    topic,
    namespaces: {
      ...session.namespaces,
      [EIP155_NAMESPACE]: {
        ...session.namespaces[EIP155_NAMESPACE],
        accounts,
      },
    },
  });

  console.log('[WalletConnect] Session accounts updated');
}

/**
 * Emit a chain changed event to a session
 */
export async function emitChainChanged(topic: string, chainId: number): Promise<void> {
  const signClient = getSignClient();

  await signClient.emit({
    topic,
    event: {
      name: 'chainChanged',
      data: chainId,
    },
    chainId: toWCChainId(chainId),
  });

  console.log('[WalletConnect] Emitted chainChanged:', chainId);
}

/**
 * Emit an accounts changed event to a session
 */
export async function emitAccountsChanged(
  topic: string,
  accounts: string[],
  chainId: number
): Promise<void> {
  const signClient = getSignClient();

  await signClient.emit({
    topic,
    event: {
      name: 'accountsChanged',
      data: accounts,
    },
    chainId: toWCChainId(chainId),
  });

  console.log('[WalletConnect] Emitted accountsChanged');
}
