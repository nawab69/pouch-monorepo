import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ILLUSTRATION_SIZE = SCREEN_WIDTH * 0.7;

export function WalletIllustration() {
  const floatY = useSharedValue(0);
  const glowPulse = useSharedValue(0.6);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 1500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatY.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE}>
          <Defs>
            <RadialGradient id="walletGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.3" />
              <Stop offset="50%" stopColor="#B8F25B" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} fill="url(#walletGlow)" />
        </Svg>
      </Animated.View>

      {/* Floating wallet */}
      <Animated.View style={[styles.illustrationContainer, floatStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="innerGlow" cx="50%" cy="40%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Background circle */}
          <Circle cx="100" cy="100" r="80" fill="url(#innerGlow)" />

          {/* Wallet body */}
          <G transform="translate(50, 55)">
            {/* Main wallet shape */}
            <Path
              d="M0 20 C0 8.954 8.954 0 20 0 L80 0 C91.046 0 100 8.954 100 20 L100 70 C100 81.046 91.046 90 80 90 L20 90 C8.954 90 0 81.046 0 70 Z"
              fill="#1A1F1D"
              stroke="#2A332F"
              strokeWidth="2"
            />

            {/* Wallet flap */}
            <Path
              d="M0 25 L0 15 C0 6.716 6.716 0 15 0 L85 0 C93.284 0 100 6.716 100 15 L100 25 L0 25 Z"
              fill="#222A26"
              stroke="#2A332F"
              strokeWidth="2"
            />

            {/* Card slot */}
            <Path
              d="M70 50 L95 50 C97.761 50 100 52.239 100 55 L100 60 C100 62.761 97.761 65 95 65 L70 65 C67.239 65 65 62.761 65 60 L65 55 C65 52.239 67.239 50 70 50 Z"
              fill="#0D1411"
            />

            {/* Card indicator */}
            <Circle cx="82" cy="57.5" r="4" fill="#B8F25B" />
          </G>

          {/* Shield overlay */}
          <G transform="translate(115, 85)">
            <Path
              d="M30 5 C30 5 50 0 50 0 C50 0 70 5 70 5 L70 35 C70 50 50 60 50 60 C50 60 30 50 30 35 Z"
              fill="#B8F25B"
              opacity="0.9"
            />
            {/* Checkmark on shield */}
            <Path
              d="M42 30 L48 36 L60 22"
              stroke="#0D1411"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </G>

          {/* Decorative dots */}
          <Circle cx="40" cy="60" r="3" fill="#B8F25B" opacity="0.3" />
          <Circle cx="165" cy="140" r="2" fill="#B8F25B" opacity="0.4" />
          <Circle cx="35" cy="150" r="2.5" fill="#B8F25B" opacity="0.25" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ILLUSTRATION_SIZE,
    height: ILLUSTRATION_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
  },
  illustrationContainer: {
    position: 'absolute',
  },
});
