import { View, Text, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { useState } from 'react';
import { formatAddress } from '@/services/blockchain';

export default function SendSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    txHash: string;
    explorerUrl: string;
    amount: string;
    tokenSymbol: string;
    recipient: string;
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
    // Navigate back to home, clearing the send stack
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
          Transaction Sent!
        </Text>
        <Text className="text-wallet-text-secondary text-center mb-8">
          Your transaction has been submitted to the network
        </Text>

        {/* Transaction Details */}
        <View className="w-full bg-wallet-card rounded-2xl p-5 mb-6">
          <View className="gap-4">
            <View>
              <Text className="text-wallet-text-secondary text-sm mb-1">
                Amount
              </Text>
              <Text className="text-wallet-text text-xl font-bold">
                {params.amount} {params.tokenSymbol}
              </Text>
            </View>

            <View className="h-px bg-wallet-card-light" />

            <View>
              <Text className="text-wallet-text-secondary text-sm mb-1">
                To
              </Text>
              <Text className="text-wallet-text font-mono">
                {formatAddress(params.recipient ?? '', 12, 10)}
              </Text>
            </View>

            <View className="h-px bg-wallet-card-light" />

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
