import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Feather from '@expo/vector-icons/Feather';
import { PinInput } from '@/components/lock-screen/pin-input';
import { PinKeypad } from '@/components/lock-screen/pin-keypad';
import { PIN_LENGTH } from '@/constants/auth';
import { verifyPin } from '@/services/auth/pin-service';

type Step = 'current' | 'verifying' | 'new' | 'confirm' | 'processing';

interface PinChangeModalProps {
  visible: boolean;
  onClose: () => void;
  onComplete: (currentPin: string, newPin: string) => Promise<boolean>;
}

export function PinChangeModal({
  visible,
  onClose,
  onComplete,
}: PinChangeModalProps) {
  const [step, setStep] = useState<Step>('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setStep('current');
      setCurrentPin('');
      setNewPin('');
      setConfirmPin('');
      setHasError(false);
      setErrorMessage('');
    }
  }, [visible]);

  const activePin = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;
  const setActivePin = step === 'current' ? setCurrentPin : step === 'new' ? setNewPin : setConfirmPin;

  // Handle PIN completion for each step
  useEffect(() => {
    if (step === 'current' && currentPin.length === PIN_LENGTH) {
      // Verify current PIN immediately
      handleVerifyCurrentPin();
    } else if (step === 'new' && newPin.length === PIN_LENGTH) {
      // Move to confirm step
      setTimeout(() => {
        setStep('confirm');
      }, 200);
    } else if (step === 'confirm' && confirmPin.length === PIN_LENGTH) {
      // Check if new PINs match
      if (newPin === confirmPin) {
        handlePinChange();
      } else {
        setHasError(true);
        setErrorMessage("PINs don't match. Try again.");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        // Reset confirm step
        setTimeout(() => {
          setConfirmPin('');
          setHasError(false);
          setErrorMessage('');
        }, 500);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPin, newPin, confirmPin, step]);

  const handleVerifyCurrentPin = async () => {
    setStep('verifying');

    try {
      const isValid = await verifyPin(currentPin);

      if (isValid) {
        setStep('new');
      } else {
        setHasError(true);
        setErrorMessage('Incorrect PIN. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        setTimeout(() => {
          setStep('current');
          setCurrentPin('');
          setHasError(false);
          setErrorMessage('');
        }, 1500);
      }
    } catch {
      setHasError(true);
      setErrorMessage('Failed to verify PIN. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => {
        setStep('current');
        setCurrentPin('');
        setHasError(false);
        setErrorMessage('');
      }, 1500);
    }
  };

  const handlePinChange = async () => {
    setStep('processing');

    try {
      const success = await onComplete(currentPin, newPin);

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onClose();
      } else {
        // Wrong current PIN - go back to current PIN step
        setHasError(true);
        setErrorMessage('Incorrect current PIN. Please try again.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

        setTimeout(() => {
          setStep('current');
          setCurrentPin('');
          setNewPin('');
          setConfirmPin('');
          setHasError(false);
          setErrorMessage('');
        }, 1500);
      }
    } catch {
      setHasError(true);
      setErrorMessage('Failed to change PIN. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      setTimeout(() => {
        setStep('current');
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setHasError(false);
        setErrorMessage('');
      }, 1500);
    }
  };

  const handleDigitPress = (digit: string) => {
    if (step === 'processing' || step === 'verifying') return;
    if (activePin.length < PIN_LENGTH) {
      setActivePin((prev) => prev + digit);
      setHasError(false);
      setErrorMessage('');
    }
  };

  const handleDelete = () => {
    if (step === 'processing' || step === 'verifying') return;
    setActivePin((prev) => prev.slice(0, -1));
    setHasError(false);
    setErrorMessage('');
  };

  const handleBack = () => {
    if (step === 'processing' || step === 'verifying') return;

    if (step === 'confirm') {
      setStep('new');
      setConfirmPin('');
      setHasError(false);
      setErrorMessage('');
    } else if (step === 'new') {
      setStep('current');
      setNewPin('');
      setHasError(false);
      setErrorMessage('');
    } else {
      onClose();
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'current':
        return 'Enter Current PIN';
      case 'verifying':
        return 'Verifying PIN';
      case 'new':
        return 'Enter New PIN';
      case 'confirm':
        return 'Confirm New PIN';
      case 'processing':
        return 'Changing PIN';
    }
  };

  const getSubtitle = () => {
    switch (step) {
      case 'current':
        return 'Enter your current 6-digit PIN';
      case 'verifying':
        return 'Checking your current PIN...';
      case 'new':
        return 'Choose a new 6-digit PIN';
      case 'confirm':
        return 'Re-enter your new PIN to confirm';
      case 'processing':
        return 'Re-encrypting wallet data...';
    }
  };

  const getIcon = () => {
    switch (step) {
      case 'current':
        return 'unlock';
      case 'verifying':
        return 'loader';
      case 'new':
      case 'confirm':
        return 'lock';
      case 'processing':
        return 'refresh-cw';
    }
  };

  const isProcessingState = step === 'processing' || step === 'verifying';

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
            disabled={isProcessingState}
            className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center active:opacity-70"
            style={isProcessingState ? { opacity: 0.5 } : undefined}
          >
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <Text className="flex-1 text-center text-lg font-semibold text-wallet-text mr-10">
            Change PIN
          </Text>
        </View>

        {/* Content */}
        <View className="flex-1 items-center justify-between py-12">
          {/* Instructions */}
          <View className="items-center gap-4">
            <View className="w-16 h-16 rounded-full bg-wallet-card items-center justify-center">
              {isProcessingState ? (
                <ActivityIndicator size="small" color="#B8F25B" />
              ) : (
                <Feather name={getIcon()} size={28} color="#B8F25B" />
              )}
            </View>
            <Text className="text-xl font-semibold text-wallet-text">
              {getTitle()}
            </Text>
            <Text className="text-wallet-text-secondary text-center px-8">
              {getSubtitle()}
            </Text>

            {/* Step indicator */}
            {!isProcessingState && (
              <View className="flex-row items-center gap-2 mt-2">
                <View
                  className={`w-2 h-2 rounded-full ${
                    step === 'current' ? 'bg-wallet-accent' : 'bg-wallet-card-light'
                  }`}
                />
                <View
                  className={`w-2 h-2 rounded-full ${
                    step === 'new' ? 'bg-wallet-accent' : 'bg-wallet-card-light'
                  }`}
                />
                <View
                  className={`w-2 h-2 rounded-full ${
                    step === 'confirm' ? 'bg-wallet-accent' : 'bg-wallet-card-light'
                  }`}
                />
              </View>
            )}
          </View>

          {/* PIN Input */}
          {!isProcessingState && (
            <View className="items-center gap-4">
              <PinInput length={activePin.length} hasError={hasError} />
              {errorMessage ? (
                <Text className="text-wallet-negative text-center px-8">
                  {errorMessage}
                </Text>
              ) : (
                <View className="h-5" />
              )}
            </View>
          )}

          {/* Processing/Verifying indicator */}
          {isProcessingState && (
            <View className="items-center gap-4">
              <View className="bg-wallet-card rounded-xl p-6">
                <ActivityIndicator size="large" color="#B8F25B" />
              </View>
              {hasError && errorMessage ? (
                <Text className="text-wallet-negative text-center px-8">
                  {errorMessage}
                </Text>
              ) : (
                <Text className="text-wallet-text-secondary text-center px-8">
                  {step === 'verifying'
                    ? 'Verifying your current PIN...'
                    : 'Please wait while we securely update your wallet...'}
                </Text>
              )}
            </View>
          )}

          {/* Keypad */}
          {!isProcessingState && (
            <PinKeypad
              onPress={handleDigitPress}
              onDelete={handleDelete}
            />
          )}

          {/* Spacer for processing state */}
          {isProcessingState && <View className="h-60" />}
        </View>
      </SafeAreaView>
    </Modal>
  );
}
