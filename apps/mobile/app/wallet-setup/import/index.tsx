import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { MnemonicInput } from '@/components/wallet-setup/mnemonic-input';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ImportWalletScreen() {
  const router = useRouter();
  const [wordCount, setWordCount] = useState<12 | 24>(12);
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(false);

  const continueScale = useSharedValue(1);

  const handleMnemonicChange = (words: string[], valid: boolean) => {
    setMnemonic(words);
    setIsValid(valid);
  };

  const handleContinue = () => {
    if (!isValid) return;
    router.push({
      pathname: '/wallet-setup/import/pin',
      params: { mnemonic: mnemonic.join(',') },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const continueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueScale.value }],
    opacity: isValid ? 1 : 0.5,
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Import Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Word count toggle */}
        <View style={styles.toggleContainer}>
          <Pressable
            onPress={() => setWordCount(12)}
            style={[styles.toggleButton, wordCount === 12 && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, wordCount === 12 && styles.toggleTextActive]}>
              12 words
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setWordCount(24)}
            style={[styles.toggleButton, wordCount === 24 && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, wordCount === 24 && styles.toggleTextActive]}>
              24 words
            </Text>
          </Pressable>
        </View>

        <Text style={styles.title}>Enter Recovery Phrase</Text>
        <Text style={styles.subtitle}>
          Enter your {wordCount}-word recovery phrase to restore your wallet. Separate words with spaces.
        </Text>

        {/* Mnemonic input */}
        <MnemonicInput
          wordCount={wordCount}
          onMnemonicChange={handleMnemonicChange}
        />

        {/* Info card */}
        <View style={styles.infoCard}>
          <Feather name="info" size={18} color="#B8F25B" />
          <Text style={styles.infoText}>
            Your recovery phrase is only stored locally and never leaves your device.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.footer}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={() => { if (isValid) continueScale.value = withSpring(0.97); }}
          onPressOut={() => { continueScale.value = withSpring(1); }}
          style={[styles.continueButton, continueStyle]}
          disabled={!isValid}
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
  headerTitle: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#1A1F1D',
    borderRadius: 14,
    padding: 4,
    marginBottom: 28,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  toggleButtonActive: {
    backgroundColor: '#B8F25B',
  },
  toggleText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 15,
    color: '#8B9A92',
  },
  toggleTextActive: {
    color: '#0D1411',
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
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(184, 242, 91, 0.08)',
    padding: 16,
    borderRadius: 14,
    marginTop: 24,
    borderWidth: 1,
    borderColor: 'rgba(184, 242, 91, 0.15)',
  },
  infoText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8B9A92',
    lineHeight: 20,
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
