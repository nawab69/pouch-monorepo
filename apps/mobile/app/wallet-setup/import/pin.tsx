import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { PinInput } from '@/components/lock-screen/pin-input';
import { PinKeypad } from '@/components/lock-screen/pin-keypad';
import { useWalletSetup } from '@/contexts/wallet-setup-context';
import { PIN_LENGTH } from '@/constants/auth';

type Step = 'acknowledge' | 'create' | 'confirm';

export default function ImportPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mnemonic: string }>();
  const { setPin: setContextPin, setMnemonic } = useWalletSetup();

  const [step, setStep] = useState<Step>('acknowledge');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasError, setHasError] = useState(false);

  const currentPin = step === 'create' ? pin : step === 'confirm' ? confirmPin : '';
  const setCurrentPin = step === 'create' ? setPin : setConfirmPin;

  const handleAcknowledge = () => {
    setStep('create');
  };

  // Store mnemonic in context on mount
  useEffect(() => {
    if (params.mnemonic) {
      setMnemonic(params.mnemonic.split(','));
    }
  }, [params.mnemonic, setMnemonic]);

  // Handle PIN completion
  useEffect(() => {
    if (step === 'create' && pin.length === PIN_LENGTH) {
      // Move to confirm step
      setTimeout(() => {
        setStep('confirm');
      }, 200);
    } else if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
      // Check if PINs match
      if (pin === confirmPin) {
        handlePinCreated();
      } else {
        setHasError(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        // Reset confirm step
        setTimeout(() => {
          setConfirmPin('');
          setHasError(false);
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, confirmPin, step]);

  const handlePinCreated = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Store PIN in context
    setContextPin(pin);
    // Navigate to success
    router.replace({
      pathname: '/wallet-setup/success',
      params: { action: 'imported' },
    });
  };

  const handleDigitPress = (digit: string) => {
    if (currentPin.length < PIN_LENGTH) {
      setCurrentPin((prev) => prev + digit);
      setHasError(false);
    }
  };

  const handleDelete = () => {
    setCurrentPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setConfirmPin('');
      setHasError(false);
    } else if (step === 'create') {
      setStep('acknowledge');
      setPin('');
      setHasError(false);
    } else {
      router.back();
    }
  };

  // Acknowledgment screen
  if (step === 'acknowledge') {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <StatusBar style="light" />

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack} style={styles.backButton}>
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.headerTitle}>Secure Your Wallet</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <View style={styles.acknowledgeContent}>
          {/* Icon */}
          <View style={styles.acknowledgeIconContainer}>
            <Feather name="alert-triangle" size={48} color="#F59E0B" />
          </View>

          {/* Title */}
          <Text style={styles.acknowledgeTitle}>Important Security Notice</Text>

          {/* Warning card */}
          <View style={styles.acknowledgeCard}>
            <View style={styles.acknowledgeCardRow}>
              <Feather name="lock" size={20} color="#B8F25B" />
              <Text style={styles.acknowledgeCardText}>
                Your PIN encrypts your wallet and protects your funds.
              </Text>
            </View>
            <View style={styles.acknowledgeCardRow}>
              <Feather name="alert-circle" size={20} color="#F59E0B" />
              <Text style={styles.acknowledgeCardText}>
                If you forget your PIN, you will need your recovery phrase to restore access.
              </Text>
            </View>
            <View style={styles.acknowledgeCardRow}>
              <Feather name="shield" size={20} color="#8B9A92" />
              <Text style={styles.acknowledgeCardText}>
                Never share your PIN or recovery phrase with anyone.
              </Text>
            </View>
          </View>
        </View>

        {/* Button */}
        <View style={styles.acknowledgeFooter}>
          <Pressable onPress={handleAcknowledge} style={styles.acknowledgeButton}>
            <Text style={styles.acknowledgeButtonText}>I Understand</Text>
            <Feather name="arrow-right" size={20} color="#0D1411" />
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>Secure Your Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Icon */}
        <View style={styles.iconContainer}>
          <Feather name="lock" size={36} color="#B8F25B" />
        </View>

        {/* Title */}
        <Text style={styles.title}>
          {step === 'create' ? 'Create a PIN' : 'Confirm Your PIN'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'create'
            ? 'This PIN encrypts your wallet. You will need it to access your funds.'
            : 'Re-enter your PIN to confirm'}
        </Text>

        {/* PIN Input */}
        <View style={styles.pinContainer}>
          <PinInput length={currentPin.length} hasError={hasError} />
          {hasError && (
            <Text style={styles.errorText}>PINs do not match. Try again.</Text>
          )}
        </View>
      </View>

      {/* Keypad */}
      <View style={styles.keypadContainer}>
        <PinKeypad
          onPress={handleDigitPress}
          onDelete={handleDelete}
          disabled={false}
        />
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
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(184, 242, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#8B9A92',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 40,
    maxWidth: 280,
  },
  pinContainer: {
    alignItems: 'center',
    gap: 16,
  },
  errorText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#EF4444',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    padding: 16,
    borderRadius: 14,
    marginTop: 32,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    maxWidth: 320,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#8B9A92',
    lineHeight: 20,
  },
  keypadContainer: {
    paddingBottom: 24,
  },
  acknowledgeContent: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  acknowledgeIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  acknowledgeTitle: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    marginBottom: 32,
    textAlign: 'center',
  },
  acknowledgeCard: {
    backgroundColor: '#1A1F1D',
    borderRadius: 16,
    padding: 20,
    gap: 20,
    borderWidth: 1,
    borderColor: '#2A332F',
    width: '100%',
    maxWidth: 340,
  },
  acknowledgeCardRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  acknowledgeCardText: {
    flex: 1,
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  acknowledgeFooter: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#B8F25B',
    paddingVertical: 18,
    borderRadius: 16,
  },
  acknowledgeButtonText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 17,
    color: '#0D1411',
  },
});
