import { useState, useEffect, useCallback, useMemo } from 'react';
import { Token, NetworkId, NetworkType, Transaction } from '@/types/blockchain';
import { getTransactionHistory } from '@/services/blockchain';
import { getSwapHistoryForNetwork, swapToTransaction } from '@/services/swap';

interface UseTokenTransactionsOptions {
  address: string | null;
  token: Token | null;
  networkId: NetworkId;
  networkType: NetworkType;
  limit?: number;
}

interface UseTokenTransactionsResult {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTokenTransactions({
  address,
  token,
  networkId,
  networkType,
  limit = 10,
}: UseTokenTransactionsOptions): UseTokenTransactionsResult {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!address) {
      setAllTransactions([]);
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

      // Merge and deduplicate by hash
      const allTxs = [...blockchainHistory, ...swapTransactions];
      const uniqueByHash = new Map<string, Transaction>();

      for (const tx of allTxs) {
        const existing = uniqueByHash.get(tx.hash);
        // Prefer swap transaction type over send/receive if same hash
        if (!existing || tx.type === 'swap') {
          uniqueByHash.set(tx.hash, tx);
        }
      }

      // Sort by timestamp descending
      const merged = Array.from(uniqueByHash.values()).sort(
        (a, b) => b.timestamp - a.timestamp
      );

      setAllTransactions(merged);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transaction history');
    } finally {
      setIsLoading(false);
    }
  }, [address, networkId, networkType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Filter transactions for the specific token
  const transactions = useMemo(() => {
    if (!token || allTransactions.length === 0) {
      return [];
    }

    const filtered = allTransactions.filter((tx) => {
      // For swap transactions, check both sellToken and buyToken
      if (tx.type === 'swap' && tx.swapDetails) {
        const { sellToken: swapSell, buyToken: swapBuy } = tx.swapDetails;

        if (token.isNative) {
          return swapSell.isNative || swapBuy.isNative;
        } else {
          const tokenAddr = token.contractAddress?.toLowerCase();
          return (
            swapSell.contractAddress?.toLowerCase() === tokenAddr ||
            swapBuy.contractAddress?.toLowerCase() === tokenAddr
          );
        }
      }

      // For regular send/receive transactions
      if (token.isNative) {
        return tx.token?.isNative === true;
      } else {
        return (
          tx.token?.contractAddress?.toLowerCase() ===
          token.contractAddress?.toLowerCase()
        );
      }
    });

    return filtered.slice(0, limit);
  }, [token, allTransactions, limit]);

  return {
    transactions,
    isLoading,
    error,
    refetch: fetchTransactions,
  };
}
