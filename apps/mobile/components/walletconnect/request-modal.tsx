import { useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useWalletConnect } from '@/hooks/use-walletconnect';
import { PinConfirmModal } from '@/components/pin-confirm-modal';
import { getNetworkNameForChainId } from '@/services/walletconnect/chain-utils';
import { formatTransactionValue } from '@/services/walletconnect/request-handler';
import type { WCParsedRequest } from '@/types/walletconnect';

/**
 * Format error messages for better user understanding
 */
function formatErrorMessage(error: string): string {
  // Gas estimation failures
  if (error.includes('estimateGas') || error.includes('CALL_EXCEPTION')) {
    return 'Transaction would fail. The contract may have rejected the call, or you may have insufficient funds.';
  }
  // Insufficient funds
  if (error.includes('insufficient funds') || error.includes('INSUFFICIENT_FUNDS')) {
    return 'Insufficient funds to complete this transaction.';
  }
  // Nonce errors
  if (error.includes('nonce')) {
    return 'Transaction nonce error. Please try again.';
  }
  // Network errors
  if (error.includes('network') || error.includes('connection')) {
    return 'Network error. Please check your connection and try again.';
  }
  // Keep original if no match (but truncate if too long)
  return error.length > 150 ? error.slice(0, 150) + '...' : error;
}

interface RequestModalProps {
  visible: boolean;
  onClose: () => void;
}

export function RequestModal({ visible, onClose }: RequestModalProps) {
  const {
    pendingRequest,
    parsedRequest,
    signAndApproveRequest,
    rejectRequest,
  } = useWalletConnect();

  const [showPinModal, setShowPinModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await rejectRequest('User rejected the request');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onClose();
    } catch (err) {
      console.error('[WalletConnect] Failed to reject request:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApprove = () => {
    setShowPinModal(true);
  };

  const handlePinConfirm = async (pin: string): Promise<boolean> => {
    setIsProcessing(true);
    setError(null);

    try {
      await signAndApproveRequest(pin);
      setShowPinModal(false);
      onClose();
      return true;
    } catch (err) {
      console.error('[WalletConnect] Failed to sign request:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign request';

      // Only return false (show "Invalid PIN") for actual PIN errors
      // For other errors (transaction failures, etc.), close PIN modal and show error
      if (errorMessage === 'Invalid PIN') {
        setIsProcessing(false);
        return false; // This tells PinConfirmModal to show "Incorrect PIN"
      }

      // For non-PIN errors, close PIN modal and show the actual error
      setShowPinModal(false);
      setError(formatErrorMessage(errorMessage));
      setIsProcessing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return true; // Return true so PIN modal doesn't show "Incorrect PIN"
    }
  };

  if (!pendingRequest || !parsedRequest) return null;

  const { peerMeta } = pendingRequest;
  const domain = peerMeta.url ? new URL(peerMeta.url).hostname : 'Unknown';

  return (
    <>
      <Modal
        visible={visible && !showPinModal}
        transparent
        animationType="slide"
        onRequestClose={handleReject}
      >
        <View className="flex-1 bg-black/60 justify-end">
          <View className="bg-wallet-bg rounded-t-3xl max-h-[90%]">
            {/* Header */}
            <View className="items-center py-6 border-b border-wallet-card">
              {/* dApp Icon */}
              {peerMeta.icons[0] ? (
                <Image
                  source={{ uri: peerMeta.icons[0] }}
                  style={{ width: 56, height: 56, borderRadius: 14 }}
                  contentFit="cover"
                />
              ) : (
                <View className="w-14 h-14 rounded-2xl bg-wallet-card items-center justify-center">
                  <Feather name="globe" size={28} color="#8B9A92" />
                </View>
              )}

              <Text className="text-wallet-text text-lg font-bold mt-3">
                {peerMeta.name}
              </Text>
              <Text className="text-wallet-text-secondary text-sm">
                {domain}
              </Text>
            </View>

            <ScrollView
              className="px-5 py-4"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Request Type Badge */}
              <View className="items-center mb-4">
                <View className="bg-wallet-accent/20 px-4 py-2 rounded-full">
                  <Text className="text-wallet-accent font-semibold">
                    {getRequestTypeLabel(parsedRequest.type)}
                  </Text>
                </View>
              </View>

              {/* Network */}
              <View className="bg-wallet-card rounded-xl p-4 mb-4">
                <View className="flex-row items-center justify-between">
                  <Text className="text-wallet-text-secondary">Network</Text>
                  <Text className="text-wallet-text font-medium">
                    {getNetworkNameForChainId(parsedRequest.chainId)}
                  </Text>
                </View>
              </View>

              {/* Request Content */}
              <RequestContent request={parsedRequest} />

              {/* Error */}
              {error && (
                <View className="bg-wallet-negative/20 rounded-xl p-4 mt-4">
                  <Text className="text-wallet-negative text-sm">{error}</Text>
                </View>
              )}

              {/* Warning */}
              <View className="bg-wallet-warning/10 rounded-xl p-4 mt-4">
                <View className="flex-row items-start gap-3">
                  <Feather name="alert-triangle" size={18} color="#FFB800" />
                  <Text className="text-wallet-text-secondary text-sm flex-1">
                    {parsedRequest.type === 'transaction'
                      ? 'This will submit a transaction to the blockchain. Make sure you trust this dApp.'
                      : 'Signing this message will not cost gas. Make sure you trust this dApp.'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            {/* Actions */}
            <View className="flex-row gap-4 px-5 pb-8 pt-4 border-t border-wallet-card">
              <Pressable
                onPress={handleReject}
                disabled={isProcessing}
                className="flex-1 py-4 rounded-xl bg-wallet-card items-center active:opacity-70"
              >
                <Text className="text-wallet-text font-semibold">Reject</Text>
              </Pressable>

              <Pressable
                onPress={handleApprove}
                disabled={isProcessing}
                className="flex-1 py-4 rounded-xl bg-wallet-accent items-center active:opacity-70"
              >
                {isProcessing ? (
                  <ActivityIndicator color="#0A0A0A" />
                ) : (
                  <Text className="text-wallet-bg font-semibold">
                    {parsedRequest.type === 'transaction' ? 'Confirm' : 'Sign'}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* PIN Confirmation */}
      <PinConfirmModal
        visible={showPinModal}
        onConfirm={handlePinConfirm}
        onClose={() => setShowPinModal(false)}
        title={parsedRequest.type === 'transaction' ? 'Confirm Transaction' : 'Sign Message'}
        description={parsedRequest.type === 'transaction'
          ? 'Enter your PIN to confirm this transaction'
          : 'Enter your PIN to sign this message'}
      />
    </>
  );
}

function getRequestTypeLabel(type: string): string {
  switch (type) {
    case 'transaction':
      return 'Transaction Request';
    case 'message':
      return 'Sign Message';
    case 'typedData':
      return 'Sign Typed Data';
    default:
      return 'Request';
  }
}

function RequestContent({ request }: { request: WCParsedRequest }) {
  switch (request.type) {
    case 'transaction':
      return <TransactionContent request={request} />;
    case 'message':
      return <MessageContent request={request} />;
    case 'typedData':
      return <TypedDataContent request={request} />;
    default:
      return (
        <View className="bg-wallet-card rounded-xl p-4">
          <Text className="text-wallet-text-secondary">
            Unsupported request type: {request.method}
          </Text>
        </View>
      );
  }
}

function TransactionContent({ request }: { request: WCParsedRequest }) {
  const tx = request.transaction;
  if (!tx) return null;

  const valueEth = formatTransactionValue(tx.value);
  const hasData = tx.data && tx.data !== '0x';

  return (
    <View className="gap-3">
      {/* Value */}
      {valueEth !== '0' && (
        <View className="bg-wallet-card rounded-xl p-4">
          <Text className="text-wallet-text-secondary text-sm mb-1">Value</Text>
          <Text className="text-wallet-text text-2xl font-bold">{valueEth} ETH</Text>
        </View>
      )}

      {/* To Address */}
      <View className="bg-wallet-card rounded-xl p-4">
        <Text className="text-wallet-text-secondary text-sm mb-1">To</Text>
        <Text className="text-wallet-text font-mono text-sm" numberOfLines={1}>
          {tx.to}
        </Text>
      </View>

      {/* Contract Interaction */}
      {hasData && (
        <View className="bg-wallet-card rounded-xl p-4">
          <View className="flex-row items-center gap-2 mb-2">
            <Feather name="code" size={14} color="#8B9A92" />
            <Text className="text-wallet-text-secondary text-sm">Contract Interaction</Text>
          </View>
          <Text className="text-wallet-text-muted font-mono text-xs" numberOfLines={3}>
            {tx.data}
          </Text>
        </View>
      )}

      {/* Gas (if provided) */}
      {tx.gas && (
        <View className="bg-wallet-card rounded-xl p-4">
          <Text className="text-wallet-text-secondary text-sm mb-1">Gas Limit</Text>
          <Text className="text-wallet-text">{parseInt(tx.gas, 16)}</Text>
        </View>
      )}
    </View>
  );
}

function MessageContent({ request }: { request: WCParsedRequest }) {
  return (
    <View className="bg-wallet-card rounded-xl p-4">
      <Text className="text-wallet-text-secondary text-sm mb-2">Message</Text>
      <Text className="text-wallet-text" selectable>
        {request.message || request.messageHex || 'Empty message'}
      </Text>
    </View>
  );
}

function TypedDataContent({ request }: { request: WCParsedRequest }) {
  const typedData = request.typedData;
  if (!typedData) return null;

  return (
    <View className="gap-3">
      {/* Domain */}
      {typedData.domain && (
        <View className="bg-wallet-card rounded-xl p-4">
          <Text className="text-wallet-text-secondary text-sm mb-2">Domain</Text>
          {typedData.domain.name && (
            <Text className="text-wallet-text">
              {typedData.domain.name}
              {typedData.domain.version && ` v${typedData.domain.version}`}
            </Text>
          )}
        </View>
      )}

      {/* Primary Type */}
      <View className="bg-wallet-card rounded-xl p-4">
        <Text className="text-wallet-text-secondary text-sm mb-2">Type</Text>
        <Text className="text-wallet-text">{typedData.primaryType}</Text>
      </View>

      {/* Message Data */}
      <View className="bg-wallet-card rounded-xl p-4">
        <Text className="text-wallet-text-secondary text-sm mb-2">Data</Text>
        <Text className="text-wallet-text font-mono text-xs" selectable>
          {JSON.stringify(typedData.message, null, 2)}
        </Text>
      </View>
    </View>
  );
}
