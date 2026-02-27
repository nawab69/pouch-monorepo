// CoinGecko price fetching service via cache server
import { fetchPrices, PricesResponse } from './cache-client';
import type { TokenPriceData } from '@/types/coingecko';

/**
 * Fetch current prices for multiple tokens via cache server
 * Returns a map of coinGeckoId -> TokenPriceData
 */
export async function getTokenPrices(
  coinGeckoIds: string[]
): Promise<Map<string, TokenPriceData>> {
  const result = new Map<string, TokenPriceData>();

  if (coinGeckoIds.length === 0) {
    return result;
  }

  try {
    const response = await fetchPrices(coinGeckoIds);
    const data = response.data;

    // Process each price
    for (const id of coinGeckoIds) {
      const priceData = data[id];
      if (priceData) {
        const tokenPriceData: TokenPriceData = {
          coinGeckoId: id,
          priceUsd: priceData.usd,
          change24h: priceData.usd_24h_change ?? 0,
          volume24h: priceData.usd_24h_vol ?? 0,
          marketCap: priceData.usd_market_cap ?? 0,
          lastUpdated: response.timestamp,
        };
        result.set(id, tokenPriceData);
      }
    }
  } catch (error) {
    console.error('Error fetching prices from cache server:', error);
  }

  return result;
}

/**
 * Fetch current price for a single token
 */
export async function getTokenPrice(
  coinGeckoId: string
): Promise<TokenPriceData | null> {
  const prices = await getTokenPrices([coinGeckoId]);
  return prices.get(coinGeckoId) ?? null;
}
