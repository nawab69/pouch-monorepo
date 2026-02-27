import { useState, useEffect, useCallback, useRef } from 'react';
import { Token, NetworkId } from '@/types/blockchain';
import { TokenPriceData } from '@/types/coingecko';
import { getCoinGeckoId, getTokenPrice } from '@/services/coingecko';

interface UseTokenPriceOptions {
  token: Token | null;
  networkId: NetworkId;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseTokenPriceResult {
  priceUsd: number | null;
  change24h: number | null;
  marketCap: number | null;
  volume24h: number | null;
  coinGeckoId: string | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useTokenPrice({
  token,
  networkId,
  autoRefresh = true,
  refreshInterval = 60000, // 60 seconds
}: UseTokenPriceOptions): UseTokenPriceResult {
  const [priceData, setPriceData] = useState<TokenPriceData | null>(null);
  const [coinGeckoId, setCoinGeckoId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchPrice = useCallback(async () => {
    if (!token) {
      setPriceData(null);
      setCoinGeckoId(null);
      return;
    }

    const id = getCoinGeckoId(token.contractAddress, token.symbol, networkId);
    if (!id) {
      setError('Token not supported for price data');
      setCoinGeckoId(null);
      return;
    }

    setCoinGeckoId(id);
    setIsLoading(true);
    setError(null);

    try {
      const price = await getTokenPrice(id);
      setPriceData(price);
    } catch (err) {
      console.error('Error fetching token price:', err);
      setError('Failed to fetch price');
    } finally {
      setIsLoading(false);
    }
  }, [token, networkId]);

  // Initial fetch
  useEffect(() => {
    fetchPrice();
  }, [fetchPrice]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !token) return;

    intervalRef.current = setInterval(() => {
      fetchPrice();
    }, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, fetchPrice, token]);

  return {
    priceUsd: priceData?.priceUsd ?? null,
    change24h: priceData?.change24h ?? null,
    marketCap: priceData?.marketCap ?? null,
    volume24h: priceData?.volume24h ?? null,
    coinGeckoId,
    isLoading,
    error,
    refetch: fetchPrice,
  };
}
