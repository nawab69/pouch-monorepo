import axios from 'axios';
import { cache } from './cache.js';
import { requestQueue } from './queue.js';

const BASE_URL = 'https://api.coingecko.com/api/v3';

// Cache TTLs from env or defaults (in seconds)
const TTL = {
  prices: parseInt(process.env.CACHE_TTL_PRICES) || 300, // 5 min
  chart_1d: parseInt(process.env.CACHE_TTL_CHART_1D) || 300, // 5 min
  chart_1w: parseInt(process.env.CACHE_TTL_CHART_1W) || 900, // 15 min
  chart_1m: parseInt(process.env.CACHE_TTL_CHART_1M) || 3600, // 1 hour
  chart_1y: parseInt(process.env.CACHE_TTL_CHART_1Y) || 86400, // 24 hours
  coinList: 86400, // 24 hours
  coinDetails: 3600, // 1 hour
};

/**
 * Make API request through rate-limited queue
 */
async function apiRequest(endpoint, params = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const apiKey = process.env.COINGECKO_API_KEY;

  const headers = {};
  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  return requestQueue.enqueue(async () => {
    console.log(`[CoinGecko] Fetching: ${endpoint}`);
    const response = await axios.get(url, { params, headers });
    return response.data;
  });
}

/**
 * Get current prices for multiple coins
 */
export async function getPrices(coinIds) {
  const ids = Array.isArray(coinIds) ? coinIds : [coinIds];
  const cacheKey = cache.generateKey('prices', ids.sort().join(','));

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] prices: ${ids.join(',')}`);
    return { data: cached, fromCache: true };
  }

  console.log(`[Cache MISS] prices: ${ids.join(',')}`);

  // Fetch from API
  const data = await apiRequest('/simple/price', {
    ids: ids.join(','),
    vs_currencies: 'usd',
    include_24hr_change: true,
    include_24hr_vol: true,
    include_market_cap: true,
    include_last_updated_at: true,
  });

  // Cache the result
  await cache.set(cacheKey, data, TTL.prices);

  return { data, fromCache: false };
}

/**
 * Get historical chart data
 */
export async function getChartData(coinId, days) {
  // CoinGecko free tier doesn't support 'max', use 365 instead
  const actualDays = days === 'max' ? 365 : days;
  const numDays = typeof actualDays === 'string' ? parseInt(actualDays) : actualDays;

  const cacheKey = cache.generateKey('chart', coinId, actualDays);

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] chart: ${coinId} ${actualDays}d`);
    return { data: cached, fromCache: true };
  }

  console.log(`[Cache MISS] chart: ${coinId} ${actualDays}d`);

  try {
    // Fetch from API
    const data = await apiRequest(`/coins/${coinId}/market_chart`, {
      vs_currency: 'usd',
      days: actualDays,
      interval: numDays <= 1 ? undefined : 'daily',
    });

    // Determine TTL based on timeframe
    let ttl = TTL.chart_1d;
    if (numDays === 7) ttl = TTL.chart_1w;
    else if (numDays === 30) ttl = TTL.chart_1m;
    else if (numDays >= 365) ttl = TTL.chart_1y;

    // Cache the result
    await cache.set(cacheKey, data, ttl);

    return { data, fromCache: false };
  } catch (error) {
    console.error(`[CoinGecko] Chart error for ${coinId}:`, error.message);
    throw error;
  }
}

/**
 * Get coin details
 */
export async function getCoinDetails(coinId) {
  const cacheKey = cache.generateKey('coin', coinId);

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] coin: ${coinId}`);
    return { data: cached, fromCache: true };
  }

  console.log(`[Cache MISS] coin: ${coinId}`);

  // Fetch from API
  const data = await apiRequest(`/coins/${coinId}`, {
    localization: false,
    tickers: false,
    market_data: true,
    community_data: false,
    developer_data: false,
    sparkline: false,
  });

  // Cache the result
  await cache.set(cacheKey, data, TTL.coinDetails);

  return { data, fromCache: false };
}

/**
 * Get list of all coins (for ID lookups)
 */
export async function getCoinList() {
  const cacheKey = cache.generateKey('coinlist');

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] coin list`);
    return { data: cached, fromCache: true };
  }

  console.log(`[Cache MISS] coin list`);

  // Fetch from API
  const data = await apiRequest('/coins/list', {
    include_platform: true,
  });

  // Cache the result
  await cache.set(cacheKey, data, TTL.coinList);

  return { data, fromCache: false };
}

/**
 * Search for coins by query
 */
export async function searchCoins(query) {
  const cacheKey = cache.generateKey('search', query.toLowerCase());

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] search: ${query}`);
    return { data: cached, fromCache: true };
  }

  console.log(`[Cache MISS] search: ${query}`);

  // Fetch from API
  const data = await apiRequest('/search', { query });

  // Cache the result (shorter TTL for search)
  await cache.set(cacheKey, data, 600); // 10 min

  return { data, fromCache: false };
}

/**
 * Get coins by contract addresses (platform specific)
 */
export async function getCoinsByContract(platform, contractAddresses) {
  const addresses = Array.isArray(contractAddresses)
    ? contractAddresses
    : [contractAddresses];

  const cacheKey = cache.generateKey(
    'contract',
    platform,
    addresses.sort().join(',')
  );

  // Try cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log(`[Cache HIT] contract: ${platform} ${addresses.length} addrs`);
    return { data: cached, fromCache: true };
  }

  console.log(`[Cache MISS] contract: ${platform} ${addresses.length} addrs`);

  // Fetch from API
  const data = await apiRequest(`/simple/token_price/${platform}`, {
    contract_addresses: addresses.join(','),
    vs_currencies: 'usd',
    include_24hr_change: true,
    include_market_cap: true,
  });

  // Cache the result
  await cache.set(cacheKey, data, TTL.prices);

  return { data, fromCache: false };
}
