import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedProps,
  useSharedValue,
  withSpring,
  SharedValue,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import Svg, { Path, Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface OnboardingNavigationProps {
  currentPage: number;
  totalPages: number;
  scrollX: SharedValue<number>;
  screenWidth: number;
  onSkip: () => void;
  onNext: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const BUTTON_SIZE = 64;
const STROKE_WIDTH = 3;
const RADIUS = (BUTTON_SIZE + STROKE_WIDTH * 2 + 8) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ArrowIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 12H19M19 12L12 5M19 12L12 19"
        stroke="#0D1411"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function CheckIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13L9 17L19 7"
        stroke="#0D1411"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function OnboardingNavigation({
  currentPage,
  totalPages,
  scrollX,
  screenWidth,
  onSkip,
  onNext,
}: OnboardingNavigationProps) {
  const buttonScale = useSharedValue(1);
  const isLastPage = currentPage === totalPages - 1;

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  // Animated progress circle
  const animatedCircleProps = useAnimatedProps(() => {
    // Calculate progress based on scroll position (0 to totalPages-1 maps to 0 to 1)
    const progress = interpolate(
      scrollX.value,
      [0, (totalPages - 1) * screenWidth],
      [1 / totalPages, 1],
      Extrapolation.CLAMP
    );

    const strokeDashoffset = CIRCUMFERENCE * (1 - progress);

    return {
      strokeDashoffset,
    };
  });

  const ringSize = RADIUS * 2 + STROKE_WIDTH;

  return (
    <View style={styles.container}>
      {/* Skip button - hidden on last page */}
      <View style={styles.skipContainer}>
        {!isLastPage && (
          <Pressable onPress={onSkip} hitSlop={20}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Next/Complete button with progress ring */}
      <View style={styles.buttonWrapper}>
        {/* Progress ring */}
        <View style={[styles.progressRing, { width: ringSize, height: ringSize }]}>
          <Svg width={ringSize} height={ringSize}>
            {/* Background circle (track) */}
            <Circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={RADIUS}
              stroke="#2A332F"
              strokeWidth={STROKE_WIDTH}
              fill="none"
            />
            {/* Animated progress circle */}
            <AnimatedCircle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={RADIUS}
              stroke="#B8F25B"
              strokeWidth={STROKE_WIDTH}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              animatedProps={animatedCircleProps}
              rotation="-90"
              origin={`${ringSize / 2}, ${ringSize / 2}`}
            />
          </Svg>
        </View>

        {/* Button */}
        <AnimatedPressable
          onPress={onNext}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[styles.nextButton, buttonAnimatedStyle]}
        >
          {isLastPage ? <CheckIcon /> : <ArrowIcon />}
        </AnimatedPressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  skipContainer: {
    width: 60,
  },
  skipText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 16,
    color: '#8B9A92',
  },
  buttonWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRing: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButton: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: '#B8F25B',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
