// CoinGecko chart data service via cache server
import { fetchChartData } from './cache-client';
import type { ChartTimeframe, ChartData, ChartDataPoint } from '@/types/coingecko';

// API days parameter by timeframe
// Note: CoinGecko free tier doesn't support 'max', using 365 for ALL
const DAYS_BY_TIMEFRAME: Record<ChartTimeframe, number> = {
  '1D': 1,
  '1W': 7,
  '1M': 30,
  '1Y': 365,
  ALL: 365, // Free tier limit
};

/**
 * Process raw API response into ChartData
 */
function processChartData(prices: { timestamp: number; price: number }[]): ChartData {
  const dataPoints: ChartDataPoint[] = prices.map(({ timestamp, price }) => ({
    timestamp,
    price,
  }));

  if (dataPoints.length === 0) {
    return {
      data: [],
      minPrice: 0,
      maxPrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
    };
  }

  const priceValues = dataPoints.map((d) => d.price);
  const minPrice = Math.min(...priceValues);
  const maxPrice = Math.max(...priceValues);

  const firstPrice = dataPoints[0].price;
  const lastPrice = dataPoints[dataPoints.length - 1].price;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0;

  return {
    data: dataPoints,
    minPrice,
    maxPrice,
    priceChange,
    priceChangePercent,
  };
}

/**
 * Fetch chart data for a token via cache server
 */
export async function getChartData(
  coinGeckoId: string,
  timeframe: ChartTimeframe
): Promise<ChartData> {
  try {
    const days = DAYS_BY_TIMEFRAME[timeframe];
    const response = await fetchChartData(coinGeckoId, days);

    return processChartData(response.prices);
  } catch (error) {
    console.error('Error fetching chart data:', error);
    // Return empty data on error
    return {
      data: [],
      minPrice: 0,
      maxPrice: 0,
      priceChange: 0,
      priceChangePercent: 0,
    };
  }
}
