import { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Pressable, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { useWallet } from '@/hooks/use-wallet';
import { MnemonicGrid } from '@/components/wallet-setup/mnemonic-grid';
import { authenticateWithBiometric } from '@/services/auth/biometric-service';
import { PinInput } from '@/components/lock-screen/pin-input';
import { PinKeypad } from '@/components/lock-screen/pin-keypad';
import { PIN_LENGTH, BIOMETRIC_PROMPTS } from '@/constants/auth';

interface RecoveryPhraseViewerProps {
  visible: boolean;
  onClose: () => void;
}

type ViewState = 'warning' | 'auth' | 'viewing';

const AUTO_HIDE_SECONDS = 60;

export function RecoveryPhraseViewer({ visible, onClose }: RecoveryPhraseViewerProps) {
  const { lockSettings, biometricType: _biometricType, hasBiometricHardware } = useAuth();
  const { getMnemonic } = useWallet();

  const [viewState, setViewState] = useState<ViewState>('warning');
  const [mnemonic, setMnemonic] = useState<string[]>([]);
  const [isBlurred, setIsBlurred] = useState(true);
  const [autoHideCountdown, setAutoHideCountdown] = useState(AUTO_HIDE_SECONDS);
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);

  // Store verified PIN for decryption
  const verifiedPinRef = useRef<string>('');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setViewState('warning');
      setMnemonic([]);
      setIsBlurred(true);
      setAutoHideCountdown(AUTO_HIDE_SECONDS);
      setPin('');
      setHasError(false);
      verifiedPinRef.current = '';
    }
  }, [visible]);

  // Auto-hide countdown
  useEffect(() => {
    if (viewState !== 'viewing' || isBlurred) return;

    const interval = setInterval(() => {
      setAutoHideCountdown((prev) => {
        if (prev <= 1) {
          setIsBlurred(true);
          return AUTO_HIDE_SECONDS;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [viewState, isBlurred]);

  const handleProceedToAuth = () => {
    // PIN is always required now for encryption
    setViewState('auth');
    // Try biometric first if available
    if (lockSettings.useBiometric && hasBiometricHardware) {
      handleBiometricAuth();
    }
  };

  const handleBiometricAuth = async () => {
    const result = await authenticateWithBiometric(BIOMETRIC_PROMPTS.VIEW_RECOVERY);
    if (result.success) {
      // For biometric, we still need the PIN to decrypt
      // This is a security limitation - biometric cannot decrypt data
      // We'll show a message to enter PIN
      Alert.alert(
        'PIN Required',
        'For security, your PIN is needed to decrypt your recovery phrase.',
        [{ text: 'OK' }]
      );
    }
  };

  const handlePinSubmit = async () => {
    // Directly attempt to decrypt the mnemonic with the entered PIN
    // This works whether lock is enabled or disabled, since PIN correctness
    // is verified by successful decryption
    await loadMnemonic(pin);
  };

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH && viewState === 'auth') {
      handlePinSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin, viewState]);

  const loadMnemonic = async (enteredPin: string) => {
    try {
      const phrase = await getMnemonic(enteredPin);
      if (phrase) {
        // PIN was correct - decryption succeeded
        verifiedPinRef.current = enteredPin;
        setMnemonic(phrase.split(' '));
        setViewState('viewing');
        setIsBlurred(true);
      } else {
        // PIN was incorrect - decryption failed
        setHasError(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          setPin('');
          setHasError(false);
        }, 500);
      }
    } catch {
      Alert.alert('Error', 'Failed to load recovery phrase');
      onClose();
    }
  };

  const handleReveal = useCallback(() => {
    setIsBlurred(false);
    setAutoHideCountdown(AUTO_HIDE_SECONDS);
  }, []);

  const handleDigitPress = (digit: string) => {
    if (pin.length < PIN_LENGTH) {
      setPin((prev) => prev + digit);
      setHasError(false);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  const renderWarning = () => (
    <View className="flex-1 items-center justify-center px-6">
      <View className="w-20 h-20 rounded-full bg-wallet-negative/20 items-center justify-center mb-6">
        <Feather name="alert-triangle" size={40} color="#FF3B30" />
      </View>

      <Text className="text-2xl font-bold text-wallet-text text-center mb-4">
        View Recovery Phrase
      </Text>

      <Text className="text-wallet-text-secondary text-center mb-8 leading-6">
        Your recovery phrase is the only way to restore your wallet if you lose access.
        Never share it with anyone.
      </Text>

      <View className="w-full bg-wallet-card rounded-xl p-4 mb-8">
        <View className="flex-row items-start gap-3 mb-3">
          <Feather name="eye-off" size={18} color="#FF9500" />
          <Text className="flex-1 text-wallet-text text-sm">
            Make sure no one is watching your screen
          </Text>
        </View>
        <View className="flex-row items-start gap-3 mb-3">
          <Feather name="camera-off" size={18} color="#FF9500" />
          <Text className="flex-1 text-wallet-text text-sm">
            Do not take screenshots
          </Text>
        </View>
        <View className="flex-row items-start gap-3">
          <Feather name="lock" size={18} color="#FF9500" />
          <Text className="flex-1 text-wallet-text text-sm">
            Store it securely offline
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleProceedToAuth}
        className="w-full bg-wallet-accent py-4 rounded-xl items-center active:opacity-80"
      >
        <Text className="text-wallet-bg font-semibold text-base">
          I Understand, Continue
        </Text>
      </Pressable>
    </View>
  );

  const renderAuth = () => (
    <View className="flex-1 items-center justify-between py-8">
      <View className="items-center gap-4">
        <View className="w-16 h-16 rounded-full bg-wallet-card items-center justify-center">
          <Feather name="shield" size={28} color="#B8F25B" />
        </View>
        <Text className="text-xl font-semibold text-wallet-text">
          Enter Your PIN
        </Text>
        <Text className="text-wallet-text-secondary text-center px-8">
          Your PIN is required to decrypt your recovery phrase
        </Text>
      </View>

      <View className="items-center gap-4">
        <PinInput length={pin.length} hasError={hasError} />
        {hasError && (
          <Text className="text-wallet-negative">Incorrect PIN</Text>
        )}
      </View>

      <View className="items-center gap-6">
        <PinKeypad
          onPress={handleDigitPress}
          onDelete={handleDelete}
        />
      </View>
    </View>
  );

  const renderViewing = () => (
    <View className="flex-1 px-6 py-4">
      {/* Countdown */}
      {!isBlurred && (
        <View className="flex-row items-center justify-center gap-2 mb-4">
          <Feather name="clock" size={16} color="#8E8E93" />
          <Text className="text-wallet-text-secondary">
            Auto-hiding in {autoHideCountdown}s
          </Text>
        </View>
      )}

      {/* Mnemonic Grid */}
      <View className="flex-1 justify-center">
        <MnemonicGrid
          words={mnemonic}
          isBlurred={isBlurred}
          onReveal={handleReveal}
        />

        {isBlurred && (
          <View className="mt-6 items-center">
            <Text className="text-wallet-text-secondary text-center mb-2">
              Tap to reveal your recovery phrase
            </Text>
            <Pressable
              onPress={handleReveal}
              className="flex-row items-center gap-2 px-4 py-2 bg-wallet-card rounded-full"
            >
              <Feather name="eye" size={18} color="#B8F25B" />
              <Text className="text-wallet-accent font-medium">Reveal</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* Warning Footer */}
      <View className="bg-wallet-negative/10 rounded-xl p-4 mt-4">
        <View className="flex-row items-start gap-3">
          <Feather name="alert-circle" size={18} color="#FF3B30" />
          <Text className="flex-1 text-wallet-negative text-sm">
            Never share your recovery phrase. Anyone with these words can steal your funds.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center px-5 py-4">
          <Pressable
            onPress={onClose}
            className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center active:opacity-70"
          >
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-wallet-text mr-10">
            Recovery Phrase
          </Text>
        </View>

        {viewState === 'warning' && renderWarning()}
        {viewState === 'auth' && renderAuth()}
        {viewState === 'viewing' && renderViewing()}
      </SafeAreaView>
    </Modal>
  );
}
