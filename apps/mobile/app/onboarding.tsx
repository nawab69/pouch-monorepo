import { useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Dimensions, FlatList, ListRenderItemInfo, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, View, ViewToken } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { PortfolioIllustration } from '@/components/onboarding/illustrations/portfolio-illustration';
import { RocketIllustration } from '@/components/onboarding/illustrations/rocket-illustration';
import { WalletIllustration } from '@/components/onboarding/illustrations/wallet-illustration';
import { OnboardingNavigation } from '@/components/onboarding/onboarding-navigation';
import { OnboardingPage } from '@/components/onboarding/onboarding-page';
import { useOnboarding } from '@/hooks/use-onboarding';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface PageData {
  id: string;
  title: string;
  accentWord: string;
  description: string;
  illustration: React.ReactNode;
}

const PAGES: PageData[] = [
  {
    id: '1',
    title: 'Secure Your',
    accentWord: 'Freedom',
    description: 'A non-custodial wallet where you control your keys.',
    illustration: <WalletIllustration />,
  },
  {
    id: '2',
    title: 'Track Your',
    accentWord: 'Portfolio',
    description: 'Monitor all your assets in one place with real-time prices and performance insights.',
    illustration: <PortfolioIllustration />,
  },
  {
    id: '3',
    title: 'Ready to',
    accentWord: 'Start?',
    description: 'Create a new wallet or import an existing one in seconds.',
    illustration: <RocketIllustration />,
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useOnboarding();
  const flatListRef = useRef<FlatList<PageData>>(null);
  const scrollX = useSharedValue(0);
  const [currentPage, setCurrentPage] = useState(0);

  const handleComplete = useCallback(async () => {
    await completeOnboarding();
    router.replace('/wallet-setup');
  }, [completeOnboarding, router]);

  const handleSkip = useCallback(() => {
    handleComplete();
  }, [handleComplete]);

  const handleNext = useCallback(() => {
    if (currentPage < PAGES.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentPage + 1,
        animated: true,
      });
    } else {
      handleComplete();
    }
  }, [currentPage, handleComplete]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentPage(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderPage = useCallback(
    ({ item, index }: ListRenderItemInfo<PageData>) => (
      <OnboardingPage
        index={index}
        scrollX={scrollX}
        title={item.title}
        accentWord={item.accentWord}
        description={item.description}
        illustration={item.illustration}
      />
    ),
    [scrollX]
  );

  const keyExtractor = useCallback((item: PageData) => item.id, []);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    scrollX.value = event.nativeEvent.contentOffset.x;
  }, [scrollX]);

  return (
    <View style={styles.container}>
      {/* Background with gradient */}
      <View style={styles.background}>
        <Svg width={SCREEN_WIDTH} height={SCREEN_HEIGHT}>
          <Defs>
            <RadialGradient
              id="bgGlow"
              cx="20%"
              cy="25%"
              rx="70%"
              ry="50%"
            >
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.12" />
              <Stop offset="50%" stopColor="#B8F25B" stopOpacity="0.04" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={SCREEN_HEIGHT} fill="url(#bgGlow)" />
        </Svg>
      </View>

      {/* Pages */}
      <FlatList<PageData>
        ref={flatListRef}
        data={PAGES}
        renderItem={renderPage}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
      />

      {/* Bottom navigation area */}
      <View style={[styles.bottomContainer, { paddingBottom: insets.bottom + 20 }]}>
        <OnboardingNavigation
          currentPage={currentPage}
          totalPages={PAGES.length}
          scrollX={scrollX}
          screenWidth={SCREEN_WIDTH}
          onSkip={handleSkip}
          onNext={handleNext}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1411',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 20,
  },
});
