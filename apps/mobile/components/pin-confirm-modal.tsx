import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { PinInput } from '@/components/lock-screen/pin-input';
import { PinKeypad } from '@/components/lock-screen/pin-keypad';
import { PIN_LENGTH } from '@/constants/auth';

interface PinConfirmModalProps {
  visible: boolean;
  title?: string;
  description?: string;
  onClose: () => void;
  /** Called when PIN is entered. Return true if PIN was valid, false otherwise. */
  onConfirm: (pin: string) => Promise<boolean>;
}

export function PinConfirmModal({
  visible,
  title = 'Confirm Transaction',
  description = 'Enter your PIN to sign this transaction',
  onClose,
  onConfirm,
}: PinConfirmModalProps) {
  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  // Reset state when modal opens or closes
  useEffect(() => {
    if (visible) {
      setPin('');
      setHasError(false);
      setIsVerifying(false);
    }
    // Also reset when closing to ensure clean state
    return () => {
      setPin('');
      setHasError(false);
      setIsVerifying(false);
    };
  }, [visible]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH && !isVerifying) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handleSubmit = async () => {
    setIsVerifying(true);
    const currentPin = pin; // Capture current pin value

    try {
      // Let the caller validate the PIN by attempting the actual operation
      const isValid = await onConfirm(currentPin);
      if (isValid) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Reset state for clean modal dismissal
        setIsVerifying(false);
        setPin('');
      } else {
        setHasError(true);
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setTimeout(() => {
          setPin('');
          setHasError(false);
          setIsVerifying(false);
        }, 500);
      }
    } catch {
      // Treat errors as invalid PIN
      setHasError(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setTimeout(() => {
        setPin('');
        setHasError(false);
        setIsVerifying(false);
      }, 500);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (pin.length < PIN_LENGTH && !isVerifying) {
      setPin((prev) => prev + digit);
      setHasError(false);
    }
  };

  const handleDelete = () => {
    if (!isVerifying) {
      setPin((prev) => prev.slice(0, -1));
      setHasError(false);
    }
  };

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
            {title}
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1 items-center justify-between py-8">
          {/* Instructions */}
          <View className="items-center gap-4 px-6">
            <View className="w-16 h-16 rounded-full bg-wallet-accent/10 items-center justify-center">
              <Feather name="lock" size={28} color="#B8F25B" />
            </View>
            <Text className="text-xl font-semibold text-wallet-text text-center">
              Enter Your PIN
            </Text>
            <Text className="text-wallet-text-secondary text-center leading-6">
              {description}
            </Text>
          </View>

          {/* PIN Input */}
          <View className="items-center gap-4">
            <PinInput length={pin.length} hasError={hasError} />
            {hasError ? (
              <Text className="text-wallet-negative text-center">
                Incorrect PIN. Try again.
              </Text>
            ) : (
              <View className="h-5" />
            )}
          </View>

          {/* Keypad */}
          <PinKeypad
            onPress={handleDigitPress}
            onDelete={handleDelete}
            disabled={isVerifying}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}
