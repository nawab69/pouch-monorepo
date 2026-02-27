import { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, RadialGradient, LinearGradient, Stop, Rect, Path, G, Circle } from 'react-native-svg';
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

export function RocketIllustration() {
  const floatY = useSharedValue(0);
  const floatRotate = useSharedValue(0);
  const glowPulse = useSharedValue(0.6);
  const flamePulse = useSharedValue(1);

  useEffect(() => {
    floatY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(10, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    floatRotate.value = withRepeat(
      withSequence(
        withTiming(-3, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(3, { duration: 2500, easing: Easing.inOut(Easing.ease) })
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

    flamePulse.value = withRepeat(
      withSequence(
        withTiming(1.15, { duration: 150, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.9, { duration: 150, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: floatY.value },
      { rotate: `${floatRotate.value}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowPulse.value,
  }));

  const flameStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: flamePulse.value }],
  }));

  return (
    <View style={styles.container}>
      {/* Background glow */}
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE}>
          <Defs>
            <RadialGradient id="rocketGlow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.3" />
              <Stop offset="50%" stopColor="#B8F25B" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} fill="url(#rocketGlow)" />
        </Svg>
      </Animated.View>

      {/* Floating rocket */}
      <Animated.View style={[styles.illustrationContainer, floatStyle]}>
        <Svg width={ILLUSTRATION_SIZE} height={ILLUSTRATION_SIZE} viewBox="0 0 200 200">
          <Defs>
            <LinearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <Stop offset="0%" stopColor="#F7931A" />
              <Stop offset="50%" stopColor="#FF6B35" />
              <Stop offset="100%" stopColor="#FF4444" stopOpacity="0.5" />
            </LinearGradient>
            <RadialGradient id="innerGlow" cx="50%" cy="40%" rx="50%" ry="50%">
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.15" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Background glow circle */}
          <Circle cx="100" cy="100" r="75" fill="url(#innerGlow)" />

          {/* Star dots scattered around */}
          <G>
            <Circle cx="35" cy="45" r="2" fill="#B8F25B" opacity="0.6" />
            <Circle cx="165" cy="55" r="1.5" fill="#B8F25B" opacity="0.5" />
            <Circle cx="45" cy="160" r="2" fill="#B8F25B" opacity="0.4" />
            <Circle cx="155" cy="150" r="1.5" fill="#B8F25B" opacity="0.5" />
            <Circle cx="60" cy="70" r="1" fill="#FFFFFF" opacity="0.4" />
            <Circle cx="145" cy="85" r="1" fill="#FFFFFF" opacity="0.3" />
            <Circle cx="55" cy="130" r="1.5" fill="#FFFFFF" opacity="0.3" />
            <Circle cx="150" cy="120" r="1" fill="#FFFFFF" opacity="0.4" />
          </G>

          {/* Rocket body */}
          <G transform="translate(70, 40)">
            {/* Main body */}
            <Path
              d="M30 0 C30 0 15 20 15 40 L15 90 C15 95 18 100 30 100 C42 100 45 95 45 90 L45 40 C45 20 30 0 30 0 Z"
              fill="#1A1F1D"
              stroke="#2A332F"
              strokeWidth="2"
            />

            {/* Window */}
            <Circle cx="30" cy="40" r="12" fill="#0D1411" stroke="#2A332F" strokeWidth="2" />
            <Circle cx="30" cy="40" r="8" fill="#1A1F1D" />
            <Circle cx="27" cy="37" r="3" fill="#FFFFFF" opacity="0.3" />

            {/* Body stripe */}
            <Rect x="20" y="60" width="20" height="4" rx="2" fill="#B8F25B" opacity="0.8" />

            {/* Left fin */}
            <Path
              d="M15 75 L0 100 L15 95 Z"
              fill="#B8F25B"
            />

            {/* Right fin */}
            <Path
              d="M45 75 L60 100 L45 95 Z"
              fill="#B8F25B"
            />

            {/* Bottom fin */}
            <Path
              d="M22 95 L22 105 L30 100 L38 105 L38 95"
              fill="#2A332F"
            />
          </G>

          {/* Flame - animated */}
          <G transform="translate(85, 140)">
            <Animated.View style={flameStyle}>
              <Svg width={30} height={50} viewBox="0 0 30 50">
                <Path
                  d="M15 0 C15 0 25 15 25 25 C25 35 20 45 15 50 C10 45 5 35 5 25 C5 15 15 0 15 0 Z"
                  fill="url(#flameGradient)"
                />
                <Path
                  d="M15 10 C15 10 20 18 20 24 C20 30 18 36 15 40 C12 36 10 30 10 24 C10 18 15 10 15 10 Z"
                  fill="#FFCC00"
                  opacity="0.8"
                />
              </Svg>
            </Animated.View>
          </G>

          {/* Particle trail effects */}
          <G opacity="0.6">
            <Circle cx="95" cy="175" r="3" fill="#F7931A" opacity="0.5" />
            <Circle cx="105" cy="180" r="2" fill="#FF6B35" opacity="0.4" />
            <Circle cx="90" cy="185" r="2.5" fill="#F7931A" opacity="0.3" />
            <Circle cx="110" cy="188" r="1.5" fill="#FF6B35" opacity="0.3" />
          </G>
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
