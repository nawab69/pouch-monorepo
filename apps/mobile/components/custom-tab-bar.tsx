import Feather from '@expo/vector-icons/Feather';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const TAB_ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  index: 'home',
  portfolio: 'pie-chart',
  swap: 'repeat',
  settings: 'settings',
};

export function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const bottomOffset = 6;
  const [containerWidth, setContainerWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);

  // Delay rendering to prevent blank screen issues
  useEffect(() => {
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const tabCount = state.routes.length;
  const tabWidth = containerWidth / tabCount;
  const indicatorPosition = useSharedValue(0);
  const indicatorScale = useSharedValue(1);
  const isDragging = useSharedValue(false);

  const navigateToTab = (index: number) => {
    const route = state.routes[index];
    if (route && index !== state.index) {
      navigation.navigate(route.name, route.params);
    }
  };

  useEffect(() => {
    if (containerWidth > 0) {
      // Cancel any ongoing animations to prevent stuck states
      cancelAnimation(indicatorPosition);
      cancelAnimation(indicatorScale);

      // Reset dragging state when tab changes via press (not drag)
      isDragging.value = false;

      // Reset scale to normal
      indicatorScale.value = withSpring(1, { damping: 15, stiffness: 200 });

      // Animate to new position
      indicatorPosition.value = withSpring(state.index * tabWidth, {
        damping: 15,
        stiffness: 150,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index, tabWidth, containerWidth]);

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(150)
    .onStart(() => {
      isDragging.value = true;
      indicatorScale.value = withSpring(1.2, { damping: 12, stiffness: 180 });
    })
    .onUpdate((event) => {
      const newPosition = state.index * tabWidth + event.translationX;
      const clampedPosition = Math.max(0, Math.min(newPosition, (tabCount - 1) * tabWidth));
      indicatorPosition.value = clampedPosition;
    })
    .onEnd(() => {
      isDragging.value = false;
      indicatorScale.value = withSpring(1, { damping: 15, stiffness: 200 });

      const targetIndex = Math.round(indicatorPosition.value / tabWidth);
      const clampedIndex = Math.max(0, Math.min(targetIndex, tabCount - 1));

      indicatorPosition.value = withSpring(clampedIndex * tabWidth, {
        damping: 15,
        stiffness: 150,
      });

      runOnJS(navigateToTab)(clampedIndex);
    });

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: indicatorPosition.value },
      { scale: indicatorScale.value },
    ],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width);
  };

  // Don't render BlurView until ready to prevent blank screens
  if (!isReady) {
    return (
      <View className="absolute left-5 right-5" style={{ bottom: bottomOffset }}>
        <View style={[styles.outerContainer, { backgroundColor: 'rgba(20, 25, 22, 0.9)' }]} onLayout={handleLayout}>
          <View style={{ paddingVertical: 12 }}>
            <View className="flex-row items-center justify-around py-3">
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;
                const iconName = TAB_ICONS[route.name] || 'circle';
                return (
                  <View key={route.key} className="items-center justify-center w-14 h-14">
                    <Feather name={iconName} size={24} color={isFocused ? '#B8F25B' : '#5C6660'} />
                  </View>
                );
              })}
            </View>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View className="absolute left-5 right-5" style={{ bottom: bottomOffset }}>
      {/* Liquid Glass Container with Blur */}
      <View style={styles.outerContainer} onLayout={handleLayout}>
        <BlurView intensity={40} tint="dark" style={styles.blurView}>
          {/* Dark overlay for better contrast */}
          <View style={styles.darkOverlay} />

          {/* Top highlight edge - liquid glass effect */}
          <LinearGradient
            colors={[
              'rgba(255,255,255,0.18)',
              'rgba(255,255,255,0.06)',
              'transparent',
            ]}
            style={styles.topHighlight}
          />

          {/* Animated sliding indicator */}
          {containerWidth > 0 && (
            <Animated.View
              style={[
                styles.indicator,
                { width: tabWidth },
                indicatorStyle,
              ]}
            >
              <LinearGradient
                colors={[
                  'rgba(184, 242, 91, 0.15)',
                  'rgba(184, 242, 91, 0.08)',
                  'rgba(184, 242, 91, 0.03)',
                ]}
                style={styles.indicatorGradient}
              />
            </Animated.View>
          )}

          {/* Inner content with gesture */}
          <GestureDetector gesture={panGesture}>
            <Animated.View className="flex-row items-center justify-around py-3">
              {state.routes.map((route, index) => {
                const isFocused = state.index === index;

                const onPress = () => {
                  const event = navigation.emit({
                    type: 'tabPress',
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                };

                const iconName = TAB_ICONS[route.name] || 'circle';

                return (
                  <Pressable
                    key={route.key}
                    onPress={onPress}
                    className="items-center justify-center w-14 h-14"
                  >
                    <Feather
                      name={iconName}
                      size={24}
                      color={isFocused ? '#B8F25B' : '#5C6660'}
                    />
                  </Pressable>
                );
              })}
            </Animated.View>
          </GestureDetector>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    borderRadius: 9999,
    overflow: 'hidden',
    // Liquid glass border - subtle top edge
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    // Shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 16,
  },
  blurView: {
    overflow: 'hidden',
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(20, 25, 22, 0.6)',
  },
  topHighlight: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    zIndex: 1,
  },
  indicator: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    borderRadius: 9999,
  },
  indicatorGradient: {
    flex: 1,
    borderRadius: 9999,
  },
});
