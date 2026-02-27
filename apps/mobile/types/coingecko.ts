// CoinGecko API types

export type ChartTimeframe = '1D' | '1W' | '1M' | '1Y' | 'ALL';

export interface ChartDataPoint {
  timestamp: number;
  price: number;
}

export interface TokenPriceData {
  coinGeckoId: string;
  priceUsd: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

export interface CoinGeckoPriceResponse {
  [id: string]: {
    usd: number;
    usd_24h_change?: number;
    usd_24h_vol?: number;
    usd_market_cap?: number;
  };
}

export interface CoinGeckoMarketChartResponse {
  prices: [number, number][];
  market_caps: [number, number][];
  total_volumes: [number, number][];
}

export interface ChartData {
  data: ChartDataPoint[];
  minPrice: number;
  maxPrice: number;
  priceChange: number;
  priceChangePercent: number;
}
