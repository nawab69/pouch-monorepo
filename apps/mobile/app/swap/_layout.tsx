import { View, Pressable } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';

export default function SwapLayout() {
  const router = useRouter();
  const translateY = useSharedValue(0);

  const dismissModal = () => {
    router.back();
  };

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 100) {
        runOnJS(dismissModal)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View className="flex-1">
      {/* Blur background - tap to dismiss */}
      <Pressable onPress={dismissModal} className="absolute inset-0">
        <BlurView intensity={40} tint="dark" className="flex-1" />
      </Pressable>

      {/* Glass overlay */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          className="flex-1 mt-12 rounded-t-[32px] overflow-hidden border-t border-x border-white/10"
          style={[{ backgroundColor: 'rgba(13, 20, 17, 0.95)' }, animatedStyle]}
        >
          {/* Top handle bar */}
          <View className="items-center pt-3 pb-2">
            <View className="w-12 h-1.5 rounded-full bg-white/30" />
          </View>

          <Stack
            screenOptions={{
              headerShown: false,
              animation: 'slide_from_right',
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              contentStyle: { backgroundColor: 'transparent' },
            }}
          >
            <Stack.Screen name="index" options={{ animation: 'none' }} />
            <Stack.Screen
              name="success"
              options={{
                animation: 'fade',
                gestureEnabled: false,
              }}
            />
          </Stack>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
