import { View, Text, StyleSheet } from 'react-native';

interface ProgressStepsProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressSteps({ currentStep, totalSteps }: ProgressStepsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={styles.dotsContainer}>
        {Array.from({ length: totalSteps }, (_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i + 1 <= currentStep ? styles.dotActive : styles.dotInactive,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 14,
    color: '#8B9A92',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    backgroundColor: '#B8F25B',
  },
  dotInactive: {
    backgroundColor: '#2A332F',
  },
});
