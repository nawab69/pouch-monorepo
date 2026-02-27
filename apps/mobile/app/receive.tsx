import { useState } from 'react';
import { View, Text, Pressable, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { QRCodeDisplay } from '@/components/qr-code-display';
import { NetworkBadge } from '@/components/network-badge';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';

export default function ReceiveScreen() {
  const router = useRouter();
  const { walletAddress } = useWallet();
  const { selectedNetwork, networkType } = useNetwork();
  const [copied, setCopied] = useState(false);

  const translateY = useSharedValue(0);

  const dismissModal = () => {
    router.back();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        runOnJS(dismissModal)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleCopy = async () => {
    if (!walletAddress) return;

    await Clipboard.setStringAsync(walletAddress);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!walletAddress) return;

    try {
      await Share.share({
        message: walletAddress,
        title: 'My Wallet Address',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  if (!walletAddress) {
    return (
      <View className="flex-1">
        <Pressable onPress={dismissModal} className="absolute inset-0">
          <BlurView intensity={40} tint="dark" className="flex-1" />
        </Pressable>
        <View
          className="flex-1 mt-20 rounded-t-[32px] overflow-hidden items-center justify-center border-t border-x border-white/10"
          style={{ backgroundColor: 'rgba(13, 20, 17, 0.92)' }}
        >
          <Text className="text-wallet-text-secondary">No wallet found</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Blur background - tap to dismiss */}
      <Pressable onPress={dismissModal} className="absolute inset-0">
        <BlurView intensity={40} tint="dark" className="flex-1" />
      </Pressable>

      {/* Glass modal container */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          className="flex-1 mt-20 rounded-t-[32px] overflow-hidden border-t border-x border-white/10"
          style={[{ backgroundColor: 'rgba(13, 20, 17, 0.92)' }, animatedStyle]}
        >
          {/* Top handle bar */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1.5 rounded-full bg-white/30" />
          </View>

          <SafeAreaView className="flex-1" edges={['bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>

        <Text className="text-xl font-bold text-wallet-text">Receive</Text>

        <View className="w-10" />
      </View>

      {/* Content */}
      <View className="flex-1 px-5 pt-6">
        {/* Network Badge */}
        <View className="items-center mb-8">
          <NetworkBadge
            network={selectedNetwork}
            networkType={networkType}
            size="medium"
          />
        </View>

        {/* QR Code */}
        <View className="items-center">
          <QRCodeDisplay
            address={walletAddress}
            size={220}
            showCopyButton={false}
            onCopy={handleCopy}
          />
        </View>

        {/* Warning */}
        <View className="mt-8 bg-wallet-accent/10 rounded-xl p-4">
          <View className="flex-row items-start gap-3">
            <Feather name="alert-circle" size={20} color="#B8F25B" />
            <View className="flex-1">
              <Text className="text-wallet-accent font-medium mb-1">
                Only send {selectedNetwork.symbol} on {selectedNetwork.name}
              </Text>
              <Text className="text-wallet-text-secondary text-sm">
                Sending tokens on the wrong network may result in permanent loss.
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-8">
          <Pressable
            onPress={handleCopy}
            className="flex-1 flex-row items-center justify-center gap-2 bg-wallet-card py-4 rounded-xl active:opacity-70"
          >
            <Feather
              name={copied ? 'check' : 'copy'}
              size={18}
              color={copied ? '#B8F25B' : '#FFFFFF'}
            />
            <Text
              className={`font-medium ${
                copied ? 'text-wallet-accent' : 'text-wallet-text'
              }`}
            >
              {copied ? 'Copied!' : 'Copy'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            className="flex-1 flex-row items-center justify-center gap-2 bg-wallet-accent py-4 rounded-xl active:opacity-70"
          >
            <Feather name="share" size={18} color="#0A0A0A" />
            <Text className="font-medium text-wallet-bg">Share</Text>
          </Pressable>
        </View>
      </View>
        </SafeAreaView>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
