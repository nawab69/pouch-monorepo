import AsyncStorage from '@react-native-async-storage/async-storage';
import { Token, NetworkId, NetworkType, Transaction } from '@/types/blockchain';
import { SwapResult } from './swap-types';

const SWAP_HISTORY_KEY = '@swap_history';

export interface SwapTransaction {
  hash: string;
  sellToken: Token;
  buyToken: Token;
  sellAmount: string;
  buyAmount: string;
  explorerUrl: string;
  timestamp: number;
  networkId: NetworkId;
  networkType: NetworkType;
  walletAddress: string;
}

/**
 * Save a swap transaction to local storage
 */
export async function saveSwapTransaction(
  result: SwapResult,
  networkId: NetworkId,
  networkType: NetworkType,
  walletAddress: string
): Promise<void> {
  try {
    const existing = await getSwapHistory(walletAddress);

    const swapTx: SwapTransaction = {
      hash: result.hash,
      sellToken: result.sellToken,
      buyToken: result.buyToken,
      sellAmount: result.sellAmount,
      buyAmount: result.buyAmount,
      explorerUrl: result.explorerUrl,
      timestamp: Date.now(),
      networkId,
      networkType,
      walletAddress,
    };

    // Add to beginning (most recent first)
    const updated = [swapTx, ...existing];

    // Keep only last 100 swaps
    const trimmed = updated.slice(0, 100);

    await AsyncStorage.setItem(SWAP_HISTORY_KEY, JSON.stringify(trimmed));
  } catch (error) {
    console.error('Error saving swap transaction:', error);
  }
}

/**
 * Get swap history for a wallet address
 */
export async function getSwapHistory(walletAddress: string): Promise<SwapTransaction[]> {
  try {
    const data = await AsyncStorage.getItem(SWAP_HISTORY_KEY);
    if (!data) return [];

    const allSwaps: SwapTransaction[] = JSON.parse(data);

    // Filter by wallet address
    return allSwaps.filter(
      (swap) => swap.walletAddress.toLowerCase() === walletAddress.toLowerCase()
    );
  } catch (error) {
    console.error('Error getting swap history:', error);
    return [];
  }
}

/**
 * Get swap history for a specific network
 */
export async function getSwapHistoryForNetwork(
  walletAddress: string,
  networkId: NetworkId,
  networkType: NetworkType
): Promise<SwapTransaction[]> {
  const allSwaps = await getSwapHistory(walletAddress);

  return allSwaps.filter(
    (swap) => swap.networkId === networkId && swap.networkType === networkType
  );
}

/**
 * Convert swap transactions to Transaction format for display
 */
export function swapToTransaction(swap: SwapTransaction): Transaction {
  return {
    hash: swap.hash,
    from: swap.walletAddress,
    to: '', // Router address not stored
    value: swap.sellAmount,
    valueFormatted: swap.sellAmount,
    valueUsd: null,
    gasUsed: '0',
    gasPrice: '0',
    timestamp: swap.timestamp,
    status: 'confirmed',
    type: 'swap',
    token: swap.sellToken,
    networkId: swap.networkId,
    networkType: swap.networkType,
    blockNumber: 0,
    // Extra swap data stored in a custom field
    swapDetails: {
      sellToken: swap.sellToken,
      buyToken: swap.buyToken,
      sellAmount: swap.sellAmount,
      buyAmount: swap.buyAmount,
    },
  };
}

/**
 * Clear swap history (for testing)
 */
export async function clearSwapHistory(): Promise<void> {
  await AsyncStorage.removeItem(SWAP_HISTORY_KEY);
}
