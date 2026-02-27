import { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Stop, Rect, Path, G } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

export function SplashScreen({ onAnimationComplete }: SplashScreenProps) {
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.8);
  const glowOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    // Start animations
    logoOpacity.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    logoScale.value = withTiming(1, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });

    glowOpacity.value = withSequence(
      withTiming(1, { duration: 400 }),
      withDelay(
        800,
        withTiming(0.6, { duration: 300 })
      )
    );

    // Fade out after hold period
    containerOpacity.value = withDelay(
      1500,
      withTiming(0, {
        duration: 300,
        easing: Easing.in(Easing.cubic),
      }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle]}>
      {/* Radial glow effect - top left like home screen */}
      <Animated.View style={[styles.glowContainer, glowAnimatedStyle]}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <RadialGradient
              id="splashGlow"
              cx="20%"
              cy="30%"
              rx="60%"
              ry="50%"
            >
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.25" />
              <Stop offset="40%" stopColor="#B8F25B" stopOpacity="0.1" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#splashGlow)" />
        </Svg>
      </Animated.View>

      {/* Logo container */}
      <Animated.View style={[styles.logoContainer, logoAnimatedStyle]}>
        {/* Wallet Icon */}
        <View style={styles.iconContainer}>
          <Svg width={80} height={80} viewBox="0 0 24 24" fill="none">
            <G>
              {/* Wallet body */}
              <Path
                d="M19 7V5.5C19 4.12 17.88 3 16.5 3H5.5C4.12 3 3 4.12 3 5.5V18.5C3 19.88 4.12 21 5.5 21H18.5C19.88 21 21 19.88 21 18.5V9C21 7.9 20.1 7 19 7ZM5.5 5H16.5C16.78 5 17 5.22 17 5.5V7H5.5C5.22 7 5 6.78 5 6.5V5.5C5 5.22 5.22 5 5.5 5ZM19 18.5C19 18.78 18.78 19 18.5 19H5.5C5.22 19 5 18.78 5 18.5V8.91C5.16 8.97 5.33 9 5.5 9H19V18.5Z"
                fill="#B8F25B"
              />
              {/* Card slot detail */}
              <Path
                d="M16 14C16.5523 14 17 13.5523 17 13C17 12.4477 16.5523 12 16 12C15.4477 12 15 12.4477 15 13C15 13.5523 15.4477 14 16 14Z"
                fill="#B8F25B"
              />
            </G>
          </Svg>
        </View>

        {/* App name */}
        <Text style={styles.appName}>Pouch</Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D1411',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  glowContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: 'rgba(184, 242, 91, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
});
