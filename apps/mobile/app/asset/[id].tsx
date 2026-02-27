import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import { useState, useMemo } from 'react';
import { ChartTimeframe } from '@/types/coingecko';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { useTokens } from '@/hooks/use-tokens';
import { useTokenPrice } from '@/hooks/use-token-price';
import { useChartData } from '@/hooks/use-chart-data';
import { useTokenTransactions } from '@/hooks/use-token-transactions';
import { PriceChart } from '@/components/price-chart';
import { formatAddress } from '@/services/blockchain';
import { NETWORKS } from '@/constants/networks';

type TabType = 'holdings' | 'history' | 'about';
const TIMEFRAMES: ChartTimeframe[] = ['1D', '1W', '1M', '1Y', 'ALL'];

export default function AssetDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { walletAddress } = useWallet();
  const { selectedNetworkId, networkType } = useNetwork();
  const { getToken, isLoading: isTokensLoading } = useTokens({
    address: walletAddress,
    networkId: selectedNetworkId,
    networkType,
  });

  const [timeframe, setTimeframe] = useState<ChartTimeframe>('1W');
  const [activeTab, setActiveTab] = useState<TabType>('holdings');

  // Parse the route param
  const { contractAddress, networkId } = useMemo(() => {
    if (!id) return { contractAddress: null, networkId: selectedNetworkId };
    const parts = id.split(':');
    if (parts.length === 2) {
      const [addr, network] = parts;
      return {
        contractAddress: addr === 'native' ? null : addr,
        networkId: network as typeof selectedNetworkId,
      };
    }
    return {
      contractAddress: id === 'native' ? null : id,
      networkId: selectedNetworkId,
    };
  }, [id, selectedNetworkId]);

  const token = useMemo(() => getToken(contractAddress), [contractAddress, getToken]);
  const network = NETWORKS[networkId];

  const {
    priceUsd,
    change24h,
    coinGeckoId,
    isLoading: isPriceLoading,
  } = useTokenPrice({ token: token ?? null, networkId });

  const {
    data: chartData,
    minPrice,
    maxPrice,
    priceChangePercent,
    isLoading: isChartLoading,
  } = useChartData({ coinGeckoId, timeframe });

  const { transactions, isLoading: isTransactionsLoading } = useTokenTransactions({
    address: walletAddress,
    token: token ?? null,
    networkId,
    networkType,
    limit: 10,
  });

  const isPositive = (priceChangePercent ?? change24h ?? 0) >= 0;
  const displayChange = priceChangePercent ?? change24h ?? 0;

  const balanceUsd = useMemo(() => {
    if (!token || priceUsd === null) return null;
    return parseFloat(token.balanceFormatted) * priceUsd;
  }, [token, priceUsd]);

  const formatPrice = (price: number): string => {
    if (price >= 1000) return price.toLocaleString('en-US', { maximumFractionDigits: 2 });
    if (price >= 1) return price.toFixed(2);
    if (price >= 0.01) return price.toFixed(4);
    return price.toFixed(6);
  };

  const formatUsd = (value: number): { whole: string; decimal: string } => {
    const [whole, decimal] = value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).split('.');
    return { whole: `$${whole}`, decimal: `.${decimal}` };
  };

  if (!token) {
    return (
      <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
        <View className="flex-row items-center px-5 py-4">
          <Pressable onPress={() => router.back()} className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center">
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center">
          {isTokensLoading ? (
            <ActivityIndicator size="large" color="#B8F25B" />
          ) : (
            <Text className="text-wallet-text-secondary">Token not found</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>
        <View className="flex-row gap-2">
          <Pressable className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center">
            <Feather name="bell" size={18} color="#FFFFFF" />
          </Pressable>
          <Pressable className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center">
            <Feather name="star" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Price Card */}
        <View className="mx-5 mt-2 bg-wallet-card rounded-2xl p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
                style={{ backgroundColor: token.logoUrl ? '#1C1C1E' : '#627EEA' }}
              >
                {token.logoUrl ? (
                  <Image source={{ uri: token.logoUrl }} style={{ width: 32, height: 32 }} contentFit="contain" />
                ) : (
                  <Text className="text-white font-bold text-lg">{token.symbol.charAt(0)}</Text>
                )}
              </View>
              <View>
                <Text className="text-wallet-text-secondary text-sm">{token.name}</Text>
                {isPriceLoading ? (
                  <ActivityIndicator size="small" color="#8E8E93" />
                ) : priceUsd !== null ? (
                  <Text className="text-2xl font-bold text-wallet-text">{formatPrice(priceUsd)}</Text>
                ) : (
                  <Text className="text-2xl font-bold text-wallet-text">--</Text>
                )}
              </View>
            </View>
            <View className="items-end">
              <View className={`flex-row items-center gap-1 px-2 py-1 rounded-full ${isPositive ? 'bg-wallet-positive/20' : 'bg-wallet-negative/20'}`}>
                <Feather name={isPositive ? 'arrow-up-right' : 'arrow-down-right'} size={14} color={isPositive ? '#34C759' : '#FF3B30'} />
                <Text className={`text-sm font-medium ${isPositive ? 'text-wallet-positive' : 'text-wallet-negative'}`}>
                  {Math.abs(displayChange).toFixed(2)}%
                </Text>
              </View>
              <Text className="text-wallet-text-muted text-xs mt-1">({timeframe})</Text>
            </View>
          </View>
        </View>

        {/* Chart Card */}
        <View className="mx-5 mt-4 bg-wallet-card rounded-2xl p-4">
          {isChartLoading ? (
            <View className="h-[180px] items-center justify-center">
              <ActivityIndicator size="small" color="#8E8E93" />
            </View>
          ) : (
            <View className="flex-row">
              <View className="flex-1">
                <PriceChart
                  data={chartData}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  isPositive={isPositive}
                />
              </View>
              {/* Price Axis */}
              <View className="w-16 justify-between py-2 pl-2">
                <Text className="text-wallet-text-muted text-xs text-right">{formatPrice(maxPrice)}</Text>
                <Text className="text-wallet-text-muted text-xs text-right">{formatPrice((maxPrice + minPrice) / 2)}</Text>
                <Text className="text-wallet-text-muted text-xs text-right">{formatPrice(minPrice)}</Text>
              </View>
            </View>
          )}

          {/* Timeframe Selector */}
          <View className="flex-row justify-between mt-4 px-2">
            {TIMEFRAMES.map((tf) => (
              <Pressable
                key={tf}
                onPress={() => setTimeframe(tf)}
                className={`px-4 py-2 rounded-lg ${timeframe === tf ? 'bg-wallet-accent' : ''}`}
              >
                <Text className={`text-sm font-medium ${timeframe === tf ? 'text-black' : 'text-wallet-text-secondary'}`}>
                  {tf}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row items-center justify-between mx-5 mt-6 mb-2">
          <View className="flex-row gap-6">
            {(['holdings', 'history', 'about'] as TabType[]).map((tab) => (
              <Pressable key={tab} onPress={() => setActiveTab(tab)}>
                <Text className={`text-base capitalize ${activeTab === tab ? 'text-wallet-text font-semibold' : 'text-wallet-text-muted'}`}>
                  {tab}
                </Text>
                {activeTab === tab && <View className="h-0.5 bg-wallet-accent mt-1 rounded-full" />}
              </Pressable>
            ))}
          </View>
          <Pressable>
            <Feather name="search" size={20} color="#5C6660" />
          </Pressable>
        </View>

        {/* Tab Content */}
        {activeTab === 'holdings' && (
          <View className="px-5 mt-2">
            <Text className="text-wallet-text font-semibold text-base mb-3">My balance</Text>
            <View className="bg-wallet-card rounded-2xl p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-3">
                  <View
                    className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
                    style={{ backgroundColor: token.logoUrl ? '#1C1C1E' : '#627EEA' }}
                  >
                    {token.logoUrl ? (
                      <Image source={{ uri: token.logoUrl }} style={{ width: 32, height: 32 }} contentFit="contain" />
                    ) : (
                      <Text className="text-white font-bold text-lg">{token.symbol.charAt(0)}</Text>
                    )}
                  </View>
                  <View>
                    <Text className="text-wallet-text font-medium">{token.name}</Text>
                    <Text className="text-wallet-text-muted text-sm">
                      {parseFloat(token.balanceFormatted).toFixed(5)} {token.symbol}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  {balanceUsd !== null ? (
                    <>
                      <Text className="text-wallet-text font-semibold">
                        {formatUsd(balanceUsd).whole}
                        <Text className="text-wallet-text-muted">{formatUsd(balanceUsd).decimal}</Text>
                      </Text>
                      <View className="flex-row items-center gap-1">
                        <Feather name={isPositive ? 'arrow-up' : 'arrow-down'} size={12} color={isPositive ? '#34C759' : '#FF3B30'} />
                        <Text className={`text-sm ${isPositive ? 'text-wallet-positive' : 'text-wallet-negative'}`}>
                          {Math.abs(change24h ?? 0).toFixed(2)}%
                        </Text>
                      </View>
                    </>
                  ) : (
                    <Text className="text-wallet-text-muted">--</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'history' && (
          <View className="px-5 mt-2">
            {isTransactionsLoading ? (
              <View className="py-8 items-center">
                <ActivityIndicator size="small" color="#8E8E93" />
              </View>
            ) : transactions.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-wallet-text-muted">No transactions yet</Text>
              </View>
            ) : (
              <View className="gap-3">
                {transactions.map((tx) => {
                  const isSend = tx.type === 'send';
                  const isSwap = tx.type === 'swap';

                  if (isSwap && tx.swapDetails) {
                    // Swap transaction
                    return (
                      <View key={tx.hash} className="bg-wallet-card rounded-2xl p-4 flex-row items-center justify-between">
                        <View className="flex-row items-center gap-3">
                          <View className="w-10 h-10 rounded-full items-center justify-center bg-wallet-accent/20">
                            <Feather name="repeat" size={18} color="#B8F25B" />
                          </View>
                          <View>
                            <Text className="text-wallet-text font-medium">Swapped</Text>
                            <Text className="text-wallet-text-muted text-xs">
                              {tx.swapDetails.sellToken.symbol} → {tx.swapDetails.buyToken.symbol}
                            </Text>
                          </View>
                        </View>
                        <View className="items-end">
                          <Text className="text-wallet-negative font-medium">
                            -{parseFloat(tx.swapDetails.sellAmount).toFixed(4)} {tx.swapDetails.sellToken.symbol}
                          </Text>
                          <Text className="text-wallet-positive text-sm">
                            +{parseFloat(tx.swapDetails.buyAmount).toFixed(4)} {tx.swapDetails.buyToken.symbol}
                          </Text>
                        </View>
                      </View>
                    );
                  }

                  // Send/Receive transaction
                  return (
                    <View key={tx.hash} className="bg-wallet-card rounded-2xl p-4 flex-row items-center justify-between">
                      <View className="flex-row items-center gap-3">
                        <View className={`w-10 h-10 rounded-full items-center justify-center ${isSend ? 'bg-wallet-negative/20' : 'bg-wallet-positive/20'}`}>
                          <Feather name={isSend ? 'arrow-up-right' : 'arrow-down-left'} size={18} color={isSend ? '#FF3B30' : '#34C759'} />
                        </View>
                        <View>
                          <Text className="text-wallet-text font-medium">{isSend ? 'Sent' : 'Received'}</Text>
                          <Text className="text-wallet-text-muted text-xs">{formatAddress(isSend ? tx.to : tx.from, 6, 4)}</Text>
                        </View>
                      </View>
                      <Text className={`font-medium ${isSend ? 'text-wallet-negative' : 'text-wallet-positive'}`}>
                        {isSend ? '-' : '+'}{parseFloat(tx.valueFormatted).toFixed(4)} {tx.token?.symbol ?? token.symbol}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'about' && (
          <View className="px-5 mt-2">
            <View className="bg-wallet-card rounded-2xl p-4 gap-4">
              <View className="flex-row justify-between">
                <Text className="text-wallet-text-secondary">Name</Text>
                <Text className="text-wallet-text font-medium">{token.name}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-wallet-text-secondary">Symbol</Text>
                <Text className="text-wallet-text font-medium">{token.symbol}</Text>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-wallet-text-secondary">Network</Text>
                <View className="flex-row items-center gap-2">
                  <View className="w-2 h-2 rounded-full" style={{ backgroundColor: network?.color ?? '#627EEA' }} />
                  <Text className="text-wallet-text font-medium">{network?.name}</Text>
                </View>
              </View>
              <View className="flex-row justify-between">
                <Text className="text-wallet-text-secondary">Decimals</Text>
                <Text className="text-wallet-text font-medium">{token.decimals}</Text>
              </View>
              {!token.isNative && token.contractAddress && (
                <View className="flex-row justify-between items-center">
                  <Text className="text-wallet-text-secondary">Contract</Text>
                  <Text className="text-wallet-accent font-medium">{formatAddress(token.contractAddress, 8, 6)}</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View className="absolute bottom-0 left-0 right-0 bg-wallet-card border-t border-wallet-card-light px-5 py-4 pb-8">
        <View className="flex-row items-center gap-3">
          <Pressable className="w-12 h-12 rounded-full bg-wallet-card-light items-center justify-center">
            <Feather name="refresh-cw" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: '/send', params: { tokenAddress: contractAddress ?? 'native' } })}
            className="flex-1 bg-wallet-card-light py-4 rounded-full flex-row items-center justify-center gap-2"
          >
            <Feather name="arrow-up" size={18} color="#FFFFFF" />
            <Text className="text-wallet-text font-semibold">Send</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push('/receive')}
            className="flex-1 bg-wallet-accent py-4 rounded-full flex-row items-center justify-center gap-2"
          >
            <Feather name="arrow-down" size={18} color="#000" />
            <Text className="text-black font-semibold">Receive</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
