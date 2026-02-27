import { useEffect, useState, useCallback, useMemo } from 'react';
import { Token, NetworkId, NetworkType } from '@/types/blockchain';
import { TokenPriceData } from '@/types/coingecko';
import { getTokenBalances } from '@/services/blockchain';
import { getDefaultTokens } from '@/constants/tokens';
import { getTokenPrices, getCoinGeckoId } from '@/services/coingecko';

interface UseTokensOptions {
  address: string | null;
  networkId: NetworkId;
  networkType: NetworkType;
  autoFetch?: boolean;
}

export function useTokens({
  address,
  networkId,
  networkType,
  autoFetch = true,
}: UseTokensOptions) {
  const [fetchedTokens, setFetchedTokens] = useState<Token[]>([]);
  const [priceData, setPriceData] = useState<Map<string, TokenPriceData>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isPricesLoading, setIsPricesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get default tokens for this network
  const defaultTokens = useMemo(
    () => getDefaultTokens(networkId, networkType === 'testnet'),
    [networkId, networkType]
  );

  // Merge fetched tokens with default tokens and add price data
  const tokens = useMemo(() => {
    // Create a map of fetched tokens by address (lowercase for comparison)
    const fetchedMap = new Map<string, Token>();
    fetchedTokens.forEach((token) => {
      const key = token.contractAddress?.toLowerCase() ?? 'native';
      fetchedMap.set(key, token);
    });

    // Start with default tokens, replacing with fetched data if available
    const mergedTokens: Token[] = defaultTokens.map((defaultToken) => {
      const key = defaultToken.contractAddress?.toLowerCase() ?? 'native';
      const fetched = fetchedMap.get(key);

      const baseToken = fetched
        ? {
            ...fetched,
            logoUrl: fetched.logoUrl ?? defaultToken.logoUrl,
          }
        : defaultToken;

      // Add price data if available
      const coinGeckoId = getCoinGeckoId(baseToken.contractAddress, baseToken.symbol, networkId);
      const price = coinGeckoId ? priceData.get(coinGeckoId) : null;

      if (price) {
        const balance = parseFloat(baseToken.balanceFormatted) || 0;
        return {
          ...baseToken,
          priceUsd: price.priceUsd,
          change24h: price.change24h,
          balanceUsd: balance * price.priceUsd,
        };
      }

      return baseToken;
    });

    // Add any fetched tokens that aren't in the default list
    fetchedTokens.forEach((token) => {
      const key = token.contractAddress?.toLowerCase() ?? 'native';
      const isInDefaults = defaultTokens.some(
        (d) => (d.contractAddress?.toLowerCase() ?? 'native') === key
      );

      if (!isInDefaults && parseFloat(token.balanceFormatted) > 0) {
        // Add price data if available
        const coinGeckoId = getCoinGeckoId(token.contractAddress, token.symbol, networkId);
        const price = coinGeckoId ? priceData.get(coinGeckoId) : null;

        if (price) {
          const balance = parseFloat(token.balanceFormatted) || 0;
          mergedTokens.push({
            ...token,
            priceUsd: price.priceUsd,
            change24h: price.change24h,
            balanceUsd: balance * price.priceUsd,
          });
        } else {
          mergedTokens.push(token);
        }
      }
    });

    // Sort: native first, then by USD balance (descending), then by balance, then alphabetically
    return mergedTokens.sort((a, b) => {
      // Native token always first
      if (a.isNative && !b.isNative) return -1;
      if (!a.isNative && b.isNative) return 1;

      // Then by USD balance (higher first)
      const usdA = a.balanceUsd ?? 0;
      const usdB = b.balanceUsd ?? 0;
      if (usdB !== usdA) return usdB - usdA;

      // Then by token balance (higher first)
      const balanceA = parseFloat(a.balanceFormatted) || 0;
      const balanceB = parseFloat(b.balanceFormatted) || 0;
      if (balanceB !== balanceA) return balanceB - balanceA;

      // Then alphabetically
      return a.symbol.localeCompare(b.symbol);
    });
  }, [fetchedTokens, defaultTokens, priceData, networkId]);

  // Calculate total balance in USD
  const totalBalanceUsd = useMemo(() => {
    return tokens.reduce((sum, token) => sum + (token.balanceUsd ?? 0), 0);
  }, [tokens]);

  // Fetch prices for all tokens in a single call
  const fetchPrices = useCallback(
    async (tokenList: Token[]) => {
      // Get unique CoinGecko IDs for all tokens
      const coinGeckoIds: string[] = [];
      tokenList.forEach((token) => {
        const id = getCoinGeckoId(token.contractAddress, token.symbol, networkId);
        if (id && !coinGeckoIds.includes(id)) {
          coinGeckoIds.push(id);
        }
      });

      if (coinGeckoIds.length === 0) {
        return;
      }

      setIsPricesLoading(true);

      try {
        // Single API call for all prices
        const prices = await getTokenPrices(coinGeckoIds);
        setPriceData(prices);
      } catch (err) {
        console.error('Error fetching prices:', err);
      } finally {
        setIsPricesLoading(false);
      }
    },
    [networkId]
  );

  const fetchTokens = useCallback(async () => {
    if (!address) {
      setFetchedTokens([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getTokenBalances(address, networkId, networkType);
      setFetchedTokens(result);
      setLastUpdated(new Date());

      // Fetch prices after tokens are loaded
      await fetchPrices([...defaultTokens, ...result]);
    } catch (err) {
      console.error('Error fetching tokens:', err);
      setError('Failed to load token balances');
    } finally {
      setIsLoading(false);
    }
  }, [address, networkId, networkType, defaultTokens, fetchPrices]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch && address) {
      fetchTokens();
    }
  }, [fetchTokens, autoFetch, address]);

  // Get a specific token by contract address (null for native)
  const getToken = useCallback(
    (contractAddress: string | null): Token | undefined => {
      return tokens.find((t) =>
        contractAddress === null
          ? t.isNative
          : t.contractAddress?.toLowerCase() === contractAddress.toLowerCase()
      );
    },
    [tokens]
  );

  // Get native token
  const nativeToken = tokens.find((t) => t.isNative) ?? null;

  return {
    tokens,
    nativeToken,
    totalBalanceUsd,
    isLoading: isLoading || isPricesLoading,
    isPricesLoading,
    error,
    lastUpdated,
    refreshTokens: fetchTokens,
    getToken,
  };
}
