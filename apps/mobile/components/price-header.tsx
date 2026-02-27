import { View, Text, ActivityIndicator } from 'react-native';

interface PriceHeaderProps {
  priceUsd: number | null;
  change24h: number | null;
  isLoading?: boolean;
}

export function PriceHeader({
  priceUsd,
  change24h,
  isLoading = false,
}: PriceHeaderProps) {
  const formatPrice = (price: number): string => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else if (price >= 0.01) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const isPositive = (change24h ?? 0) >= 0;
  const changeColor = isPositive ? 'text-wallet-positive' : 'text-wallet-negative';
  const arrow = isPositive ? '▲' : '▼';

  if (isLoading) {
    return (
      <View className="items-center py-4">
        <ActivityIndicator size="small" color="#8E8E93" />
      </View>
    );
  }

  if (priceUsd === null) {
    return (
      <View className="items-center py-4">
        <Text className="text-wallet-text-secondary text-lg">
          Price unavailable
        </Text>
      </View>
    );
  }

  return (
    <View className="items-center py-2">
      <Text className="text-wallet-text text-3xl font-bold">
        {formatPrice(priceUsd)}
      </Text>
      {change24h !== null && (
        <View className="flex-row items-center gap-1 mt-1">
          <Text className={`text-sm ${changeColor}`}>{arrow}</Text>
          <Text className={`text-base ${changeColor}`}>
            {Math.abs(change24h).toFixed(2)}%
          </Text>
          <Text className="text-wallet-text-secondary text-base ml-1">
            24h
          </Text>
        </View>
      )}
    </View>
  );
}
