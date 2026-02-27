import { useState, useEffect, useCallback } from 'react';
import { ChartTimeframe, ChartData, ChartDataPoint } from '@/types/coingecko';
import { getChartData } from '@/services/coingecko';

interface UseChartDataOptions {
  coinGeckoId: string | null;
  timeframe: ChartTimeframe;
}

interface UseChartDataResult {
  data: ChartDataPoint[];
  minPrice: number;
  maxPrice: number;
  priceChange: number;
  priceChangePercent: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useChartData({
  coinGeckoId,
  timeframe,
}: UseChartDataOptions): UseChartDataResult {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!coinGeckoId) {
      setChartData(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await getChartData(coinGeckoId, timeframe);
      setChartData(data);
    } catch (err) {
      console.error('Error fetching chart data:', err);
      setError('Failed to fetch chart data');
    } finally {
      setIsLoading(false);
    }
  }, [coinGeckoId, timeframe]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data: chartData?.data ?? [],
    minPrice: chartData?.minPrice ?? 0,
    maxPrice: chartData?.maxPrice ?? 0,
    priceChange: chartData?.priceChange ?? 0,
    priceChangePercent: chartData?.priceChangePercent ?? 0,
    isLoading,
    error,
    refetch: fetchData,
  };
}
