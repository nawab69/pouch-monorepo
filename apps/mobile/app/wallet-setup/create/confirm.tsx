import { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { ProgressSteps } from '@/components/wallet-setup/progress-steps';
import { useMnemonic } from '@/hooks/use-mnemonic';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface WordOption {
  word: string;
  isCorrect: boolean;
}

interface OptionButtonProps {
  option: WordOption;
  index: number;
  isSelected: boolean;
  isCorrect: boolean | null;
  onPress: (index: number) => void;
  disabled: boolean;
  scale: SharedValue<number>;
}

function OptionButton({ option, index, isSelected, isCorrect, onPress, disabled, scale }: OptionButtonProps) {
  const showCorrect = isSelected && isCorrect === true;
  const showWrong = isSelected && isCorrect === false;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => onPress(index)}
      onPressIn={() => { scale.value = withSpring(0.97); }}
      onPressOut={() => { scale.value = withSpring(1); }}
      style={[
        styles.optionButton,
        showCorrect && styles.optionCorrect,
        showWrong && styles.optionWrong,
        animatedStyle,
      ]}
      disabled={disabled}
    >
      <Text
        style={[
          styles.optionText,
          showCorrect && styles.optionTextCorrect,
          showWrong && styles.optionTextWrong,
        ]}
      >
        {option.word}
      </Text>
      {showCorrect && <Feather name="check" size={20} color="#0D1411" />}
      {showWrong && <Feather name="x" size={20} color="#FFFFFF" />}
    </AnimatedPressable>
  );
}

export default function ConfirmMnemonicScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mnemonic: string }>();
  const { getRandomWords } = useMnemonic();

  const mnemonic = useMemo(() => params.mnemonic?.split(',') || [], [params.mnemonic]);

  // Generate 3 random positions to verify
  const [verifyPositions, setVerifyPositions] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [wordOptions, setWordOptions] = useState<WordOption[]>([]);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  const shakeX = useSharedValue(0);
  const optionScale0 = useSharedValue(1);
  const optionScale1 = useSharedValue(1);
  const optionScale2 = useSharedValue(1);
  const optionScale3 = useSharedValue(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const optionScales = useMemo(() => [optionScale0, optionScale1, optionScale2, optionScale3], []);

  const generateRandomPositions = useCallback((max: number, count: number): number[] => {
    const positions: number[] = [];
    while (positions.length < count) {
      const pos = Math.floor(Math.random() * max);
      if (!positions.includes(pos)) {
        positions.push(pos);
      }
    }
    return positions.sort((a, b) => a - b);
  }, []);

  // Initialize verification positions
  useEffect(() => {
    if (mnemonic.length > 0) {
      const positions = generateRandomPositions(mnemonic.length, 3);
      setVerifyPositions(positions);
    }
  }, [mnemonic, generateRandomPositions]);

  // Generate word options for current question
  useEffect(() => {
    if (verifyPositions.length > 0 && mnemonic.length > 0) {
      const currentPosition = verifyPositions[currentQuestionIndex];
      const correctWord = mnemonic[currentPosition];
      const wrongWords = getRandomWords(3, [correctWord]);

      const options: WordOption[] = [
        { word: correctWord, isCorrect: true },
        ...wrongWords.map(word => ({ word, isCorrect: false })),
      ].sort(() => Math.random() - 0.5);

      setWordOptions(options);
      setSelectedOption(null);
      setIsCorrect(null);
    }
  }, [verifyPositions, currentQuestionIndex, mnemonic, getRandomWords]);

  const handleOptionPress = useCallback((index: number) => {
    if (selectedOption !== null) return;

    setSelectedOption(index);
    optionScales[index].value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 })
    );

    const option = wordOptions[index];
    setIsCorrect(option.isCorrect);

    if (option.isCorrect) {
      // Correct answer - proceed after brief delay
      setTimeout(() => {
        if (currentQuestionIndex < 2) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // All questions answered correctly
          router.replace({
            pathname: '/wallet-setup/create/pin',
            params: { mnemonic: params.mnemonic },
          });
        }
      }, 600);
    } else {
      // Wrong answer - shake and retry
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );

      setTimeout(() => {
        setSelectedOption(null);
        setIsCorrect(null);
      }, 800);
    }
  }, [selectedOption, wordOptions, currentQuestionIndex, router, params.mnemonic, shakeX, optionScales]);

  const handleBack = () => {
    router.back();
  };

  const currentPosition = verifyPositions[currentQuestionIndex];

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#FFFFFF" />
        </Pressable>
        <ProgressSteps currentStep={3} totalSteps={3} />
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, containerStyle]}>
        <Text style={styles.title}>Verify Your Phrase</Text>
        <Text style={styles.subtitle}>
          {"Let's make sure you've written down your recovery phrase correctly."}
        </Text>

        {/* Progress indicator */}
        <View style={styles.progressContainer}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.progressDot,
                i < currentQuestionIndex && styles.progressDotComplete,
                i === currentQuestionIndex && styles.progressDotActive,
              ]}
            >
              {i < currentQuestionIndex && (
                <Feather name="check" size={12} color="#0D1411" />
              )}
            </View>
          ))}
        </View>

        {/* Question */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionNumber}>Question {currentQuestionIndex + 1} of 3</Text>
          <Text style={styles.questionText}>
            What is word <Text style={styles.wordNumber}>#{currentPosition + 1}</Text>?
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {wordOptions.map((option, index) => (
            <OptionButton
              key={`${currentQuestionIndex}-${index}`}
              option={option}
              index={index}
              isSelected={selectedOption === index}
              isCorrect={isCorrect}
              onPress={handleOptionPress}
              disabled={selectedOption !== null}
              scale={optionScales[index]}
            />
          ))}
        </View>

        {/* Feedback */}
        {isCorrect === false && (
          <View style={styles.feedbackContainer}>
            <Feather name="alert-circle" size={16} color="#EF4444" />
            <Text style={styles.feedbackText}>Incorrect. Please try again.</Text>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1411',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1A1F1D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  title: {
    fontFamily: 'Outfit_700Bold',
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 15,
    color: '#8B9A92',
    lineHeight: 22,
    marginBottom: 32,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 40,
  },
  progressDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1A1F1D',
    borderWidth: 2,
    borderColor: '#2A332F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    borderColor: '#B8F25B',
  },
  progressDotComplete: {
    backgroundColor: '#B8F25B',
    borderColor: '#B8F25B',
  },
  questionContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  questionNumber: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#8B9A92',
    marginBottom: 8,
  },
  questionText: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 22,
    color: '#FFFFFF',
  },
  wordNumber: {
    color: '#B8F25B',
  },
  optionsContainer: {
    gap: 12,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1A1F1D',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2A332F',
  },
  optionCorrect: {
    backgroundColor: '#B8F25B',
    borderColor: '#B8F25B',
  },
  optionWrong: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  optionText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 17,
    color: '#FFFFFF',
  },
  optionTextCorrect: {
    color: '#0D1411',
  },
  optionTextWrong: {
    color: '#FFFFFF',
  },
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
  feedbackText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    color: '#EF4444',
  },
});
