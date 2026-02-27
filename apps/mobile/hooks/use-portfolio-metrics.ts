import { useMemo } from 'react';
import { Token } from '@/types/blockchain';
import { getTokenColor, OTHER_COLOR } from '@/constants/token-colors';

export interface TokenAllocation {
  token: Token;
  percentage: number;
  color: string;
  usdValue: number;
}

export interface PortfolioMetrics {
  allocations: TokenAllocation[];
  topHolding: Token | null;
  diversificationScore: number; // 0-100
  totalValue: number;
  change24h: {
    valueChange: number; // Dollar amount change
    percentChange: number; // Percentage change
    isPositive: boolean;
  };
  bestPerformer: { token: Token; change: number } | null;
  worstPerformer: { token: Token; change: number } | null;
}

interface UsePortfolioMetricsOptions {
  tokens: Token[];
  totalBalanceUsd: number;
  groupSmallHoldings?: boolean;
  smallHoldingThreshold?: number; // Percentage threshold for grouping
}

export function usePortfolioMetrics({
  tokens,
  totalBalanceUsd,
  groupSmallHoldings = true,
  smallHoldingThreshold = 2, // Group holdings under 2%
}: UsePortfolioMetricsOptions): PortfolioMetrics {
  return useMemo(() => {
    const emptyChange = { valueChange: 0, percentChange: 0, isPositive: true };

    if (totalBalanceUsd === 0 || tokens.length === 0) {
      return {
        allocations: [],
        topHolding: null,
        diversificationScore: 0,
        totalValue: 0,
        change24h: emptyChange,
        bestPerformer: null,
        worstPerformer: null,
      };
    }

    // Calculate allocations for all tokens with USD value
    const rawAllocations: TokenAllocation[] = tokens
      .filter((token) => token.balanceUsd && token.balanceUsd > 0)
      .map((token) => ({
        token,
        percentage: ((token.balanceUsd ?? 0) / totalBalanceUsd) * 100,
        color: getTokenColor(token.symbol),
        usdValue: token.balanceUsd ?? 0,
      }))
      .sort((a, b) => b.percentage - a.percentage);

    let allocations = rawAllocations;

    // Group small holdings into "Other" category if enabled
    if (groupSmallHoldings && rawAllocations.length > 5) {
      const significantAllocations: TokenAllocation[] = [];
      let otherPercentage = 0;
      let otherValue = 0;

      for (const allocation of rawAllocations) {
        if (allocation.percentage >= smallHoldingThreshold) {
          significantAllocations.push(allocation);
        } else {
          otherPercentage += allocation.percentage;
          otherValue += allocation.usdValue;
        }
      }

      // Add "Other" category if there are grouped holdings
      if (otherPercentage > 0) {
        const otherToken: Token = {
          contractAddress: 'other',
          symbol: 'OTHER',
          name: 'Other',
          decimals: 0,
          balance: '0',
          balanceFormatted: '0',
          balanceUsd: otherValue,
          isNative: false,
        };

        significantAllocations.push({
          token: otherToken,
          percentage: otherPercentage,
          color: OTHER_COLOR,
          usdValue: otherValue,
        });
      }

      allocations = significantAllocations;
    }

    // Find top holding
    const topHolding = rawAllocations.length > 0 ? rawAllocations[0].token : null;

    // Calculate diversification score (Herfindahl-Hirschman Index inverted)
    // Score of 100 = perfectly diversified, 0 = all in one asset
    const hhi = rawAllocations.reduce((sum, a) => sum + Math.pow(a.percentage / 100, 2), 0);
    // Normalize HHI to 0-100 scale (HHI of 1 = concentrated, HHI of 1/n = diversified)
    const n = rawAllocations.length;
    const minHHI = n > 0 ? 1 / n : 1;
    const diversificationScore = n > 1
      ? Math.round(((1 - hhi) / (1 - minHHI)) * 100)
      : 0;

    // Calculate 24h portfolio change (weighted by USD value)
    // Formula: sum of (token_value * token_change%) / total_value
    let totalValueChange = 0;
    let bestPerformer: { token: Token; change: number } | null = null;
    let worstPerformer: { token: Token; change: number } | null = null;

    for (const token of tokens) {
      if (token.balanceUsd && token.balanceUsd > 0 && token.change24h !== undefined) {
        // Calculate how much this token contributed to the change
        // If token is up 5% and worth $100, it contributed $5 to the change
        // But we need value from 24h ago: currentValue / (1 + change/100)
        const previousValue = token.balanceUsd / (1 + token.change24h / 100);
        const valueChange = token.balanceUsd - previousValue;
        totalValueChange += valueChange;

        // Track best/worst performers
        if (bestPerformer === null || token.change24h > bestPerformer.change) {
          bestPerformer = { token, change: token.change24h };
        }
        if (worstPerformer === null || token.change24h < worstPerformer.change) {
          worstPerformer = { token, change: token.change24h };
        }
      }
    }

    // Calculate percentage change
    const previousTotalValue = totalBalanceUsd - totalValueChange;
    const percentChange = previousTotalValue > 0
      ? (totalValueChange / previousTotalValue) * 100
      : 0;

    const change24h = {
      valueChange: totalValueChange,
      percentChange,
      isPositive: totalValueChange >= 0,
    };

    return {
      allocations,
      topHolding,
      diversificationScore: Math.max(0, Math.min(100, diversificationScore)),
      totalValue: totalBalanceUsd,
      change24h,
      bestPerformer,
      worstPerformer,
    };
  }, [tokens, totalBalanceUsd, groupSmallHoldings, smallHoldingThreshold]);
}
