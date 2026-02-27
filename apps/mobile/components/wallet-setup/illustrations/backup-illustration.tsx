import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G, Circle, Line } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ILLUSTRATION_SIZE = SCREEN_WIDTH * 0.6;

export function BackupIllustration() {
  const floatY = useSharedValue(0);
  const glowPulse = useSharedValue(0.5);
  const lockPulse = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-8, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(8, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(0.9, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    lockPulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) })
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
            <RadialGradient id="backupGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.3" />
              <Stop offset="60%" stopColor="#B8F25B" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} fill="url(#backupGlow)" />
        </Svg>
      </Animated.View>

      {/* Notepad with lock */}
      <Animated.View style={[styles.illustrationContainer, floatStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="noteGlow" cx="50%" cy="40%" rx="55%" ry="55%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Background circle */}
          <Circle cx="100" cy="100" r="70" fill="url(#noteGlow)" />

          {/* Notepad */}
          <G transform="translate(50, 40)">
            {/* Notepad body */}
            <Path
              d="M10 0 L90 0 C95.523 0 100 4.477 100 10 L100 120 C100 125.523 95.523 130 90 130 L10 130 C4.477 130 0 125.523 0 120 L0 10 C0 4.477 4.477 0 10 0 Z"
              fill="#1A1F1D"
              stroke="#2A332F"
              strokeWidth="2"
            />

            {/* Notepad top bar */}
            <Rect x="0" y="0" width="100" height="20" rx="10" fill="#222A26" />

            {/* Spiral binding holes */}
            <Circle cx="20" cy="10" r="3" fill="#0D1411" />
            <Circle cx="40" cy="10" r="3" fill="#0D1411" />
            <Circle cx="60" cy="10" r="3" fill="#0D1411" />
            <Circle cx="80" cy="10" r="3" fill="#0D1411" />

            {/* Lines on notepad */}
            <Line x1="15" y1="40" x2="85" y2="40" stroke="#2A332F" strokeWidth="1.5" />
            <Line x1="15" y1="55" x2="85" y2="55" stroke="#2A332F" strokeWidth="1.5" />
            <Line x1="15" y1="70" x2="85" y2="70" stroke="#2A332F" strokeWidth="1.5" />
            <Line x1="15" y1="85" x2="60" y2="85" stroke="#2A332F" strokeWidth="1.5" />

            {/* Check marks */}
            <Path d="M18 38 L22 42 L28 34" stroke="#B8F25B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d="M18 53 L22 57 L28 49" stroke="#B8F25B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <Path d="M18 68 L22 72 L28 64" stroke="#B8F25B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          </G>

          {/* Lock overlay */}
          <G transform="translate(115, 110)">
            {/* Lock body */}
            <Rect x="10" y="25" width="40" height="35" rx="6" fill="#B8F25B" />
            {/* Lock shackle */}
            <Path
              d="M18 25 L18 18 C18 10.268 24.268 4 32 4 L28 4 C35.732 4 42 10.268 42 18 L42 25"
              stroke="#B8F25B"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
            />
            {/* Keyhole */}
            <Circle cx="30" cy="40" r="5" fill="#0D1411" />
            <Rect x="28" y="40" width="4" height="10" rx="2" fill="#0D1411" />
          </G>

          {/* Decorative dots */}
          <Circle cx="40" cy="65" r="2.5" fill="#B8F25B" opacity="0.35" />
          <Circle cx="165" cy="55" r="2" fill="#B8F25B" opacity="0.3" />
          <Circle cx="35" cy="150" r="2" fill="#B8F25B" opacity="0.25" />
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
