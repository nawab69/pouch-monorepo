import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, Circle } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedProps,
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ILLUSTRATION_SIZE = SCREEN_WIDTH * 0.55;

const AnimatedPath = Animated.createAnimatedComponent(Path);

export function SuccessIllustration() {
  const checkProgress = useSharedValue(0);
  const circleScale = useSharedValue(0);
  const glowPulse = useSharedValue(0.3);
  const ringRotation = useSharedValue(0);

  useEffect(() => {
    // Circle scales in first
    circleScale.value = withDelay(
      200,
      withTiming(1, { duration: 500, easing: Easing.out(Easing.back(1.5)) })
    );

    // Then checkmark draws
    checkProgress.value = withDelay(
      600,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) })
    );

    // Then glow pulses
    glowPulse.value = withDelay(
      1000,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 1500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    // Ring rotates slowly
    ringRotation.value = withRepeat(
      withTiming(360, { duration: 20000, easing: Easing.linear }),
      -1,
      false
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: circleScale.value }],
    opacity: circleScale.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${ringRotation.value}deg` }],
  }));

  const checkAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: interpolate(checkProgress.value, [0, 1], [60, 0]),
  }));

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <Svg width={ILLUSTRATION_SIZE * 1.4} height={ILLUSTRATION_SIZE * 1.4}>
          <Defs>
            <RadialGradient id="successGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.45" />
              <Stop offset="50%" stopColor="#B8F25B" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={ILLUSTRATION_SIZE * 1.4} height={ILLUSTRATION_SIZE * 1.4} fill="url(#successGlow)" />
        </Svg>
      </Animated.View>

      {/* Rotating ring decoration */}
      <Animated.View style={[styles.ringContainer, ringStyle]}>
        <Svg width={ILLUSTRATION_SIZE * 1.2} height={ILLUSTRATION_SIZE * 1.2} viewBox="0 0 200 200">
          {/* Dashed ring */}
          <Circle
            cx="100"
            cy="100"
            r="90"
            stroke="#B8F25B"
            strokeWidth="1"
            strokeDasharray="4 8"
            fill="none"
            opacity="0.3"
          />
          {/* Accent dots on ring */}
          <Circle cx="100" cy="10" r="3" fill="#B8F25B" opacity="0.5" />
          <Circle cx="190" cy="100" r="3" fill="#B8F25B" opacity="0.5" />
          <Circle cx="100" cy="190" r="3" fill="#B8F25B" opacity="0.5" />
          <Circle cx="10" cy="100" r="3" fill="#B8F25B" opacity="0.5" />
        </Svg>
      </Animated.View>

      {/* Main checkmark circle */}
      <Animated.View style={[styles.illustrationContainer, circleStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} viewBox="0 0 200 200">
          {/* Circle background */}
          <Circle cx="100" cy="100" r="70" fill="#B8F25B" />

          {/* Inner subtle gradient */}
          <Defs>
            <RadialGradient id="innerShine" cx="35%" cy="35%" rx="60%" ry="60%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx="100" cy="100" r="68" fill="url(#innerShine)" />

          {/* Animated checkmark */}
          <AnimatedPath
            d="M70 100 L90 120 L130 75"
            stroke="#0D1411"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
            strokeDasharray="60"
            animatedProps={checkAnimatedProps}
          />
        </Svg>
      </Animated.View>

      {/* Celebration particles */}
      <View style={styles.particlesContainer}>
        <Svg width={ILLUSTRATION_SIZE * 1.3} height={ILLUSTRATION_SIZE * 1.3} viewBox="0 0 200 200">
          <Circle cx="30" cy="50" r="4" fill="#B8F25B" opacity="0.6" />
          <Circle cx="170" cy="45" r="3" fill="#B8F25B" opacity="0.5" />
          <Circle cx="25" cy="140" r="3" fill="#B8F25B" opacity="0.4" />
          <Circle cx="175" cy="150" r="4" fill="#B8F25B" opacity="0.55" />
          <Circle cx="50" cy="175" r="2.5" fill="#B8F25B" opacity="0.45" />
          <Circle cx="150" cy="25" r="2.5" fill="#B8F25B" opacity="0.5" />
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: ILLUSTRATION_SIZE * 1.4,
    height: ILLUSTRATION_SIZE * 1.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
  },
  ringContainer: {
    position: 'absolute',
  },
  illustrationContainer: {
    position: 'absolute',
  },
  particlesContainer: {
    position: 'absolute',
  },
});
