import { View, Text, TextInput } from 'react-native';
import { WalletPill } from './wallet-pill';
import { TokenSelector } from './token-selector';

interface SwapCardProps {
  type: 'from' | 'to';
  walletAddress: string;
  label: string;
  labelValue: string;
  tokenSymbol: string;
  tokenColor: string;
  amount: string;
  usdValue: string;
  onAmountChange?: (value: string) => void;
  onTokenPress?: () => void;
  onWalletPress?: () => void;
  onMaxPress?: () => void;
  editable?: boolean;
}

export function SwapCard({
  type,
  walletAddress,
  label,
  labelValue,
  tokenSymbol,
  tokenColor,
  amount,
  usdValue,
  onAmountChange,
  onTokenPress,
  onWalletPress,
  onMaxPress,
  editable = true,
}: SwapCardProps) {
  return (
    <View className="gap-2">
      <View className="flex-row items-center justify-between px-1">
        <View className="flex-row items-center gap-2">
          <Text className="text-wallet-text-muted text-sm uppercase">{type}:</Text>
          {type === 'from' && (
            <View className="flex-row items-center gap-1">
              <Text className="text-wallet-text-secondary text-sm">{label}</Text>
              <Text className="text-wallet-text font-medium text-sm">{labelValue}</Text>
              {onMaxPress && (
                <Text
                  className="text-wallet-accent text-sm font-medium ml-1"
                  onPress={onMaxPress}
                >
                  MAX
                </Text>
              )}
            </View>
          )}
          {type === 'to' && (
            <View className="flex-row items-center gap-1">
              <Text className="text-wallet-text-secondary text-sm">{label}</Text>
              <Text className="text-wallet-text font-medium text-sm">{labelValue}</Text>
            </View>
          )}
        </View>
        <WalletPill address={walletAddress} onPress={onWalletPress} />
      </View>

      <View className="bg-wallet-card rounded-2xl p-4">
        <View className="flex-row items-center justify-between">
          <TokenSelector
            symbol={tokenSymbol}
            color={tokenColor}
            onPress={onTokenPress}
          />
          <View className="items-end flex-1 ml-4">
            {editable ? (
              <TextInput
                className="text-wallet-text text-2xl font-medium text-right w-full"
                value={amount}
                onChangeText={onAmountChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor="#5C6660"
              />
            ) : (
              <Text className="text-wallet-text text-2xl font-medium">{amount}</Text>
            )}
            <Text className="text-wallet-text-muted text-sm">~{usdValue}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
