import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ProgressSteps } from '@/components/wallet-setup/progress-steps';
import { BackupWarningCard } from '@/components/wallet-setup/backup-warning-card';
import { BackupIllustration } from '@/components/wallet-setup/illustrations/backup-illustration';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function BackupWarningScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mnemonic: string }>();
  const [isChecked, setIsChecked] = useState(false);

  const continueScale = useSharedValue(1);
  const checkScale = useSharedValue(1);

  const handleToggleCheck = () => {
    checkScale.value = withSpring(0.9, { damping: 15 }, () => {
      checkScale.value = withSpring(1);
    });
    setIsChecked(!isChecked);
  };

  const handleContinue = () => {
    if (!isChecked) return;
    router.push({
      pathname: '/wallet-setup/create/confirm',
      params: { mnemonic: params.mnemonic },
    });
  };

  const handleBack = () => {
    router.back();
  };

  const continueStyle = useAnimatedStyle(() => ({
    transform: [{ scale: continueScale.value }],
    opacity: isChecked ? 1 : 0.5,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <ProgressSteps currentStep={2} totalSteps={3} />
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Illustration */}
        <View style={styles.illustrationContainer}>
          <BackupIllustration />
        </View>

        {/* Title */}
        <Text style={styles.title}>Backup Your Phrase</Text>
        <Text style={styles.subtitle}>
          Your recovery phrase is the only way to restore your wallet. Keep it safe!
        </Text>

        {/* Warning cards */}
        <View style={styles.warningsContainer}>
          <BackupWarningCard
            icon="alert-triangle"
            text="If you lose your recovery phrase, you will lose access to your wallet forever."
            variant="warning"
          />
          <BackupWarningCard
            icon="shield-off"
            text="Anyone with your phrase can steal your funds. Never share it with anyone."
            variant="warning"
          />
          <BackupWarningCard
            icon="edit-3"
            text="Write it down on paper and store it in a safe, offline location."
            variant="info"
          />
        </View>

        {/* Checkbox */}
        <Pressable onPress={handleToggleCheck} style={styles.checkboxContainer}>
          <AnimatedPressable onPress={handleToggleCheck} style={[styles.checkbox, isChecked && styles.checkboxChecked, checkStyle]}>
            {isChecked && <Feather name="check" size={16} color="#0D1411" />}
          </AnimatedPressable>
          <Text style={styles.checkboxLabel}>
            I have written down my recovery phrase and stored it safely
          </Text>
        </Pressable>
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.footer}>
        <AnimatedPressable
          onPress={handleContinue}
          onPressIn={() => { if (isChecked) continueScale.value = withSpring(0.97); }}
          onPressOut={() => { continueScale.value = withSpring(1); }}
          style={[styles.continueButton, continueStyle]}
          disabled={!isChecked}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
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
  warningsContainer: {
    gap: 12,
    marginBottom: 28,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    paddingVertical: 8,
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#2A332F',
    backgroundColor: '#1A1F1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#B8F25B',
    borderColor: '#B8F25B',
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
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
