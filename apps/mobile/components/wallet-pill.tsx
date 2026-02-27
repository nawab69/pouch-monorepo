import { View, Text, Pressable } from 'react-native';

interface WalletPillProps {
  address: string;
  onPress?: () => void;
}

export function WalletPill({ address, onPress }: WalletPillProps) {
  const truncatedAddress = `${address.slice(0, 6)}...${address.slice(-2)}`;

  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-2 bg-wallet-card px-3 py-2 rounded-full"
    >
      <View className="w-2 h-2 rounded-full bg-wallet-accent" />
      <Text className="text-wallet-text text-sm font-medium">
        {truncatedAddress}
      </Text>
      <Text className="text-wallet-text-muted text-xs">▼</Text>
    </Pressable>
  );
}
