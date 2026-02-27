import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { PinInput } from '@/components/lock-screen/pin-input';
import { PinKeypad } from '@/components/lock-screen/pin-keypad';
import { PIN_LENGTH } from '@/constants/auth';

type Step = 'enter' | 'confirm';

interface PinSetupModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (pin: string) => void;
  isChanging?: boolean;
}

export function PinSetupModal({
  visible,
  onClose,
  onComplete,
  isChanging = false,
}: PinSetupModalProps) {
  const [step, setStep] = useState<Step>('enter');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasError, setHasError] = useState(false);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('enter');
      setPin('');
      setConfirmPin('');
      setHasError(false);
    }
  }, [visible]);

  const currentPin = step === 'enter' ? pin : confirmPin;
  const setCurrentPin = step === 'enter' ? setPin : setConfirmPin;

  // Handle PIN completion
  useEffect(() => {
    if (step === 'enter' && pin.length === PIN_LENGTH) {
      // Move to confirm step
      setTimeout(() => {
        setStep('confirm');
      }, 200);
    } else if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
      // Check if PINs match
      if (pin === confirmPin) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onComplete(pin);
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
      setStep('enter');
      setConfirmPin('');
      setHasError(false);
    } else {
      onClose();
    }
  };

  const title = isChanging ? 'Change PIN' : 'Set Up PIN';
  const subtitle =
    step === 'enter'
      ? 'Enter a 6-digit PIN'
      : 'Confirm your PIN';
  const errorMessage = hasError ? "PINs don't match. Try again." : '';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center px-5 py-4">
          <Pressable
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center active:opacity-70"
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-wallet-text mr-10">
            {title}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1 items-center justify-between py-12">
          {/* Instructions */}
          <View className="items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-wallet-card items-center justify-center">
              <Feather name="lock" size={28} color="#B8F25B" />
            </View>
            <Text className="text-xl font-semibold text-wallet-text">
              {subtitle}
            </Text>
            {step === 'confirm' && (
              <Text className="text-wallet-text-secondary text-center px-8">
                Re-enter your PIN to confirm
              </Text>
            )}
          </View>

          {/* PIN Input */}
          <View className="items-center gap-4">
            <PinInput length={currentPin.length} hasError={hasError} />
            {errorMessage ? (
              <Text className="text-wallet-negative text-center">
                {errorMessage}
              </Text>
            ) : (
              <View className="h-5" />
            )}
          </View>

          {/* Keypad */}
          <PinKeypad
            onPress={handleDigitPress}
            onDelete={handleDelete}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
