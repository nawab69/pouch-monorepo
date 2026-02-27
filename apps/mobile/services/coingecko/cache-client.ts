// Cache server API client
// Connects to the local CoinGecko cache server
import { CACHE_SERVER_URL } from '@/constants/api';

interface CacheServerResponse<T> {
  data: T;
  fromCache: boolean;
  timestamp: number;
}

interface PriceData {
  usd: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
  usd_market_cap?: number;
}

export interface PricesResponse {
  [coinId: string]: PriceData;
}

export interface ChartPoint {
  timestamp: number;
  price: number;
}

export interface ChartResponse {
  prices: ChartPoint[];
  fromCache: boolean;
  timestamp: number;
}

/**
 * Fetch from cache server with error handling
 */
async function fetchFromCache<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${CACHE_SERVER_URL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`Cache server error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error(`Cache server fetch failed: ${endpoint}`, error);
    throw error;
  }
}

/**
 * Get prices for multiple coins in a single request
 */
export async function fetchPrices(coinIds: string[]): Promise<CacheServerResponse<PricesResponse>> {
  if (coinIds.length === 0) {
    return { data: {}, fromCache: true, timestamp: Date.now() };
  }

  const ids = coinIds.join(',');
  return fetchFromCache<CacheServerResponse<PricesResponse>>(`/prices?ids=${ids}`);
}

/**
 * Get chart data for a coin
 */
export async function fetchChartData(coinId: string, days: number | string): Promise<ChartResponse> {
  return fetchFromCache<ChartResponse>(`/chart/${coinId}?days=${days}`);
}

/**
 * Get coin details
 */
export async function fetchCoinDetails(coinId: string): Promise<CacheServerResponse<unknown>> {
  return fetchFromCache<CacheServerResponse<unknown>>(`/coin/${coinId}`);
}

/**
 * Search for coins
 */
export async function searchCoins(query: string): Promise<CacheServerResponse<unknown>> {
  return fetchFromCache<CacheServerResponse<unknown>>(`/search?q=${encodeURIComponent(query)}`);
}

/**
 * Get token price by contract address
 */
export async function fetchContractPrice(
  platform: string,
  address: string
): Promise<CacheServerResponse<PricesResponse>> {
  return fetchFromCache<CacheServerResponse<PricesResponse>>(`/contract/${platform}/${address}`);
}

/**
 * Check cache server health
 */
export async function checkHealth(): Promise<{ status: string; redis: boolean }> {
  try {
    return await fetchFromCache<{ status: string; redis: boolean }>('/health');
  } catch {
    return { status: 'error', redis: false };
  }
}
