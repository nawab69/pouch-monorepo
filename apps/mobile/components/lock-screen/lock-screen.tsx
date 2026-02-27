import { useEffect, useState, useCallback } from 'react';
import { View, Text, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/hooks/use-auth';
import { PinInput } from './pin-input';
import { PinKeypad } from './pin-keypad';
import { BiometricButton } from './biometric-button';
import { PIN_LENGTH, MAX_FAILED_ATTEMPTS } from '@/constants/auth';

export function LockScreen() {
  const {
    isLocked,
    lockSettings,
    biometricType,
    hasBiometricHardware,
    failedAttempts,
    lockoutEndTime,
    authenticateWithBiometric,
    authenticateWithPin,
  } = useAuth();

  const [pin, setPin] = useState('');
  const [hasError, setHasError] = useState(false);
  const [lockoutRemaining, setLockoutRemaining] = useState(0);

  // Clear PIN when lock screen shows
  useEffect(() => {
    if (isLocked) {
      setPin('');
      setHasError(false);
    }
  }, [isLocked]);

  // Auto-trigger biometric on mount if enabled
  useEffect(() => {
    if (isLocked && lockSettings.useBiometric && hasBiometricHardware) {
      const timer = setTimeout(() => {
        handleBiometricAuth();
      }, 300);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLocked, lockSettings.useBiometric, hasBiometricHardware]);

  // Update lockout countdown
  useEffect(() => {
    if (!lockoutEndTime) {
      setLockoutRemaining(0);
      return;
    }

    const updateRemaining = () => {
      const remaining = Math.max(0, Math.ceil((lockoutEndTime - Date.now()) / 1000));
      setLockoutRemaining(remaining);
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [lockoutEndTime]);

  // Auto-submit when PIN is complete
  useEffect(() => {
    if (pin.length === PIN_LENGTH) {
      handlePinSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  const handlePinSubmit = async () => {
    if (lockoutRemaining > 0) return;

    const success = await authenticateWithPin(pin);

    if (!success) {
      setHasError(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Clear after shake animation
      setTimeout(() => {
        setPin('');
        setHasError(false);
      }, 500);
    }
  };

  const handleBiometricAuth = useCallback(async () => {
    await authenticateWithBiometric();
  }, [authenticateWithBiometric]);

  const handleDigitPress = (digit: string) => {
    if (pin.length < PIN_LENGTH && lockoutRemaining === 0) {
      setPin((prev) => prev + digit);
      setHasError(false);
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setHasError(false);
  };

  if (!isLocked) return null;

  const isLockedOut = lockoutRemaining > 0;
  const attemptsRemaining = MAX_FAILED_ATTEMPTS - (failedAttempts % MAX_FAILED_ATTEMPTS);
  const showAttemptsWarning = failedAttempts > 0 && !isLockedOut && attemptsRemaining <= 3;

  return (
    <SafeAreaView className="absolute inset-0 bg-wallet-bg z-50 items-center justify-between py-8">
      {/* Header */}
      <View className="items-center gap-4 mt-8">
        <Image
          source={
            Platform.OS === 'android'
              ? require('@/assets/images/android-icon-foreground.png')
              : require('@/assets/images/icon.png')
          }
          style={{ width: 64, height: 64 }}
          contentFit="contain"
        />
        <Text className="text-2xl font-bold text-wallet-text">Wallet Locked</Text>
      </View>

      {/* PIN Input */}
      <View className="items-center gap-6">
        <PinInput length={pin.length} hasError={hasError} />

        {isLockedOut ? (
          <Text className="text-wallet-negative text-center">
            Too many attempts. Try again in {lockoutRemaining}s
          </Text>
        ) : showAttemptsWarning ? (
          <Text className="text-wallet-text-secondary text-center">
            {attemptsRemaining} attempt{attemptsRemaining !== 1 ? 's' : ''} remaining
          </Text>
        ) : (
          <Text className="text-wallet-text-secondary text-center">
            Enter your PIN
          </Text>
        )}
      </View>

      {/* Keypad */}
      <View className="items-center gap-8">
        <PinKeypad
          onPress={handleDigitPress}
          onDelete={handleDelete}
          disabled={isLockedOut}
        />

        {/* Biometric button */}
        {lockSettings.useBiometric && hasBiometricHardware && !isLockedOut && (
          <BiometricButton
            type={biometricType}
            onPress={handleBiometricAuth}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
