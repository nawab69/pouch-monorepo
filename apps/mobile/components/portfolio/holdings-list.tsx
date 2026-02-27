import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { TokenAllocation } from '@/hooks/use-portfolio-metrics';

interface HoldingsListProps {
  allocations: TokenAllocation[];
  onHoldingPress?: (allocation: TokenAllocation) => void;
  highlightedSymbol?: string | null;
}

export function HoldingsList({
  allocations,
  onHoldingPress,
  highlightedSymbol,
}: HoldingsListProps) {
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatAmount = (amount: string, symbol: string): string => {
    const num = parseFloat(amount);
    if (num === 0) return '0';
    if (num < 0.0001) return `<0.0001 ${symbol}`;
    if (num < 1) return `${num.toFixed(4)} ${symbol}`;
    if (num < 1000) return `${num.toFixed(2)} ${symbol}`;
    return `${num.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${symbol}`;
  };

  if (allocations.length === 0) {
    return (
      <View className="py-8 items-center">
        <Text className="text-wallet-text-secondary">No holdings to display</Text>
      </View>
    );
  }

  return (
    <View className="gap-1">
      {allocations.map((allocation, index) => {
        const isOther = allocation.token.symbol === 'OTHER';
        const isHighlighted = highlightedSymbol === allocation.token.symbol;

        return (
          <Pressable
            key={allocation.token.contractAddress ?? `other-${index}`}
            onPress={() => !isOther && onHoldingPress?.(allocation)}
            disabled={isOther}
            className={`flex-row items-center py-3 px-1 rounded-xl ${
              isHighlighted ? 'bg-wallet-card-light' : ''
            }`}
          >
            {/* Token icon */}
            <View
              className="w-10 h-10 rounded-full items-center justify-center overflow-hidden mr-3"
              style={{ backgroundColor: isOther ? allocation.color : '#1C1C1E' }}
            >
              {!isOther && allocation.token.logoUrl ? (
                <Image
                  source={{ uri: allocation.token.logoUrl }}
                  style={{ width: 28, height: 28 }}
                  contentFit="contain"
                />
              ) : (
                <Text className="text-white font-bold text-sm">
                  {allocation.token.symbol.charAt(0)}
                </Text>
              )}
            </View>

            {/* Token info */}
            <View className="flex-1">
              <Text className="text-wallet-text font-medium text-base">
                {isOther ? 'Other' : allocation.token.name}
              </Text>
              <Text className="text-wallet-text-muted text-sm">
                {isOther
                  ? 'Small holdings'
                  : formatAmount(allocation.token.balanceFormatted, allocation.token.symbol)}
              </Text>
            </View>

            {/* Value and percentage */}
            <View className="items-end">
              <Text className="text-wallet-text font-medium text-base">
                {formatCurrency(allocation.usdValue)}
              </Text>
              <View className="flex-row items-center gap-2">
                {/* Percentage bar */}
                <View className="w-12 h-1.5 bg-wallet-card-light rounded-full overflow-hidden">
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(allocation.percentage, 100)}%`,
                      backgroundColor: allocation.color,
                    }}
                  />
                </View>
                <Text className="text-wallet-text-muted text-sm w-12 text-right">
                  {allocation.percentage.toFixed(1)}%
                </Text>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
