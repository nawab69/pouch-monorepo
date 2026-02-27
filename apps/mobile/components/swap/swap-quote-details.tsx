import { View, Text, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import { SwapQuote, getPriceImpactLevel } from '@/services/swap/swap-types';
import { formatSwapPrice, getMajorSource } from '@/services/swap';
import { NETWORKS } from '@/constants/networks';
import { NetworkId } from '@/types/blockchain';

interface SwapQuoteDetailsProps {
  quote: SwapQuote;
  slippage: number;
  networkId: NetworkId;
  isStale?: boolean;
  onRefresh?: () => void;
}

export function SwapQuoteDetails({
  quote,
  slippage,
  networkId,
  isStale = false,
  onRefresh,
}: SwapQuoteDetailsProps) {
  const priceImpact = parseFloat(quote.priceImpact) || 0;
  const priceImpactLevel = getPriceImpactLevel(priceImpact);

  const priceImpactColor = {
    low: 'text-wallet-text-secondary',
    medium: 'text-yellow-500',
    high: 'text-wallet-negative',
  }[priceImpactLevel];

  const network = NETWORKS[networkId];
  const majorSource = getMajorSource(quote);

  return (
    <View className="bg-wallet-card rounded-2xl p-4">
      {/* Stale warning */}
      {isStale && (
        <Pressable
          onPress={onRefresh}
          className="flex-row items-center justify-center gap-2 bg-wallet-card-light rounded-xl p-3 mb-4"
        >
          <Feather name="alert-circle" size={16} color="#F7931A" />
          <Text className="text-[#F7931A] text-sm">
            Quote expired. Tap to refresh.
          </Text>
        </Pressable>
      )}

      {/* Rate */}
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-wallet-text-secondary text-sm">Rate</Text>
        <Text className="text-wallet-text text-sm font-medium">
          {formatSwapPrice(quote)}
        </Text>
      </View>

      {/* Price Impact */}
      <View className="flex-row items-center justify-between py-2">
        <View className="flex-row items-center gap-1">
          <Text className="text-wallet-text-secondary text-sm">Price Impact</Text>
          {priceImpactLevel !== 'low' && (
            <Feather
              name="alert-triangle"
              size={12}
              color={priceImpactLevel === 'high' ? '#FF3B30' : '#F7931A'}
            />
          )}
        </View>
        <Text className={`text-sm font-medium ${priceImpactColor}`}>
          {priceImpact.toFixed(2)}%
        </Text>
      </View>

      {/* Min Received */}
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-wallet-text-secondary text-sm">Min. Received</Text>
        <Text className="text-wallet-text text-sm font-medium">
          {parseFloat(quote.minBuyAmount).toFixed(6)} {quote.buyToken.symbol}
        </Text>
      </View>

      {/* Slippage */}
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-wallet-text-secondary text-sm">Slippage</Text>
        <Text className="text-wallet-text text-sm font-medium">
          {slippage}%
        </Text>
      </View>

      {/* Route / Source */}
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-wallet-text-secondary text-sm">Route</Text>
        <Text className="text-wallet-text text-sm font-medium">
          {majorSource}
        </Text>
      </View>

      {/* Network Fee */}
      {quote.estimatedGasUsd !== null && (
        <View className="flex-row items-center justify-between py-2">
          <Text className="text-wallet-text-secondary text-sm">Network Fee</Text>
          <Text className="text-wallet-text text-sm font-medium">
            ~${quote.estimatedGasUsd.toFixed(2)}
          </Text>
        </View>
      )}

      {/* Network */}
      <View className="flex-row items-center justify-between py-2">
        <Text className="text-wallet-text-secondary text-sm">Network</Text>
        <View className="flex-row items-center gap-2">
          <View
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: network.color }}
          />
          <Text className="text-wallet-text text-sm font-medium">
            {network.name}
          </Text>
        </View>
      </View>

      {/* High price impact warning */}
      {priceImpactLevel === 'high' && (
        <View className="bg-wallet-negative/10 rounded-xl p-3 mt-3 flex-row items-start gap-2">
          <Feather name="alert-triangle" size={16} color="#FF3B30" />
          <View className="flex-1">
            <Text className="text-wallet-negative font-medium text-sm">
              High Price Impact
            </Text>
            <Text className="text-wallet-text-secondary text-xs mt-1">
              This swap has a price impact of {priceImpact.toFixed(2)}%. You may receive significantly less than expected.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
