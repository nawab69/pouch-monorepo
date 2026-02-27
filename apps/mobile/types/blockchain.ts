// Network types
export type NetworkId = 'ethereum' | 'polygon' | 'arbitrum' | 'optimism' | 'base';
export type NetworkType = 'mainnet' | 'testnet';

export interface Network {
  id: NetworkId;
  name: string;
  symbol: string;
  chainId: {
    mainnet: number;
    testnet: number;
  };
  testnetName: string;
  color: string;
  explorerUrl: {
    mainnet: string;
    testnet: string;
  };
}

// Token types
export interface Token {
  contractAddress: string | null; // null = native token
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  balanceUsd: number | null;
  isNative: boolean;
  logoUrl?: string;
  // CoinGecko data (optional)
  coinGeckoId?: string;
  priceUsd?: number;
  change24h?: number;
}

// Transaction types
export type TransactionStatus = 'pending' | 'confirmed' | 'failed';
export type TransactionType = 'send' | 'receive' | 'swap' | 'approve' | 'contract';

export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  valueFormatted: string;
  valueUsd: number | null;
  gasUsed: string;
  gasPrice: string;
  timestamp: number;
  status: TransactionStatus;
  type: TransactionType;
  token?: Token;
  networkId: NetworkId;
  networkType: NetworkType;
  blockNumber: number;
  // Swap-specific details (only for type === 'swap')
  swapDetails?: {
    sellToken: Token;
    buyToken: Token;
    sellAmount: string;
    buyAmount: string;
  };
}

// Gas estimation types
export interface GasEstimate {
  gasLimit: bigint;
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedCostWei: bigint;
  estimatedCostFormatted: string;
  estimatedCostUsd: number | null;
}

export interface GasOption {
  label: 'slow' | 'standard' | 'fast';
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  estimatedTime: string;
}

// Send transaction types
export interface SendTransactionParams {
  to: string;
  amount: string;
  token: Token;
  gasEstimate: GasEstimate;
}

export interface SendTransactionResult {
  hash: string;
  explorerUrl: string;
}

// Wallet types
export interface WalletInfo {
  address: string;
  publicKey: string;
}

export interface DerivedWallet extends WalletInfo {
  privateKey: string;
  mnemonic: string;
  path: string;
}

// Account types
export interface Account {
  index: number;
  name: string;
  address: string;
  path: string;
}
