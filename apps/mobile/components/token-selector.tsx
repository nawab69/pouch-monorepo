import { View, Text, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

interface TokenSelectorProps {
  symbol: string;
  color: string;
  onPress?: () => void;
}

export function TokenSelector({ symbol, color, onPress }: TokenSelectorProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 bg-wallet-card-light px-3 py-2 rounded-full"
    >
      <View
        className="w-6 h-6 rounded-full items-center justify-center"
        style={{ backgroundColor: color }}
      >
        <Text className="text-white font-bold text-xs">
          {symbol.charAt(0)}
        </Text>
      </View>
      <Text className="text-wallet-text font-medium">{symbol}</Text>
      <Feather name="chevron-down" size={16} color="#8B9A92" />
    </Pressable>
  );
}
