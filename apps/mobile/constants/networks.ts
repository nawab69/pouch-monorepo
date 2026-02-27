import { Network, NetworkId } from '@/types/blockchain';

// Alchemy API Key - move to environment variables for production
export const ALCHEMY_API_KEY = 'vhMdHQc515gXB3rXMkVZWi3HI4SXZq7P'; // Replace with your actual key

export const NETWORKS: Record<NetworkId, Network> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    chainId: {
      mainnet: 1,
      testnet: 11155111, // Sepolia
    },
    testnetName: 'Sepolia',
    color: '#627EEA',
    explorerUrl: {
      mainnet: 'https://etherscan.io',
      testnet: 'https://sepolia.etherscan.io',
    },
  },
  polygon: {
    id: 'polygon',
    name: 'Polygon',
    symbol: 'MATIC',
    chainId: {
      mainnet: 137,
      testnet: 80002, // Amoy
    },
    testnetName: 'Amoy',
    color: '#8247E5',
    explorerUrl: {
      mainnet: 'https://polygonscan.com',
      testnet: 'https://amoy.polygonscan.com',
    },
  },
  arbitrum: {
    id: 'arbitrum',
    name: 'Arbitrum',
    symbol: 'ETH',
    chainId: {
      mainnet: 42161,
      testnet: 421614, // Arbitrum Sepolia
    },
    testnetName: 'Sepolia',
    color: '#28A0F0',
    explorerUrl: {
      mainnet: 'https://arbiscan.io',
      testnet: 'https://sepolia.arbiscan.io',
    },
  },
  optimism: {
    id: 'optimism',
    name: 'Optimism',
    symbol: 'ETH',
    chainId: {
      mainnet: 10,
      testnet: 11155420, // Optimism Sepolia
    },
    testnetName: 'Sepolia',
    color: '#FF0420',
    explorerUrl: {
      mainnet: 'https://optimistic.etherscan.io',
      testnet: 'https://sepolia-optimism.etherscan.io',
    },
  },
  base: {
    id: 'base',
    name: 'Base',
    symbol: 'ETH',
    chainId: {
      mainnet: 8453,
      testnet: 84532, // Base Sepolia
    },
    testnetName: 'Sepolia',
    color: '#0052FF',
    explorerUrl: {
      mainnet: 'https://basescan.org',
      testnet: 'https://sepolia.basescan.org',
    },
  },
};

export const NETWORK_LIST: Network[] = Object.values(NETWORKS);

export const DEFAULT_NETWORK_ID: NetworkId = 'ethereum';
export const DEFAULT_NETWORK_TYPE = 'testnet' as const;

// Get chain ID for a network
export function getChainId(networkId: NetworkId, networkType: 'mainnet' | 'testnet'): number {
  return NETWORKS[networkId].chainId[networkType];
}

// Get explorer URL for a transaction
export function getExplorerTxUrl(
  networkId: NetworkId,
  networkType: 'mainnet' | 'testnet',
  txHash: string
): string {
  const baseUrl = NETWORKS[networkId].explorerUrl[networkType];
  return `${baseUrl}/tx/${txHash}`;
}

// Get explorer URL for an address
export function getExplorerAddressUrl(
  networkId: NetworkId,
  networkType: 'mainnet' | 'testnet',
  address: string
): string {
  const baseUrl = NETWORKS[networkId].explorerUrl[networkType];
  return `${baseUrl}/address/${address}`;
}
