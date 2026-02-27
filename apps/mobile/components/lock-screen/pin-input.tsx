import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { PIN_LENGTH } from '@/constants/auth';

interface PinInputProps {
  length: number;
  hasError?: boolean;
}

export function PinInput({ length, hasError = false }: PinInputProps) {
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (hasError) {
      // Shake animation on error
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasError]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="flex-row items-center justify-center gap-4"
    >
      {Array.from({ length: PIN_LENGTH }).map((_, index) => (
        <View
          key={index}
          className={`w-4 h-4 rounded-full ${
            index < length
              ? hasError
                ? 'bg-wallet-negative'
                : 'bg-wallet-accent'
              : 'bg-wallet-card-light'
          }`}
        />
      ))}
    </Animated.View>
  );
}
