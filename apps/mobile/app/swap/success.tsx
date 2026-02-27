import { View, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { formatAddress } from '@/services/blockchain';

export default function SwapSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    txHash: string;
    explorerUrl: string;
    sellAmount: string;
    sellSymbol: string;
    buyAmount: string;
    buySymbol: string;
  }>();

  const [copied, setCopied] = useState(false);

  const handleCopyHash = async () => {
    if (!params.txHash) return;

    await Clipboard.setStringAsync(params.txHash);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleViewExplorer = async () => {
    if (!params.explorerUrl) return;

    try {
      await Linking.openURL(params.explorerUrl);
    } catch (error) {
      console.error('Error opening explorer:', error);
    }
  };

  const handleDone = () => {
    router.dismissAll();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      <View className="flex-1 items-center justify-center px-5">
        {/* Success Icon */}
        <View className="w-24 h-24 rounded-full bg-wallet-accent/20 items-center justify-center mb-6">
          <View className="w-16 h-16 rounded-full bg-wallet-accent items-center justify-center">
            <Feather name="check" size={32} color="#0A0A0A" />
          </View>
        </View>

        {/* Success Message */}
        <Text className="text-2xl font-bold text-wallet-text mb-2">
          Swap Submitted!
        </Text>
        <Text className="text-wallet-text-secondary text-center mb-8">
          Your swap has been submitted to the network
        </Text>

        {/* Swap Details */}
        <View className="w-full bg-wallet-card rounded-2xl p-5 mb-6">
          <View className="gap-4">
            {/* Swap summary */}
            <View className="items-center">
              <View className="flex-row items-center gap-3">
                <View className="items-end">
                  <Text className="text-wallet-negative text-lg font-semibold">
                    -{params.sellAmount}
                  </Text>
                  <Text className="text-wallet-text-muted text-sm">
                    {params.sellSymbol}
                  </Text>
                </View>

                <View className="w-8 h-8 rounded-full bg-wallet-card-light items-center justify-center">
                  <Feather name="arrow-right" size={16} color="#B8F25B" />
                </View>

                <View className="items-start">
                  <Text className="text-wallet-positive text-lg font-semibold">
                    +{parseFloat(params.buyAmount ?? '0').toFixed(6)}
                  </Text>
                  <Text className="text-wallet-text-muted text-sm">
                    {params.buySymbol}
                  </Text>
                </View>
              </View>
            </View>

            <View className="h-px bg-wallet-card-light" />

            {/* Transaction Hash */}
            <View>
              <Text className="text-wallet-text-secondary text-sm mb-1">
                Transaction Hash
              </Text>
              <Pressable
                onPress={handleCopyHash}
                className="flex-row items-center gap-2"
              >
                <Text className="text-wallet-text font-mono flex-1">
                  {formatAddress(params.txHash ?? '', 16, 14)}
                </Text>
                <Feather
                  name={copied ? 'check' : 'copy'}
                  size={16}
                  color={copied ? '#B8F25B' : '#8E8E93'}
                />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Note about confirmation */}
        <View className="w-full bg-wallet-card-light rounded-xl p-4 mb-6 flex-row items-start gap-3">
          <Feather name="clock" size={16} color="#8B9A92" />
          <View className="flex-1">
            <Text className="text-wallet-text-secondary text-sm">
              Your tokens will appear in your wallet once the transaction is confirmed on the blockchain.
            </Text>
          </View>
        </View>

        {/* Actions */}
        <View className="w-full gap-3">
          <Pressable
            onPress={handleViewExplorer}
            className="flex-row items-center justify-center gap-2 bg-wallet-card py-4 rounded-xl active:opacity-70"
          >
            <Feather name="external-link" size={18} color="#B8F25B" />
            <Text className="text-wallet-accent font-medium">
              View on Explorer
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDone}
            className="bg-wallet-accent py-4 rounded-xl items-center active:opacity-70"
          >
            <Text className="text-wallet-bg font-semibold text-lg">Done</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}
