import { useState, useCallback } from 'react';
import {
  Token,
  NetworkId,
  NetworkType,
  Transaction,
  GasEstimate,
  GasOption,
  SendTransactionParams,
  SendTransactionResult,
} from '@/types/blockchain';
import {
  estimateGas,
  getGasOptions,
  sendTransaction,
  getTransactionHistory,
  waitForTransaction,
} from '@/services/blockchain';
import {
  getSwapHistoryForNetwork,
  swapToTransaction,
} from '@/services/swap';

interface UseTransactionsOptions {
  address: string | null;
  networkId: NetworkId;
  networkType: NetworkType;
  getPrivateKey: () => Promise<string | null>;
}

export function useTransactions({
  address,
  networkId,
  networkType,
  getPrivateKey,
}: UseTransactionsOptions) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transaction history (including swaps)
  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setTransactions([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch both blockchain history and local swap history
      const [blockchainHistory, swapHistory] = await Promise.all([
        getTransactionHistory(address, networkId, networkType),
        getSwapHistoryForNetwork(address, networkId, networkType),
      ]);

      // Convert swap history to Transaction format
      const swapTransactions = swapHistory.map(swapToTransaction);

      // Merge and deduplicate by hash (swaps might appear in both)
      const allTransactions = [...blockchainHistory, ...swapTransactions];
      const uniqueByHash = new Map<string, Transaction>();

      for (const tx of allTransactions) {
        const existing = uniqueByHash.get(tx.hash);
        // Prefer swap transaction type over send/receive if same hash
        if (!existing || tx.type === 'swap') {
          uniqueByHash.set(tx.hash, tx);
        }
      }

      // Sort by timestamp descending (most recent first)
      const merged = Array.from(uniqueByHash.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );

      setTransactions(merged);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [address, networkId, networkType]);

  // Get gas estimate for a transaction
  const getGasEstimate = useCallback(
    async (to: string, token: Token, amount: string): Promise<GasEstimate | null> => {
      if (!address) return null;

      try {
        return await estimateGas(address, to, token, amount, networkId, networkType);
      } catch (err) {
        console.error('Error estimating gas:', err);
        setError('Failed to estimate gas');
        return null;
      }
    },
    [address, networkId, networkType]
  );

  // Get gas options (slow, standard, fast)
  const fetchGasOptions = useCallback(async (): Promise<GasOption[]> => {
    try {
      return await getGasOptions(networkId, networkType);
    } catch (err) {
      console.error('Error getting gas options:', err);
      return [];
    }
  }, [networkId, networkType]);

  // Send a transaction
  const send = useCallback(
    async (params: SendTransactionParams): Promise<SendTransactionResult | null> => {
      setIsSending(true);
      setError(null);

      try {
        const privateKey = await getPrivateKey();
        if (!privateKey) {
          throw new Error('Unable to access wallet');
        }

        const result = await sendTransaction(
          privateKey,
          params,
          networkId,
          networkType
        );

        // Refresh transactions after sending
        await fetchTransactions();

        return result;
      } catch (err) {
        console.error('Error sending transaction:', err);
        setError(err instanceof Error ? err.message : 'Failed to send transaction');
        return null;
      } finally {
        setIsSending(false);
      }
    },
    [networkId, networkType, getPrivateKey, fetchTransactions]
  );

  // Wait for a transaction to be confirmed
  const waitForConfirmation = useCallback(
    async (txHash: string): Promise<boolean> => {
      try {
        return await waitForTransaction(txHash, networkId, networkType);
      } catch (err) {
        console.error('Error waiting for transaction:', err);
        return false;
      }
    },
    [networkId, networkType]
  );

  return {
    transactions,
    isLoading,
    isSending,
    error,
    refreshTransactions: fetchTransactions,
    getGasEstimate,
    getGasOptions: fetchGasOptions,
    send,
    waitForConfirmation,
  };
}
