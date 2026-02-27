import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ILLUSTRATION_SIZE = SCREEN_WIDTH * 0.7;

export function PortfolioIllustration() {
  const floatY = useSharedValue(0);
  const glowPulse = useSharedValue(0.6);
  const bar1Height = useSharedValue(0);
  const bar2Height = useSharedValue(0);
  const bar3Height = useSharedValue(0);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(6, { duration: 2200, easing: Easing.inOut(Easing.ease) })
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

    // Animate bars
    bar1Height.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1000, easing: Easing.out(Easing.ease) }),
          withTiming(0.7, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    bar2Height.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1200, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 1300, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    bar3Height.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1100, easing: Easing.out(Easing.ease) }),
          withTiming(0.8, { duration: 1400, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
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
            <RadialGradient id="portfolioGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.25" />
              <Stop offset="50%" stopColor="#B8F25B" stopOpacity="0.08" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} fill="url(#portfolioGlow)" />
        </Svg>
      </Animated.View>

      {/* Floating illustration */}
      <Animated.View style={[styles.illustrationContainer, floatStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} viewBox="0 0 200 200">
          <Defs>
            <RadialGradient id="chartGlow" cx="50%" cy="50%" rx="45%" ry="45%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Background glow circle */}
          <Circle cx="100" cy="100" r="75" fill="url(#chartGlow)" />

          {/* Pie chart */}
          <G transform="translate(100, 100)">
            {/* BTC segment (orange) */}
            <Path
              d="M0 -50 A50 50 0 0 1 43.3 25 L0 0 Z"
              fill="#F7931A"
            />
            {/* ETH segment (blue) */}
            <Path
              d="M43.3 25 A50 50 0 0 1 -25 43.3 L0 0 Z"
              fill="#627EEA"
            />
            {/* Accent segment (green) */}
            <Path
              d="M-25 43.3 A50 50 0 0 1 -50 0 L0 0 Z"
              fill="#B8F25B"
            />
            {/* Other segment (gray) */}
            <Path
              d="M-50 0 A50 50 0 0 1 0 -50 L0 0 Z"
              fill="#2A332F"
            />

            {/* Inner circle for donut effect */}
            <Circle cx="0" cy="0" r="28" fill="#0D1411" />
          </G>

          {/* Bar chart overlay */}
          <G transform="translate(130, 140)">
            <Rect x="0" y="25" width="12" height="25" rx="3" fill="#B8F25B" opacity="0.9" />
            <Rect x="18" y="10" width="12" height="40" rx="3" fill="#B8F25B" opacity="0.7" />
            <Rect x="36" y="18" width="12" height="32" rx="3" fill="#B8F25B" opacity="0.8" />
          </G>

          {/* Floating coin circles */}
          <G>
            {/* BTC coin */}
            <Circle cx="45" cy="55" r="16" fill="#F7931A" opacity="0.9" />
            <Path
              d="M45 47 L45 63 M41 49 L49 49 M41 55 L49 55 M41 61 L49 61"
              stroke="#0D1411"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {/* ETH coin */}
            <Circle cx="160" cy="75" r="14" fill="#627EEA" opacity="0.9" />
            <Path
              d="M160 66 L166 75 L160 79 L154 75 Z"
              fill="#0D1411"
              opacity="0.6"
            />
            <Path
              d="M160 79 L166 75 L160 84 L154 75 Z"
              fill="#0D1411"
              opacity="0.4"
            />
          </G>

          {/* Decorative elements */}
          <Circle cx="35" cy="145" r="3" fill="#B8F25B" opacity="0.4" />
          <Circle cx="170" cy="130" r="2" fill="#B8F25B" opacity="0.3" />
          <Circle cx="55" cy="165" r="2" fill="#F7931A" opacity="0.4" />
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
