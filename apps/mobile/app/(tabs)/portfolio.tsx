import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback } from 'react';
import Feather from '@expo/vector-icons/Feather';
import { AllocationChart } from '@/components/portfolio/allocation-chart';
import { HoldingsList } from '@/components/portfolio/holdings-list';
import { usePortfolioMetrics, TokenAllocation } from '@/hooks/use-portfolio-metrics';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { useTokens } from '@/hooks/use-tokens';

export default function PortfolioScreen() {
  const router = useRouter();
  const { walletAddress, isLoading: isWalletLoading } = useWallet();
  const { selectedNetworkId, networkType, isLoading: isNetworkLoading } = useNetwork();
  const { tokens, totalBalanceUsd, isLoading, refreshTokens } = useTokens({
    address: walletAddress,
    networkId: selectedNetworkId,
    networkType,
  });

  const [refreshing, setRefreshing] = useState(false);
  const [highlightedSymbol, setHighlightedSymbol] = useState<string | null>(null);

  const {
    allocations,
    topHolding,
    diversificationScore,
    totalValue,
    change24h,
    bestPerformer,
    worstPerformer,
  } = usePortfolioMetrics({
    tokens,
    totalBalanceUsd,
    groupSmallHoldings: true,
    smallHoldingThreshold: 2,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTokens();
    setRefreshing(false);
  }, [refreshTokens]);

  const handleSegmentPress = useCallback((allocation: TokenAllocation | null) => {
    setHighlightedSymbol(allocation?.token.symbol ?? null);
  }, []);

  const handleHoldingPress = useCallback(
    (allocation: TokenAllocation) => {
      const tokenId = allocation.token.contractAddress ?? 'native';
      router.push(`/asset/${tokenId}:${selectedNetworkId}`);
    },
    [router, selectedNetworkId]
  );

  // Show loading state while contexts initialize
  if (isWalletLoading || isNetworkLoading) {
    return (
      <SafeAreaView className="flex-1 bg-wallet-bg items-center justify-center" edges={['top']}>
        <Text className="text-wallet-text-secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  // Empty state when no wallet
  if (!walletAddress) {
    return (
      <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
        <View className="flex-1 items-center justify-center gap-4 p-5 pb-28">
          <View className="w-16 h-16 rounded-full bg-wallet-card items-center justify-center">
            <Feather name="pie-chart" size={32} color="#B8F25B" />
          </View>
          <Text className="text-xl font-semibold text-wallet-text">Portfolio</Text>
          <Text className="text-wallet-text-secondary text-center">
            Connect a wallet to view your portfolio analytics.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Empty state when no tokens with value
  const hasHoldings = allocations.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#B8F25B" />
        }
      >
        {/* Header */}
        <View className="px-5 pt-4 pb-2">
          <Text className="text-2xl font-bold text-wallet-text">Portfolio</Text>
        </View>

        {isLoading && !hasHoldings ? (
          <View className="flex-1 items-center justify-center py-20">
            <Text className="text-wallet-text-secondary">Loading portfolio...</Text>
          </View>
        ) : !hasHoldings ? (
          <View className="flex-1 items-center justify-center py-20 gap-4">
            <View className="w-16 h-16 rounded-full bg-wallet-card items-center justify-center">
              <Feather name="pie-chart" size={32} color="#5C5C5C" />
            </View>
            <Text className="text-wallet-text-secondary text-center px-10">
              No holdings with USD value found. Add some tokens to see your portfolio breakdown.
            </Text>
          </View>
        ) : (
          <>
            {/* Allocation Chart */}
            <View className="items-center py-6">
              <AllocationChart
                allocations={allocations}
                totalValue={totalValue}
                onSegmentPress={handleSegmentPress}
              />
            </View>

            {/* 24h Performance Card */}
            {totalValue > 0 && (
              <View className="mx-5 mb-4 bg-wallet-card rounded-2xl p-4">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-wallet-text-muted text-sm">24h Performance</Text>
                  <View className="flex-row items-center gap-1.5">
                    <View
                      className={`w-2 h-2 rounded-full ${
                        change24h.isPositive ? 'bg-wallet-positive' : 'bg-wallet-negative'
                      }`}
                    />
                    <Text
                      className={`text-sm font-medium ${
                        change24h.isPositive ? 'text-wallet-positive' : 'text-wallet-negative'
                      }`}
                    >
                      {change24h.isPositive ? '+' : ''}{change24h.percentChange.toFixed(2)}%
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-wallet-text text-2xl font-bold">
                      {change24h.isPositive ? '+' : '-'}${Math.abs(change24h.valueChange).toFixed(2)}
                    </Text>
                  </View>

                  {/* Best & Worst */}
                  <View className="flex-row gap-4">
                    {bestPerformer && bestPerformer.change > 0 && (
                      <View className="items-center">
                        <View className="flex-row items-center gap-1">
                          <Feather name="arrow-up-right" size={12} color="#34C759" />
                          <Text className="text-wallet-positive text-xs font-medium">
                            {bestPerformer.token.symbol}
                          </Text>
                        </View>
                        <Text className="text-wallet-text-muted text-xs">
                          +{bestPerformer.change.toFixed(1)}%
                        </Text>
                      </View>
                    )}
                    {worstPerformer && worstPerformer.change < 0 && (
                      <View className="items-center">
                        <View className="flex-row items-center gap-1">
                          <Feather name="arrow-down-right" size={12} color="#FF3B30" />
                          <Text className="text-wallet-negative text-xs font-medium">
                            {worstPerformer.token.symbol}
                          </Text>
                        </View>
                        <Text className="text-wallet-text-muted text-xs">
                          {worstPerformer.change.toFixed(1)}%
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            )}

            {/* Stats Row */}
            <View className="flex-row mx-5 mb-4 bg-wallet-card rounded-2xl p-4">
              <View className="flex-1 items-center">
                <Text className="text-wallet-text-muted text-xs mb-1">Top Holding</Text>
                <Text className="text-wallet-text font-semibold text-base">
                  {topHolding?.symbol ?? '-'}
                </Text>
              </View>
              <View className="w-px bg-wallet-card-light" />
              <View className="flex-1 items-center">
                <Text className="text-wallet-text-muted text-xs mb-1">Assets</Text>
                <Text className="text-wallet-text font-semibold text-base">{tokens.filter(t => t.balanceUsd && t.balanceUsd > 0).length}</Text>
              </View>
              <View className="w-px bg-wallet-card-light" />
              <View className="flex-1 items-center">
                <Text className="text-wallet-text-muted text-xs mb-1">Diversity</Text>
                <View className="flex-row items-center gap-1">
                  <Text className="text-wallet-text font-semibold text-base">
                    {diversificationScore}
                  </Text>
                  <Text className="text-wallet-text-muted text-xs">/100</Text>
                </View>
              </View>
            </View>

            {/* Holdings List */}
            <View className="bg-wallet-card rounded-t-3xl flex-1 min-h-[300px]">
              <View className="flex-row items-center justify-between px-5 pt-6 pb-2">
                <Text className="text-lg font-semibold text-wallet-text">Holdings</Text>
                <Text className="text-wallet-text-muted text-sm">
                  {allocations.length} {allocations.length === 1 ? 'asset' : 'assets'}
                </Text>
              </View>

              <View className="px-4">
                <HoldingsList
                  allocations={allocations}
                  onHoldingPress={handleHoldingPress}
                  highlightedSymbol={highlightedSymbol}
                />
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
