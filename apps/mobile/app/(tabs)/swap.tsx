import { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, Pressable, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { useTokens } from '@/hooks/use-tokens';
import { useSwap } from '@/hooks/use-swap';
import {
  SwapTokenInput,
  SwapQuoteDetails,
  SlippageSelector,
  TokenSelectModal,
} from '@/components/swap';
import { PinConfirmModal } from '@/components/pin-confirm-modal';
import { Token } from '@/types/blockchain';
import { getPriceImpactLevel } from '@/services/swap/swap-types';
import { saveSwapTransaction } from '@/services/swap';

export default function SwapScreen() {
  const router = useRouter();
  const { walletAddress, getPrivateKey } = useWallet();
  const { selectedNetworkId, selectedNetwork, networkType } = useNetwork();

  const { tokens, nativeToken, refreshTokens } = useTokens({
    address: walletAddress,
    networkId: selectedNetworkId,
    networkType,
  });

  // Store PIN for transaction signing
  const pendingPinRef = useRef<string>('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'swap' | null>(null);

  // Token select modal state
  const [showTokenSelect, setShowTokenSelect] = useState(false);
  const [selectingFor, setSelectingFor] = useState<'sell' | 'buy'>('sell');

  // Wrap getPrivateKey to use the pending PIN
  const getPrivateKeyWithPin = useCallback(async () => {
    if (!pendingPinRef.current) {
      return null;
    }
    return getPrivateKey(pendingPinRef.current);
  }, [getPrivateKey]);

  const {
    sellToken,
    buyToken,
    setSellToken,
    setBuyToken,
    swapTokens,
    sellAmount,
    setSellAmount,
    buyAmount,
    slippage,
    setSlippage,
    quote,
    isQuoteLoading,
    isQuoteStale,
    refreshQuote,
    needsTokenApproval,
    isApproving,
    approve,
    isSwapping,
    swap,
    error,
    clearError,
    validationError,
    isSupported,
  } = useSwap({
    address: walletAddress,
    networkId: selectedNetworkId,
    networkType,
    getPrivateKey: getPrivateKeyWithPin,
  });

  // Initialize with native token as sell token
  useEffect(() => {
    if (nativeToken && !sellToken) {
      setSellToken(nativeToken);
    }
  }, [nativeToken, sellToken, setSellToken]);

  // Sync token balances when tokens array updates
  useEffect(() => {
    if (!tokens.length) return;

    // Update sellToken balance if it exists in tokens
    if (sellToken) {
      const updatedSellToken = tokens.find(
        (t) =>
          (sellToken.isNative && t.isNative) ||
          (!sellToken.isNative && t.contractAddress === sellToken.contractAddress)
      );
      if (updatedSellToken && updatedSellToken.balance !== sellToken.balance) {
        setSellToken(updatedSellToken);
      }
    }

    // Update buyToken balance if it exists in tokens
    if (buyToken) {
      const updatedBuyToken = tokens.find(
        (t) =>
          (buyToken.isNative && t.isNative) ||
          (!buyToken.isNative && t.contractAddress === buyToken.contractAddress)
      );
      if (updatedBuyToken && updatedBuyToken.balance !== buyToken.balance) {
        setBuyToken(updatedBuyToken);
      }
    }
  }, [tokens, sellToken, buyToken, setSellToken, setBuyToken]);

  // Determine if error is a quote error (show inline) vs transaction error (show alert)
  const isQuoteError = error && (
    error.includes('No liquidity pool') ||
    error.includes('Failed to get quote') ||
    error.includes('pool found')
  );

  // Show alert only for transaction errors, not quote errors
  useEffect(() => {
    if (error && !isQuoteError) {
      Alert.alert('Error', error, [{ text: 'OK', onPress: clearError }]);
    }
  }, [error, isQuoteError, clearError]);

  const handleOpenTokenSelect = (type: 'sell' | 'buy') => {
    setSelectingFor(type);
    setShowTokenSelect(true);
  };

  const handleTokenSelect = (token: Token) => {
    if (selectingFor === 'sell') {
      setSellToken(token);
    } else {
      setBuyToken(token);
    }
    setShowTokenSelect(false);
  };

  const handleMaxPress = () => {
    if (sellToken) {
      // For native tokens, leave some for gas
      if (sellToken.isNative) {
        const balance = parseFloat(sellToken.balanceFormatted) || 0;
        const maxAmount = Math.max(0, balance - 0.01);
        setSellAmount(maxAmount.toString());
      } else {
        setSellAmount(sellToken.balanceFormatted);
      }
    }
  };

  const handleApprovePress = () => {
    setPendingAction('approve');
    setShowPinModal(true);
  };

  const handleSwapPress = () => {
    if (!quote) return;

    // Check for high price impact
    const priceImpact = parseFloat(quote.priceImpact) || 0;
    if (getPriceImpactLevel(priceImpact) === 'high') {
      Alert.alert(
        'High Price Impact',
        `This swap has a ${priceImpact.toFixed(2)}% price impact. Are you sure you want to continue?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Continue',
            style: 'destructive',
            onPress: () => {
              setPendingAction('swap');
              setShowPinModal(true);
            },
          },
        ]
      );
      return;
    }

    setPendingAction('swap');
    setShowPinModal(true);
  };

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    pendingPinRef.current = pin;

    // Validate PIN
    const privateKey = await getPrivateKey(pin);
    if (!privateKey) {
      pendingPinRef.current = '';
      return false;
    }

    setShowPinModal(false);

    if (pendingAction === 'approve') {
      const result = await approve();
      pendingPinRef.current = '';
      setPendingAction(null);

      if (result) {
        Alert.alert('Success', 'Token approved for swapping');
      }
    } else if (pendingAction === 'swap') {
      const result = await swap();
      pendingPinRef.current = '';
      setPendingAction(null);

      if (result) {
        // Save swap to local history
        if (walletAddress) {
          await saveSwapTransaction(
            result,
            selectedNetworkId,
            networkType,
            walletAddress
          );
        }

        // Navigate to swap success screen
        router.push({
          pathname: '/swap/success',
          params: {
            txHash: result.hash,
            explorerUrl: result.explorerUrl,
            sellAmount: result.sellAmount,
            sellSymbol: result.sellToken.symbol,
            buyAmount: result.buyAmount,
            buySymbol: result.buyToken.symbol,
          },
        });
        // Refresh tokens after swap
        refreshTokens();
      }
    }

    return true;
  };

  // Determine button state
  const getButtonConfig = () => {
    if (!isSupported) {
      return {
        text: 'Swaps not available on testnet',
        disabled: true,
        onPress: () => {},
      };
    }
    if (isSwapping) {
      return {
        text: 'Swapping...',
        disabled: true,
        loading: true,
        onPress: () => {},
      };
    }
    if (isApproving) {
      return {
        text: 'Approving...',
        disabled: true,
        loading: true,
        onPress: () => {},
      };
    }
    if (!sellToken || !buyToken) {
      return {
        text: 'Select tokens',
        disabled: true,
        onPress: () => {},
      };
    }
    if (!sellAmount || parseFloat(sellAmount) <= 0) {
      return {
        text: 'Enter amount',
        disabled: true,
        onPress: () => {},
      };
    }
    if (validationError === 'Insufficient balance') {
      return {
        text: 'Insufficient balance',
        disabled: true,
        onPress: () => {},
      };
    }
    if (isQuoteLoading) {
      return {
        text: 'Getting quote...',
        disabled: true,
        loading: true,
        onPress: () => {},
      };
    }
    if (!quote) {
      return {
        text: 'Enter amount',
        disabled: true,
        onPress: () => {},
      };
    }
    if (isQuoteStale) {
      return {
        text: 'Refresh quote',
        disabled: false,
        onPress: refreshQuote,
      };
    }
    if (needsTokenApproval) {
      return {
        text: `Approve ${sellToken.symbol}`,
        disabled: false,
        onPress: handleApprovePress,
      };
    }
    return {
      text: 'Swap',
      disabled: false,
      onPress: handleSwapPress,
    };
  };

  const buttonConfig = getButtonConfig();

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <View className="w-10" />

          <Text className="text-lg font-semibold text-wallet-text">Swap</Text>

          <SlippageSelector value={slippage} onChange={setSlippage} />
        </View>

        {/* Network info */}
        <View className="px-5 mb-2">
          <View className="flex-row items-center gap-2">
            <View
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: selectedNetwork.color }}
            />
            <Text className="text-wallet-text-secondary text-sm">
              {selectedNetwork.name}
              {networkType === 'testnet' && ` (${selectedNetwork.testnetName})`}
            </Text>
          </View>
        </View>

        {/* Network not supported warning */}
        {!isSupported && (
          <View className="mx-5 mb-4 bg-wallet-card rounded-xl p-4 flex-row items-center gap-3">
            <Feather name="alert-circle" size={20} color="#F7931A" />
            <View className="flex-1">
              <Text className="text-[#F7931A] font-medium">
                Swaps Not Available
              </Text>
              <Text className="text-wallet-text-secondary text-sm">
                Uniswap V3 is not available on this network.
              </Text>
            </View>
          </View>
        )}

        {/* Swap inputs */}
        <View className="px-5 pt-2 gap-2">
          {/* Sell token */}
          <SwapTokenInput
            type="sell"
            token={sellToken}
            amount={sellAmount}
            onAmountChange={setSellAmount}
            onTokenPress={() => handleOpenTokenSelect('sell')}
            onMaxPress={handleMaxPress}
            editable={true}
          />

          {/* Swap direction button */}
          <View className="items-center -my-4 z-10">
            <Pressable
              onPress={swapTokens}
              className="w-10 h-10 rounded-full bg-wallet-card-light items-center justify-center border-4 border-wallet-bg active:opacity-70"
            >
              <Feather name="arrow-down" size={20} color="#B8F25B" />
            </Pressable>
          </View>

          {/* Buy token */}
          <SwapTokenInput
            type="buy"
            token={buyToken}
            amount={buyAmount}
            onTokenPress={() => handleOpenTokenSelect('buy')}
            editable={false}
            isLoading={isQuoteLoading}
          />
        </View>

        {/* Quote error (shown inline) */}
        {isQuoteError && (
          <View className="mx-5 mt-4 bg-wallet-card rounded-xl p-4 flex-row items-start gap-3">
            <Feather name="alert-circle" size={18} color="#EF4444" />
            <View className="flex-1">
              <Text className="text-red-500 font-medium">
                No Liquidity Available
              </Text>
              <Text className="text-wallet-text-secondary text-sm mt-1">
                There&apos;s no liquidity pool for this token pair on the current network. Try a different token pair.
              </Text>
            </View>
            <Pressable onPress={clearError} className="p-1">
              <Feather name="x" size={16} color="#5C6660" />
            </Pressable>
          </View>
        )}

        {/* Quote details */}
        {quote && (
          <View className="px-5 pt-4">
            <SwapQuoteDetails
              quote={quote}
              slippage={slippage}
              networkId={selectedNetworkId}
              isStale={isQuoteStale}
              onRefresh={refreshQuote}
            />
          </View>
        )}

        {/* Approval info */}
        {needsTokenApproval && sellToken && quote && (
          <View className="mx-5 mt-4 bg-wallet-card rounded-xl p-4 flex-row items-start gap-3">
            <Feather name="info" size={18} color="#B8F25B" />
            <View className="flex-1">
              <Text className="text-wallet-accent font-medium">
                Approval Required
              </Text>
              <Text className="text-wallet-text-secondary text-sm mt-1">
                You need to approve {sellToken.symbol} before swapping. This is a one-time transaction.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Action button */}
      <View className="px-5 pb-28">
        <Pressable
          onPress={buttonConfig.onPress}
          disabled={buttonConfig.disabled}
          className={`py-4 rounded-xl items-center flex-row justify-center gap-2 ${
            buttonConfig.disabled
              ? 'bg-wallet-card-light'
              : 'bg-wallet-accent active:bg-wallet-accent-dark'
          }`}
        >
          {buttonConfig.loading && (
            <ActivityIndicator size="small" color={buttonConfig.disabled ? '#5C6660' : '#0A0A0A'} />
          )}
          <Text
            className={`font-semibold text-lg ${
              buttonConfig.disabled ? 'text-wallet-text-secondary' : 'text-wallet-bg'
            }`}
          >
            {buttonConfig.text}
          </Text>
        </Pressable>
      </View>

      {/* Token select modal */}
      <TokenSelectModal
        visible={showTokenSelect}
        onClose={() => setShowTokenSelect(false)}
        onSelect={handleTokenSelect}
        tokens={tokens}
        selectedToken={selectingFor === 'sell' ? sellToken : buyToken}
        excludeToken={selectingFor === 'sell' ? buyToken : sellToken}
        title={selectingFor === 'sell' ? 'Select token to sell' : 'Select token to buy'}
      />

      {/* PIN confirmation modal */}
      <PinConfirmModal
        visible={showPinModal}
        title={pendingAction === 'approve' ? 'Approve Token' : 'Confirm Swap'}
        description={
          pendingAction === 'approve'
            ? `Enter your PIN to approve ${sellToken?.symbol} for swapping`
            : 'Enter your PIN to sign and execute this swap'
        }
        onClose={() => {
          setShowPinModal(false);
          setPendingAction(null);
        }}
        onConfirm={handlePinConfirm}
      />
    </SafeAreaView>
  );
}
