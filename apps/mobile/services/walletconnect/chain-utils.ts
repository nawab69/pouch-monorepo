import { NETWORKS, NETWORK_LIST } from '@/constants/networks';
import { NetworkId, NetworkType } from '@/types/blockchain';
import { EIP155_NAMESPACE } from '@/constants/walletconnect';

/**
 * Convert a numeric chain ID to WalletConnect format (eip155:chainId)
 */
export function toWCChainId(chainId: number): string {
  return `${EIP155_NAMESPACE}:${chainId}`;
}

/**
 * Parse a WalletConnect chain ID (eip155:chainId) to numeric
 */
export function fromWCChainId(wcChainId: string): number {
  const parts = wcChainId.split(':');
  if (parts.length !== 2 || parts[0] !== EIP155_NAMESPACE) {
    throw new Error(`Invalid WalletConnect chain ID: ${wcChainId}`);
  }
  return parseInt(parts[1], 10);
}

/**
 * Format an account in CAIP-10 format (eip155:chainId:address)
 */
export function formatAccount(chainId: number, address: string): string {
  return `${EIP155_NAMESPACE}:${chainId}:${address}`;
}

/**
 * Parse a CAIP-10 account string
 */
export function parseAccount(account: string): { namespace: string; chainId: number; address: string } {
  const parts = account.split(':');
  if (parts.length !== 3) {
    throw new Error(`Invalid CAIP-10 account: ${account}`);
  }
  return {
    namespace: parts[0],
    chainId: parseInt(parts[1], 10),
    address: parts[2],
  };
}

/**
 * Get all supported chain IDs for a network type
 */
export function getSupportedChainIds(networkType: NetworkType): number[] {
  return NETWORK_LIST.map(network => network.chainId[networkType]);
}

/**
 * Get all supported WalletConnect chain IDs for a network type
 */
export function getSupportedWCChainIds(networkType: NetworkType): string[] {
  return getSupportedChainIds(networkType).map(toWCChainId);
}

/**
 * Get formatted accounts for all supported chains
 */
export function getAccountsForAllChains(address: string, networkType: NetworkType): string[] {
  return getSupportedChainIds(networkType).map(chainId => formatAccount(chainId, address));
}

/**
 * Find network by chain ID
 */
export function findNetworkByChainId(chainId: number): { networkId: NetworkId; networkType: NetworkType } | null {
  for (const network of NETWORK_LIST) {
    if (network.chainId.mainnet === chainId) {
      return { networkId: network.id, networkType: 'mainnet' };
    }
    if (network.chainId.testnet === chainId) {
      return { networkId: network.id, networkType: 'testnet' };
    }
  }
  return null;
}

/**
 * Check if a chain ID is supported
 */
export function isChainIdSupported(chainId: number): boolean {
  return findNetworkByChainId(chainId) !== null;
}

/**
 * Get the network name for a chain ID
 */
export function getNetworkNameForChainId(chainId: number): string {
  const result = findNetworkByChainId(chainId);
  if (!result) {
    return `Chain ${chainId}`;
  }
  const network = NETWORKS[result.networkId];
  if (result.networkType === 'testnet') {
    return `${network.name} ${network.testnetName}`;
  }
  return network.name;
}

/**
 * Filter requested chains to only supported ones
 */
export function filterSupportedChains(wcChainIds: string[]): string[] {
  return wcChainIds.filter(wcChainId => {
    try {
      const chainId = fromWCChainId(wcChainId);
      return isChainIdSupported(chainId);
    } catch {
      return false;
    }
  });
}
