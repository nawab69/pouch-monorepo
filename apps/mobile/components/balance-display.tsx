import { View, Text } from 'react-native';

interface BalanceDisplayProps {
  balance: number;
  percentageChange: number;
  timeframe?: string;
  isUsd?: boolean;
}

export function BalanceDisplay({
  balance,
  percentageChange,
  timeframe = '1d',
  isUsd: _isUsd = true,
}: BalanceDisplayProps) {
  const isPositive = percentageChange >= 0;
  const formattedBalance = balance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const [dollars, cents] = formattedBalance.split('.');

  return (
    <View className="items-center py-8">
      <Text className="text-base text-wallet-text-secondary">Current balance</Text>
      <View className="flex-row items-baseline mt-3">
        <Text className="text-5xl font-extralight text-wallet-text">${dollars}</Text>
        <Text className="text-5xl font-extralight text-wallet-text-secondary">.{cents}</Text>
      </View>
      <View className="flex-row items-center gap-1.5 mt-4">
        <Text className={`text-sm ${isPositive ? 'text-wallet-positive' : 'text-wallet-negative'}`}>
          {isPositive ? '▲' : '▼'}
        </Text>
        <Text
          className={`text-sm ${isPositive ? 'text-wallet-positive' : 'text-wallet-negative'}`}
        >
          {Math.abs(percentageChange).toFixed(2)}%
        </Text>
        <Text className="text-sm text-wallet-text-muted">({timeframe})</Text>
      </View>
    </View>
  );
}
