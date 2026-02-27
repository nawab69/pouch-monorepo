import { View, Text, TextInput, Pressable } from 'react-native';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import { Token } from '@/types/blockchain';

interface SwapTokenInputProps {
  type: 'sell' | 'buy';
  token: Token | null;
  amount: string;
  onAmountChange?: (amount: string) => void;
  onTokenPress: () => void;
  onMaxPress?: () => void;
  editable?: boolean;
  isLoading?: boolean;
}

export function SwapTokenInput({
  type,
  token,
  amount,
  onAmountChange,
  onTokenPress,
  onMaxPress,
  editable = true,
  isLoading = false,
}: SwapTokenInputProps) {
  const isSell = type === 'sell';

  // Calculate USD value
  const usdValue = token?.priceUsd && amount
    ? (parseFloat(amount) || 0) * token.priceUsd
    : null;

  // Get balance
  const balance = token ? parseFloat(token.balanceFormatted) : 0;
  const hasBalance = balance > 0;

  return (
    <View className="bg-wallet-card rounded-2xl p-4">
      {/* Header row */}
      <View className="flex-row items-center justify-between mb-3">
        <Text className="text-wallet-text-secondary text-sm">
          {isSell ? 'You pay' : 'You receive'}
        </Text>

        {token && isSell && (
          <View className="flex-row items-center gap-2">
            <Text className="text-wallet-text-secondary text-sm">
              Balance: {balance.toFixed(4)}
            </Text>
            {onMaxPress && hasBalance && (
              <Pressable onPress={onMaxPress}>
                <Text className="text-wallet-accent text-sm font-semibold">
                  MAX
                </Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Main content row */}
      <View className="flex-row items-center justify-between">
        {/* Token selector */}
        <Pressable
          onPress={onTokenPress}
          className="flex-row items-center gap-2 bg-wallet-card-light px-3 py-2.5 rounded-full"
        >
          {token ? (
            <>
              <View
                className="w-7 h-7 rounded-full items-center justify-center overflow-hidden"
                style={{ backgroundColor: token.logoUrl ? '#1C1C1E' : '#627EEA' }}
              >
                {token.logoUrl ? (
                  <Image
                    source={{ uri: token.logoUrl }}
                    style={{ width: 20, height: 20 }}
                    contentFit="contain"
                  />
                ) : (
                  <Text className="text-white font-bold text-xs">
                    {token.symbol.charAt(0)}
                  </Text>
                )}
              </View>
              <Text className="text-wallet-text font-semibold">
                {token.symbol}
              </Text>
            </>
          ) : (
            <Text className="text-wallet-accent font-semibold">
              Select token
            </Text>
          )}
          <Feather name="chevron-down" size={16} color="#8B9A92" />
        </Pressable>

        {/* Amount input */}
        <View className="flex-1 items-end ml-3">
          {isLoading ? (
            <View className="h-8 w-24 bg-wallet-card-light rounded animate-pulse" />
          ) : editable ? (
            <TextInput
              className="text-wallet-text text-2xl font-semibold text-right w-full"
              value={amount}
              onChangeText={onAmountChange}
              keyboardType="decimal-pad"
              placeholder="0"
              placeholderTextColor="#5C6660"
              editable={!!token}
            />
          ) : (
            <Text
              className={`text-2xl font-semibold ${
                amount ? 'text-wallet-text' : 'text-wallet-text-muted'
              }`}
            >
              {amount || '0'}
            </Text>
          )}

          {/* USD value */}
          {usdValue !== null && amount && (
            <Text className="text-wallet-text-muted text-sm mt-1">
              ~${usdValue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}
