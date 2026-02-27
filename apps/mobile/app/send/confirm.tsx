import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { formatEther, parseEther } from 'ethers';
import Feather from '@expo/vector-icons/Feather';
import { GasFeeSelector } from '@/components/gas-fee-selector';
import { PinConfirmModal } from '@/components/pin-confirm-modal';
import { useWallet } from '@/hooks/use-wallet';
import { useNetwork } from '@/hooks/use-network';
import { useTokens } from '@/hooks/use-tokens';
import { useTransactions } from '@/hooks/use-transactions';
import { formatAddress } from '@/services/blockchain';
import { Token, GasEstimate, GasOption } from '@/types/blockchain';

export default function SendConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    tokenAddress: string;
    tokenSymbol: string;
    tokenName: string;
    tokenDecimals: string;
    tokenBalance: string;
    tokenBalanceFormatted: string;
    isNative: string;
    amount: string;
    recipient: string;
  }>();

  const { walletAddress, getPrivateKey } = useWallet();
  const { selectedNetworkId, selectedNetwork, networkType } = useNetwork();
  const { nativeToken } = useTokens({
    address: walletAddress,
    networkId: selectedNetworkId,
    networkType,
  });

  // Store PIN for transaction signing
  const pendingPinRef = useRef<string>('');
  const [showPinModal, setShowPinModal] = useState(false);

  // Wrap getPrivateKey to use the pending PIN
  const getPrivateKeyWithPin = useCallback(async () => {
    if (!pendingPinRef.current) {
      return null;
    }
    return getPrivateKey(pendingPinRef.current);
  }, [getPrivateKey]);

  const { getGasEstimate, getGasOptions, send, isSending, error } = useTransactions({
    address: walletAddress,
    networkId: selectedNetworkId,
    networkType,
    getPrivateKey: getPrivateKeyWithPin,
  });

  const [gasEstimate, setGasEstimate] = useState<GasEstimate | null>(null);
  const [gasOptions, setGasOptions] = useState<GasOption[]>([]);
  const [selectedGasLabel, setSelectedGasLabel] = useState<'slow' | 'standard' | 'fast'>('standard');
  const [isLoadingGas, setIsLoadingGas] = useState(true);

  // Memoize token to prevent unnecessary re-renders
  const token: Token = useMemo(() => ({
    contractAddress: params.tokenAddress === 'native' ? null : params.tokenAddress,
    symbol: params.tokenSymbol ?? 'ETH',
    name: params.tokenName ?? 'Ethereum',
    decimals: parseInt(params.tokenDecimals ?? '18'),
    balance: params.tokenBalance ?? '0',
    balanceFormatted: params.tokenBalanceFormatted ?? '0',
    balanceUsd: null,
    isNative: params.isNative === 'true',
  }), [params.tokenAddress, params.tokenSymbol, params.tokenName, params.tokenDecimals, params.tokenBalance, params.tokenBalanceFormatted, params.isNative]);

  const amount = params.amount ?? '0';
  const recipient = params.recipient ?? '';

  // Check if user has sufficient gas balance
  const insufficientGasBalance = useMemo(() => {
    if (!gasEstimate || !nativeToken) return null;

    const nativeBalanceWei = BigInt(nativeToken.balance || '0');
    const gasCostWei = gasEstimate.estimatedCostWei;

    if (token.isNative) {
      // For native token transfers: need amount + gas
      const amountWei = parseEther(amount);
      const totalNeeded = amountWei + gasCostWei;
      if (nativeBalanceWei < totalNeeded) {
        const shortfall = totalNeeded - nativeBalanceWei;
        return {
          message: `Insufficient ${selectedNetwork.symbol} for amount + gas`,
          shortfall: formatEther(shortfall),
        };
      }
    } else {
      // For ERC20 transfers: need gas only from native balance
      if (nativeBalanceWei < gasCostWei) {
        const shortfall = gasCostWei - nativeBalanceWei;
        return {
          message: `Insufficient ${selectedNetwork.symbol} for gas`,
          shortfall: formatEther(shortfall),
        };
      }
    }

    return null;
  }, [gasEstimate, nativeToken, token.isNative, amount, selectedNetwork.symbol]);

  // Memoize the load gas function to avoid dependency issues
  const loadGas = useCallback(async () => {
    setIsLoadingGas(true);
    try {
      const [estimate, options] = await Promise.all([
        getGasEstimate(recipient, token, amount),
        getGasOptions(),
      ]);

      if (estimate) {
        setGasEstimate(estimate);
      }
      if (options.length > 0) {
        setGasOptions(options);
      }
    } catch (err) {
      console.error('Error loading gas:', err);
    } finally {
      setIsLoadingGas(false);
    }
  }, [getGasEstimate, getGasOptions, recipient, token, amount]);

  // Load gas estimate and options on mount
  useEffect(() => {
    loadGas();
  }, [loadGas]);

  const handleGasSelect = (option: GasOption) => {
    setSelectedGasLabel(option.label);
    // Update gas estimate with selected option's prices and recalculate cost
    if (gasEstimate) {
      const newEstimatedCostWei = gasEstimate.gasLimit * option.maxFeePerGas;
      setGasEstimate({
        ...gasEstimate,
        maxFeePerGas: option.maxFeePerGas,
        maxPriorityFeePerGas: option.maxPriorityFeePerGas,
        estimatedCostWei: newEstimatedCostWei,
        estimatedCostFormatted: formatEther(newEstimatedCostWei),
      });
    }
  };

  const handleConfirmPress = () => {
    if (!gasEstimate) {
      Alert.alert('Error', 'Gas estimate not available');
      return;
    }

    // Show PIN confirmation modal
    setShowPinModal(true);
  };

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    pendingPinRef.current = pin;

    // First validate PIN by trying to get private key
    const privateKey = await getPrivateKey(pin);
    if (!privateKey) {
      pendingPinRef.current = '';
      return false; // Wrong PIN
    }

    if (!gasEstimate) {
      pendingPinRef.current = '';
      return false;
    }

    setShowPinModal(false);

    const result = await send({
      to: recipient,
      amount,
      token,
      gasEstimate,
    });

    // Clear PIN after use
    pendingPinRef.current = '';

    if (result) {
      // Navigate to success screen
      router.replace({
        pathname: '/send/success',
        params: {
          txHash: result.hash,
          explorerUrl: result.explorerUrl,
          amount,
          tokenSymbol: token.symbol,
          recipient,
        },
      });
      return true;
    } else if (error) {
      Alert.alert('Transaction Failed', error);
    }
    return true; // PIN was valid even if tx failed for other reasons
  };

  return (
    <SafeAreaView className="flex-1" edges={['bottom']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-wallet-card items-center justify-center"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>

        <Text className="text-xl font-bold text-wallet-text">Confirm</Text>

        <View className="w-10" />
      </View>

      {/* Content */}
      <View className="flex-1 px-5 pt-4">
        {/* Transaction Summary */}
        <View className="bg-wallet-card rounded-2xl p-5 mb-6">
          <Text className="text-wallet-text-secondary text-sm mb-2">
            You are sending
          </Text>
          <Text className="text-wallet-text text-3xl font-bold mb-1">
            {amount} {token.symbol}
          </Text>

          <View className="h-px bg-wallet-card-light my-4" />

          <View className="gap-3">
            <View className="flex-row justify-between">
              <Text className="text-wallet-text-secondary">To</Text>
              <Text className="text-wallet-text font-mono">
                {formatAddress(recipient, 8, 6)}
              </Text>
            </View>

            <View className="flex-row justify-between">
              <Text className="text-wallet-text-secondary">Network</Text>
              <Text className="text-wallet-text">
                {selectedNetwork.name}
                {networkType === 'testnet' && ` (${selectedNetwork.testnetName})`}
              </Text>
            </View>
          </View>
        </View>

        {/* Gas Fee Selector */}
        {isLoadingGas ? (
          <View className="bg-wallet-card rounded-2xl p-5 items-center">
            <ActivityIndicator size="small" color="#B8F25B" />
            <Text className="text-wallet-text-secondary mt-2">
              Estimating gas...
            </Text>
          </View>
        ) : gasOptions.length > 0 && gasEstimate ? (
          <View className="bg-wallet-card rounded-2xl p-5">
            <GasFeeSelector
              options={gasOptions}
              selectedLabel={selectedGasLabel}
              gasLimit={gasEstimate.gasLimit}
              nativeSymbol={selectedNetwork.symbol}
              onSelect={handleGasSelect}
            />
          </View>
        ) : (
          <View className="bg-wallet-card rounded-2xl p-5">
            <Text className="text-wallet-text-secondary text-center">
              Unable to estimate gas fees
            </Text>
          </View>
        )}

        {/* Total */}
        {gasEstimate && (
          <View className="bg-wallet-card-light rounded-xl p-4 mt-4">
            <View className="flex-row justify-between items-center">
              <Text className="text-wallet-text-secondary">Estimated Gas Fee</Text>
              <Text className="text-wallet-text font-mono">
                ~{parseFloat(gasEstimate.estimatedCostFormatted).toFixed(6)} {selectedNetwork.symbol}
              </Text>
            </View>
          </View>
        )}

        {/* Insufficient Gas Warning */}
        {insufficientGasBalance && (
          <View className="bg-wallet-negative/20 rounded-xl p-4 mt-4 flex-row items-center gap-3">
            <Feather name="alert-triangle" size={20} color="#FF3B30" />
            <View className="flex-1">
              <Text className="text-wallet-negative font-medium">
                {insufficientGasBalance.message}
              </Text>
              <Text className="text-wallet-text-secondary text-sm mt-1">
                Need ~{parseFloat(insufficientGasBalance.shortfall).toFixed(6)} more {selectedNetwork.symbol}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Confirm Button */}
      <View className="px-5 pb-8">
        <Pressable
          onPress={handleConfirmPress}
          disabled={isSending || isLoadingGas || !gasEstimate || !!insufficientGasBalance}
          className={`py-4 rounded-xl items-center flex-row justify-center gap-2 ${
            isSending || isLoadingGas || !gasEstimate || insufficientGasBalance
              ? 'bg-wallet-card-light'
              : 'bg-wallet-accent'
          }`}
        >
          {isSending ? (
            <>
              <ActivityIndicator size="small" color="#0A0A0A" />
              <Text className="font-semibold text-lg text-wallet-bg">
                Sending...
              </Text>
            </>
          ) : (
            <Text
              className={`font-semibold text-lg ${
                isLoadingGas || !gasEstimate || insufficientGasBalance
                  ? 'text-wallet-text-secondary'
                  : 'text-wallet-bg'
              }`}
            >
              {insufficientGasBalance ? 'Insufficient Gas' : 'Confirm & Send'}
            </Text>
          )}
        </Pressable>
      </View>

      {/* PIN Confirmation Modal */}
      <PinConfirmModal
        visible={showPinModal}
        title="Confirm Transaction"
        description="Enter your PIN to sign and send this transaction"
        onClose={() => setShowPinModal(false)}
        onConfirm={handlePinConfirm}
      />
    </SafeAreaView>
  );
}
