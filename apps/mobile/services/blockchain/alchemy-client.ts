import { Alchemy, Network as AlchemyNetwork } from 'alchemy-sdk';
import { NetworkId, NetworkType } from '@/types/blockchain';
import { ALCHEMY_API_KEY } from '@/constants/networks';

// Map our network IDs to Alchemy network enums
const ALCHEMY_NETWORK_MAP: Record<NetworkId, Record<NetworkType, AlchemyNetwork>> = {
  ethereum: {
    mainnet: AlchemyNetwork.ETH_MAINNET,
    testnet: AlchemyNetwork.ETH_SEPOLIA,
  },
  polygon: {
    mainnet: AlchemyNetwork.MATIC_MAINNET,
    testnet: AlchemyNetwork.MATIC_AMOY,
  },
  arbitrum: {
    mainnet: AlchemyNetwork.ARB_MAINNET,
    testnet: AlchemyNetwork.ARB_SEPOLIA,
  },
  optimism: {
    mainnet: AlchemyNetwork.OPT_MAINNET,
    testnet: AlchemyNetwork.OPT_SEPOLIA,
  },
  base: {
    mainnet: AlchemyNetwork.BASE_MAINNET,
    testnet: AlchemyNetwork.BASE_SEPOLIA,
  },
};

// Cache for Alchemy client instances
const clientCache = new Map<string, Alchemy>();

// Current API key (can be updated)
let apiKey = ALCHEMY_API_KEY;

/**
 * Set the Alchemy API key
 * Clears the client cache when the key changes
 */
export function setAlchemyApiKey(newApiKey: string): void {
  if (newApiKey !== apiKey) {
    apiKey = newApiKey;
    clientCache.clear();
  }
}

/**
 * Get the current Alchemy API key
 */
export function getAlchemyApiKey(): string {
  return apiKey;
}

/**
 * Get an Alchemy client for the specified network
 * Clients are cached per network/type combination
 */
export function getAlchemyClient(networkId: NetworkId, networkType: NetworkType): Alchemy {
  const cacheKey = `${networkId}-${networkType}`;

  // Check cache first
  const cached = clientCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  // Get the Alchemy network enum
  const alchemyNetwork = ALCHEMY_NETWORK_MAP[networkId]?.[networkType];
  if (!alchemyNetwork) {
    throw new Error(`Unsupported network: ${networkId} ${networkType}`);
  }

  // Create new client
  const client = new Alchemy({
    apiKey,
    network: alchemyNetwork,
  });

  // Cache and return
  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Clear all cached clients
 */
export function clearAlchemyClientCache(): void {
  clientCache.clear();
}

/**
 * Get the Alchemy network enum for a given network ID and type
 */
export function getAlchemyNetwork(
  networkId: NetworkId,
  networkType: NetworkType
): AlchemyNetwork {
  const network = ALCHEMY_NETWORK_MAP[networkId]?.[networkType];
  if (!network) {
    throw new Error(`Unsupported network: ${networkId} ${networkType}`);
  }
  return network;
}
