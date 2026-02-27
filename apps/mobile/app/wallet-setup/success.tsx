import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { SuccessIllustration } from '@/components/wallet-setup/illustrations/success-illustration';
import { useWallet } from '@/hooks/use-wallet';
import { useWalletSetup } from '@/contexts/wallet-setup-context';
import { useAuth } from '@/hooks/use-auth';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function WalletSuccessScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ action: 'created' | 'imported' }>();
  const { createWallet, importWallet, walletAddress } = useWallet();
  const { pin, mnemonic, clear } = useWalletSetup();
  const { setupPin } = useAuth();
  const [hasSaved, setHasSaved] = useState(false);
  const [isCreating, setIsCreating] = useState(true);

  // Skeleton animation
  const skeletonOpacity = useSharedValue(0.3);

  const contentOpacity = useSharedValue(0);
  const contentTranslateY = useSharedValue(30);
  const buttonScale = useSharedValue(1);

  const isCreated = params.action === 'created';

  // Start skeleton animation
  useEffect(() => {
    skeletonOpacity.value = withRepeat(
      withTiming(0.7, { duration: 800 }),
      -1,
      true
    );
  }, [skeletonOpacity]);

  // Save wallet on mount
  useEffect(() => {
    const saveWallet = async () => {
      if (!pin || !mnemonic || mnemonic.length === 0 || hasSaved) {
        return;
      }

      setHasSaved(true);
      setIsCreating(true);

      try {
        // First, setup PIN for app lock
        await setupPin(pin);

        // Then create/import wallet with encryption
        if (isCreated) {
          await createWallet(mnemonic, pin);
        } else {
          await importWallet(mnemonic, pin);
        }
        // Clear context after successful creation
        clear();
        setIsCreating(false);
      } catch (error) {
        console.error('Failed to save wallet:', error);
        setHasSaved(false);
        setIsCreating(false);
      }
    };

    saveWallet();
  }, [pin, mnemonic, hasSaved, isCreated, setupPin, createWallet, importWallet, clear]);

  // Animate content in
  useEffect(() => {
    contentOpacity.value = withDelay(
      800,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) })
    );
    contentTranslateY.value = withDelay(
      800,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.ease) })
    );
  }, [contentOpacity, contentTranslateY]);

  const handleGetStarted = () => {
    router.replace('/(tabs)');
  };

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: contentTranslateY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const skeletonStyle = useAnimatedStyle(() => ({
    opacity: skeletonOpacity.value,
  }));

  // Format address for display
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <View style={styles.content}>
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <SuccessIllustration />
        </View>

        {/* Text content */}
        <Animated.View style={[styles.textContainer, contentStyle]}>
          <Text style={styles.title}>
            {isCreated ? 'Wallet Created!' : 'Wallet Imported!'}
          </Text>
          <Text style={styles.subtitle}>
            {isCreated
              ? 'Your new wallet is ready to use. Start exploring the world of crypto!'
              : 'Your wallet has been restored successfully. Welcome back!'}
          </Text>

          {/* Wallet address pill */}
          <View style={styles.addressContainer}>
            <View style={styles.addressIcon}>
              <Feather name="credit-card" size={18} color="#B8F25B" />
            </View>
            <View style={styles.addressTextContainer}>
              <Text style={styles.addressLabel}>Wallet Address</Text>
              {isCreating || !walletAddress ? (
                <Animated.View style={[styles.addressSkeleton, skeletonStyle]} />
              ) : (
                <Text style={styles.addressValue}>{formatAddress(walletAddress)}</Text>
              )}
            </View>
            <Pressable style={styles.copyButton} disabled={isCreating || !walletAddress}>
              <Feather name="copy" size={16} color={isCreating || !walletAddress ? '#4A5652' : '#8B9A92'} />
            </Pressable>
          </View>
        </Animated.View>
      </View>

      {/* Bottom button */}
      <Animated.View style={[styles.footer, contentStyle]}>
        <AnimatedPressable
          onPress={handleGetStarted}
          onPressIn={() => { buttonScale.value = withSpring(0.97); }}
          onPressOut={() => { buttonScale.value = withSpring(1); }}
          style={[styles.getStartedButton, buttonStyle]}
        >
          <Text style={styles.getStartedButtonText}>Get Started</Text>
          <Feather name="arrow-right" size={20} color="#0D1411" />
        </AnimatedPressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1411',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  illustrationContainer: {
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 32,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    color: '#8B9A92',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    maxWidth: 300,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1F1D',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#2A332F',
    width: '100%',
    maxWidth: 320,
  },
  addressIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(184, 242, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressTextContainer: {
    flex: 1,
  },
  addressLabel: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    color: '#8B9A92',
    marginBottom: 2,
  },
  addressValue: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#FFFFFF',
  },
  addressSkeleton: {
    width: 140,
    height: 18,
    backgroundColor: '#2A332F',
    borderRadius: 4,
    marginTop: 2,
  },
  copyButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#232A27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#B8F25B',
    paddingVertical: 18,
    borderRadius: 16,
  },
  getStartedButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#0D1411',
  },
});
