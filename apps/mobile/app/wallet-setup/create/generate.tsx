import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Alert, AppState, AppStateStatus } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ProgressSteps } from '@/components/wallet-setup/progress-steps';
import { MnemonicGrid } from '@/components/wallet-setup/mnemonic-grid';
import { useMnemonic } from '@/hooks/use-mnemonic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function GenerateMnemonicScreen() {
  const router = useRouter();
  const { generateMnemonic } = useMnemonic();
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const continueScale = useSharedValue(1);
  const copyScale = useSharedValue(1);

  // Generate mnemonic on mount
  useEffect(() => {
    const words = generateMnemonic();
    setMnemonic(words);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Blur mnemonic when app backgrounds
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'background' || nextAppState === 'inactive') {
        setIsRevealed(false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  // Clear clipboard after 60 seconds
  useEffect(() => {
    if (isCopied) {
      const timer = setTimeout(async () => {
        await Clipboard.setStringAsync('');
        setIsCopied(false);
      }, 60000);
      return () => clearTimeout(timer);
    }
  }, [isCopied]);

  const handleReveal = () => {
    setIsRevealed(true);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(mnemonic.join(' '));
    setIsCopied(true);
    Alert.alert(
      'Copied',
      'Recovery phrase copied to clipboard. It will be cleared in 60 seconds for security.',
      [{ text: 'OK' }]
    );
  };

  const handleContinue = () => {
    if (!isRevealed) {
      Alert.alert(
        'Reveal Your Phrase',
        'Please tap on the phrase to reveal it and make sure you\'ve written it down before continuing.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push({
      pathname: '/wallet-setup/create/backup',
      params: { mnemonic: mnemonic.join(',') },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const continueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueScale.value }],
  }));

  const copyStyle = useAnimatedStyle(() => ({
    transform: [{ scale: copyScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <ProgressSteps currentStep={1} totalSteps={3} />
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Your Recovery Phrase</Text>
        <Text style={styles.subtitle}>
          {isRevealed
            ? 'Write down these 12 words in order and store them safely.'
            : 'Tap below to reveal your secret recovery phrase.'}
        </Text>

        {/* Mnemonic Grid */}
        <View style={styles.gridContainer}>
          <MnemonicGrid
            words={mnemonic}
            isBlurred={!isRevealed}
          />

          {!isRevealed && (
            <Pressable style={styles.revealOverlay} onPress={handleReveal}>
              <Feather name="eye" size={24} color="#B8F25B" />
              <Text style={styles.revealText}>Tap to reveal</Text>
            </Pressable>
          )}
        </View>

        {/* Copy button */}
        {isRevealed && (
          <AnimatedPressable
            onPress={handleCopy}
            onPressIn={() => { copyScale.value = withSpring(0.95); }}
            onPressOut={() => { copyScale.value = withSpring(1); }}
            style={[styles.copyButton, copyStyle]}
          >
            <Feather name={isCopied ? 'check' : 'copy'} size={18} color="#B8F25B" />
            <Text style={styles.copyButtonText}>
              {isCopied ? 'Copied' : 'Copy to clipboard'}
            </Text>
          </AnimatedPressable>
        )}
      </View>

      {/* Bottom button */}
      <View style={styles.footer}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={() => { continueScale.value = withSpring(0.97); }}
          onPressOut={() => { continueScale.value = withSpring(1); }}
          style={[styles.continueButton, continueStyle]}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Feather name="arrow-right" size={20} color="#0D1411" />
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1411',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1F1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#8B9A92',
    lineHeight: 22,
    marginBottom: 28,
  },
  gridContainer: {
    position: 'relative',
  },
  revealOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(13, 20, 17, 0.7)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  revealText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#B8F25B',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    marginTop: 24,
    backgroundColor: 'rgba(184, 242, 91, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 91, 0.2)',
  },
  copyButtonText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#B8F25B',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#B8F25B',
    paddingVertical: 18,
    borderRadius: 16,
  },
  continueButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#0D1411',
  },
});
