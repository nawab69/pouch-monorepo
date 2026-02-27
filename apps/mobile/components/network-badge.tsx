import { View, Text } from 'react-native';
import { Network, NetworkType } from '@/types/blockchain';

interface NetworkBadgeProps {
  network: Network;
  networkType: NetworkType;
  size?: 'small' | 'medium';
}

export function NetworkBadge({
  network,
  networkType,
  size = 'small',
}: NetworkBadgeProps) {
  const isTestnet = networkType === 'testnet';
  const displayName = isTestnet ? network.testnetName : network.name;

  const sizeStyles = {
    small: 'px-2 py-0.5',
    medium: 'px-3 py-1',
  };

  const textStyles = {
    small: 'text-xs',
    medium: 'text-sm',
  };

  return (
    <View
      className={`flex-row items-center gap-1.5 rounded-full ${sizeStyles[size]}`}
      style={{ backgroundColor: `${network.color}20` }}
    >
      <View
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: network.color }}
      />
      <Text
        className={`font-medium ${textStyles[size]}`}
        style={{ color: network.color }}
      >
        {displayName}
      </Text>
      {isTestnet && (
        <View className="bg-wallet-accent/20 px-1.5 py-0.5 rounded">
          <Text className="text-[10px] text-wallet-accent font-medium">TEST</Text>
        </View>
      )}
    </View>
  );
}
