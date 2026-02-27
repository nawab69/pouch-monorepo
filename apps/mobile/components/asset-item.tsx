import { View, Text, Pressable } from 'react-native';
import { Image } from 'expo-image';

interface AssetItemProps {
  name: string;
  symbol: string;
  amount: string;
  price: string;
  percentageChange: number;
  color: string;
  logoUrl?: string;
  onPress?: () => void;
  showDivider?: boolean;
}

export function AssetItem({
  name,
  symbol,
  amount,
  price,
  percentageChange,
  color,
  logoUrl,
  onPress,
  showDivider = false,
}: AssetItemProps) {
  const isPositive = percentageChange >= 0;

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center justify-between py-4 ${
        showDivider ? 'border-b border-wallet-card-light' : ''
      }`}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="w-12 h-12 rounded-full items-center justify-center overflow-hidden"
          style={{ backgroundColor: logoUrl ? '#1C1C1E' : color }}
        >
          {logoUrl ? (
            <Image
              source={{ uri: logoUrl }}
              style={{ width: 32, height: 32 }}
              contentFit="contain"
            />
          ) : (
            <Text className="text-white font-bold text-base">
              {symbol.charAt(0)}
            </Text>
          )}
        </View>
        <View className="gap-0.5">
          <Text className="text-wallet-text font-semibold text-base">{name}</Text>
          <View className="flex-row items-center gap-1">
            <Text className="text-wallet-text-muted text-sm">{symbol}</Text>
            <Text className="text-wallet-text-muted text-sm">•</Text>
            <Text className="text-wallet-text-muted text-sm">{price}</Text>
          </View>
        </View>
      </View>

      <View className="items-end gap-0.5">
        <Text className="text-wallet-text font-light text-base">{amount}</Text>
        <View className="flex-row items-center gap-1">
          <Text className={`text-xs ${isPositive ? 'text-wallet-positive' : 'text-wallet-negative'}`}>
            {isPositive ? '▲' : '▼'}
          </Text>
          <Text
            className={`text-sm ${isPositive ? 'text-wallet-positive' : 'text-wallet-negative'}`}
          >
            {Math.abs(percentageChange).toFixed(2)}%
          </Text>
        </View>
      </View>
    </Pressable>
  );
}
