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
const ILLUSTRATION_SIZE = SCREEN_WIDTH * 0.65;

export function WalletCreateIllustration() {
  const floatY = useSharedValue(0);
  const glowPulse = useSharedValue(0.5);
  const plusRotate = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    glowPulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.5, { duration: 2000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    plusRotate.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
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
            <RadialGradient id="createGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.35" />
              <Stop offset="50%" stopColor="#B8F25B" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} fill="url(#createGlow)" />
        </Svg>
      </Animated.View>

      {/* Floating wallet with plus */}
      <Animated.View style={[styles.illustrationContainer, floatStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="innerGlow" cx="50%" cy="40%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.12" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Background circle */}
          <Circle cx="100" cy="100" r="75" fill="url(#innerGlow)" />

          {/* Wallet body */}
          <G transform="translate(45, 55)">
            {/* Main wallet shape */}
            <Path
              d="M0 18 C0 8.059 8.059 0 18 0 L92 0 C101.941 0 110 8.059 110 18 L110 72 C110 81.941 101.941 90 92 90 L18 90 C8.059 90 0 81.941 0 72 Z"
              fill="#1A1F1D"
              stroke="#2A332F"
              strokeWidth="2"
            />

            {/* Wallet flap */}
            <Path
              d="M0 22 L0 14 C0 6.268 6.268 0 14 0 L96 0 C103.732 0 110 6.268 110 14 L110 22 L0 22 Z"
              fill="#222A26"
              stroke="#2A332F"
              strokeWidth="2"
            />

            {/* Card slot accent */}
            <Path
              d="M75 48 L102 48 C106.418 48 110 51.582 110 56 L110 62 C110 66.418 106.418 70 102 70 L75 70 C70.582 70 67 66.418 67 62 L67 56 C67 51.582 70.582 48 75 48 Z"
              fill="#0D1411"
            />
            <Circle cx="88" cy="59" r="5" fill="#B8F25B" />
          </G>

          {/* Plus icon in circle */}
          <G transform="translate(125, 30)">
            <Circle cx="30" cy="30" r="28" fill="#B8F25B" />
            <Path
              d="M30 18 L30 42 M18 30 L42 30"
              stroke="#0D1411"
              strokeWidth="4"
              strokeLinecap="round"
            />
          </G>

          {/* Decorative particles */}
          <Circle cx="35" cy="55" r="3" fill="#B8F25B" opacity="0.4" />
          <Circle cx="170" cy="145" r="2.5" fill="#B8F25B" opacity="0.35" />
          <Circle cx="40" cy="155" r="2" fill="#B8F25B" opacity="0.3" />
          <Circle cx="165" cy="75" r="2" fill="#B8F25B" opacity="0.25" />
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
