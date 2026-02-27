import { View, Text, ScrollView, Pressable, StyleSheet, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useCallback, useMemo } from 'react';
import Svg, { Defs, RadialGradient, Stop, Rect } from 'react-native-svg';
import { Header } from '@/components/header';
import { BalanceDisplay } from '@/components/balance-display';
import { ActionButton } from '@/components/action-button';
import { AssetItem } from '@/components/asset-item';
import { NetworkBadge } from '@/components/network-badge';
import { AccountSwitcher } from '@/components/account-switcher';
import { ProfileSheet } from '@/components/profile-sheet';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { useTokens } from '@/hooks/use-tokens';
import { useNotifications } from '@/contexts/notification-context';
import { formatAddress } from '@/services/blockchain';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const {
    walletAddress,
    accounts,
    selectedAccount,
    selectAccount,
    addAccount,
    renameAccount,
    isLoading: isWalletLoading,
  } = useWallet();
  const { selectedNetworkId, selectedNetwork, networkType, isLoading: isNetworkLoading } = useNetwork();
  const { tokens, nativeToken, totalBalanceUsd, isLoading, refreshTokens } = useTokens({
    address: walletAddress,
    networkId: selectedNetworkId,
    networkType,
  });
  const { unreadCount } = useNotifications();

  const [refreshing, setRefreshing] = useState(false);
  const [showAccountSwitcher, setShowAccountSwitcher] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshTokens();
    setRefreshing(false);
  }, [refreshTokens]);

  // Calculate overall 24h change (weighted average based on USD value)
  // Must be before any conditional returns per React hooks rules
  const overall24hChange = useMemo(() => {
    if (totalBalanceUsd === 0) return 0;

    let weightedChange = 0;
    tokens.forEach((token) => {
      if (token.balanceUsd && token.change24h !== undefined) {
        const weight = token.balanceUsd / totalBalanceUsd;
        weightedChange += token.change24h * weight;
      }
    });

    return weightedChange;
  }, [tokens, totalBalanceUsd]);

  // Show loading state while contexts initialize
  if (isWalletLoading || isNetworkLoading) {
    return (
      <SafeAreaView className="flex-1 bg-wallet-bg items-center justify-center" edges={['top']}>
        <Text className="text-wallet-text-secondary">Loading...</Text>
      </SafeAreaView>
    );
  }

  // Display total USD balance or native token balance
  const displayBalance = totalBalanceUsd > 0
    ? totalBalanceUsd
    : nativeToken
      ? parseFloat(nativeToken.balanceFormatted)
      : 0;

  // Format wallet address for display
  const displayAddress = walletAddress
    ? formatAddress(walletAddress, 6, 4)
    : '0x...';

  // Get token color based on symbol
  const getTokenColor = (symbol: string): string => {
    const colors: Record<string, string> = {
      ETH: '#627EEA',
      MATIC: '#8247E5',
      USDT: '#26A17B',
      USDC: '#2775CA',
      DAI: '#F5AC37',
      WETH: '#EC4899',
      LINK: '#375BD2',
    };
    return colors[symbol] ?? '#8E8E93';
  };

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      {/* Ambient green glow */}
      <View style={styles.glowContainer} pointerEvents="none">
        <Svg width={SCREEN_WIDTH} height={500}>
          <Defs>
            <RadialGradient
              id="glow"
              cx="0%"
              cy="0%"
              rx="70%"
              ry="60%"
            >
              <Stop offset="0%" stopColor="#B8F25B" stopOpacity="0.15" />
              <Stop offset="40%" stopColor="#B8F25B" stopOpacity="0.06" />
              <Stop offset="100%" stopColor="#B8F25B" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect x="0" y="0" width={SCREEN_WIDTH} height={500} fill="url(#glow)" />
        </Svg>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#B8F25B"
          />
        }
      >
        <Header
          walletAddress={displayAddress}
          unreadCount={unreadCount}
          onProfilePress={() => setShowProfile(true)}
          onNotificationPress={() => router.push('/notifications')}
          onWalletPress={() => setShowAccountSwitcher(true)}
        />

        {/* Network Badge */}
        <View className="items-center mb-2">
          <NetworkBadge
            network={selectedNetwork}
            networkType={networkType}
            size="small"
          />
        </View>

        <BalanceDisplay
          balance={displayBalance}
          percentageChange={overall24hChange}
          timeframe="1d"
          isUsd={totalBalanceUsd > 0}
        />

        <View className="flex-row justify-center gap-12 py-6">
          <ActionButton type="receive" onPress={() => router.push('/receive')} />
          <ActionButton type="send" onPress={() => router.push('/send')} />
          <ActionButton type="swap" onPress={() => router.push('/swap')} />
        </View>

        {/* Assets Card */}
        <View className="mt-8 bg-wallet-card rounded-t-3xl flex-1 min-h-[400px]">
          <View className="flex-row items-center justify-between px-5 pt-6 pb-3">
            <Text className="text-xl font-bold text-wallet-text">My assets</Text>
            <Pressable className="bg-wallet-card-light px-4 py-2 rounded-full">
              <Text className="text-sm text-wallet-text-secondary">see all</Text>
            </Pressable>
          </View>

          <View className="px-5 pb-32">
            {isLoading && tokens.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-wallet-text-secondary">Loading tokens...</Text>
              </View>
            ) : tokens.length === 0 ? (
              <View className="py-8 items-center">
                <Text className="text-wallet-text-secondary">No tokens found</Text>
                <Text className="text-wallet-text-secondary text-sm mt-1">
                  Add some {selectedNetwork.symbol} to get started
                </Text>
              </View>
            ) : (
              tokens.map((token, index) => (
                <AssetItem
                  key={token.contractAddress ?? 'native'}
                  name={token.name}
                  symbol={token.symbol}
                  amount={token.balanceFormatted}
                  price={token.priceUsd ? `$${token.priceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: token.priceUsd >= 1 ? 2 : 4 })}` : '-'}
                  percentageChange={token.change24h ?? 0}
                  color={getTokenColor(token.symbol)}
                  logoUrl={token.logoUrl}
                  onPress={() => {
                    const tokenId = token.contractAddress ?? 'native';
                    router.push(`/asset/${tokenId}:${selectedNetworkId}`);
                  }}
                  showDivider={index < tokens.length - 1}
                />
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Account Switcher Modal */}
      <AccountSwitcher
        visible={showAccountSwitcher}
        onClose={() => setShowAccountSwitcher(false)}
        onOpen={() => setShowAccountSwitcher(true)}
        accounts={accounts}
        selectedAccount={selectedAccount}
        onSelectAccount={selectAccount}
        onAddAccount={addAccount}
        onRenameAccount={renameAccount}
      />

      {/* Profile Sheet */}
      <ProfileSheet
        visible={showProfile}
        onClose={() => setShowProfile(false)}
        selectedAccount={selectedAccount}
        walletAddress={walletAddress || ''}
        selectedNetwork={selectedNetwork}
        networkType={networkType}
        totalBalanceUsd={totalBalanceUsd}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  glowContainer: {
    position: 'absolute',
    top: -50,
    left: 0,
    right: 0,
    zIndex: 0,
  },
});
