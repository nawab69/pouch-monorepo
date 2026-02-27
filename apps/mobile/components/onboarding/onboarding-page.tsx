import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  SharedValue,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingPageProps {
  index: number;
  scrollX: SharedValue<number>;
  title: string;
  accentWord: string;
  description: string;
  illustration: React.ReactNode;
}

export function OnboardingPage({
  index,
  scrollX,
  title,
  accentWord,
  description,
  illustration,
}: OnboardingPageProps) {
  const inputRange = [
    (index - 1) * SCREEN_WIDTH,
    index * SCREEN_WIDTH,
    (index + 1) * SCREEN_WIDTH,
  ];

  const illustrationStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollX.value,
      inputRange,
      [0.8, 1, 0.8],
      Extrapolation.CLAMP
    );

    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.3, 1, 0.3],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, 50],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale }, { translateY }],
      opacity,
    };
  });

  const textStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0, 1, 0],
      Extrapolation.CLAMP
    );

    const translateX = interpolate(
      scrollX.value,
      inputRange,
      [50, 0, -50],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateX }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Illustration area - top 55% */}
      <View style={styles.illustrationArea}>
        <Animated.View style={[styles.illustrationWrapper, illustrationStyle]}>
          {illustration}
        </Animated.View>
      </View>

      {/* Text content area - bottom 45% */}
      <Animated.View style={[styles.textArea, textStyle]}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.accentWord}>{accentWord}</Text>
        </View>
        <Text style={styles.description}>{description}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    flex: 1,
  },
  illustrationArea: {
    flex: 0.55,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  illustrationWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  textArea: {
    flex: 0.45,
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 44,
    color: '#FFFFFF',
    lineHeight: 52,
    letterSpacing: -0.5,
  },
  accentWord: {
    fontFamily: 'PlayfairDisplay_700Bold_Italic',
    fontSize: 48,
    color: '#B8F25B',
    lineHeight: 56,
    letterSpacing: 0,
    fontStyle: 'italic',
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 17,
    color: '#8B9A92',
    lineHeight: 26,
    maxWidth: 320,
    letterSpacing: 0.2,
  },
});
