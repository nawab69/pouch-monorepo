import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface WalletChoiceCardProps {
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  variant: 'primary' | 'secondary';
  onPress: () => void;
}

export function WalletChoiceCard({
  title,
  description,
  icon,
  variant,
  onPress,
}: WalletChoiceCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 15, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  };

  const isPrimary = variant === 'primary';

  return (
    <AnimatedPressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[
        styles.card,
        isPrimary ? styles.cardPrimary : styles.cardSecondary,
        animatedStyle,
      ]}
    >
      <View style={[styles.iconContainer, isPrimary ? styles.iconPrimary : styles.iconSecondary]}>
        <Feather
          name={icon}
          size={24}
          color={isPrimary ? '#0D1411' : '#B8F25B'}
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, isPrimary ? styles.titlePrimary : styles.titleSecondary]}>
          {title}
        </Text>
        <Text style={[styles.description, isPrimary ? styles.descriptionPrimary : styles.descriptionSecondary]}>
          {description}
        </Text>
      </View>
      <Feather
        name="chevron-right"
        size={20}
        color={isPrimary ? '#0D1411' : '#8B9A92'}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 20,
    gap: 16,
  },
  cardPrimary: {
    backgroundColor: '#B8F25B',
  },
  cardSecondary: {
    backgroundColor: '#1A1F1D',
    borderWidth: 1,
    borderColor: '#2A332F',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconPrimary: {
    backgroundColor: 'rgba(13, 20, 17, 0.15)',
  },
  iconSecondary: {
    backgroundColor: 'rgba(184, 242, 91, 0.1)',
  },
  textContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 18,
  },
  titlePrimary: {
    color: '#0D1411',
  },
  titleSecondary: {
    color: '#FFFFFF',
  },
  description: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
  },
  descriptionPrimary: {
    color: 'rgba(13, 20, 17, 0.7)',
  },
  descriptionSecondary: {
    color: '#8B9A92',
  },
});
