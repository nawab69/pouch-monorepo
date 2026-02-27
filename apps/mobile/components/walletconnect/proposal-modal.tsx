import { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useProposalInfo, useWalletConnect } from '@/hooks/use-walletconnect';
import { getNetworkNameForChainId } from '@/services/walletconnect/chain-utils';

interface ProposalModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ProposalModal({ visible, onClose }: ProposalModalProps) {
  const proposalInfo = useProposalInfo();
  const { approveProposal, rejectProposal, supportedChainIds } = useWalletConnect();

  const [selectedChainIds, setSelectedChainIds] = useState<number[]>([]);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  // Initialize selected chains when proposal changes
  useEffect(() => {
    if (proposalInfo) {
      setSelectedChainIds(proposalInfo.requestedChainIds);
    }
  }, [proposalInfo]);

  const handleApprove = async () => {
    if (selectedChainIds.length === 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsApproving(true);
    try {
      await approveProposal(selectedChainIds);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('[WalletConnect] Failed to approve proposal:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await rejectProposal();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      onClose();
    } catch (error) {
      console.error('[WalletConnect] Failed to reject proposal:', error);
    } finally {
      setIsRejecting(false);
    }
  };

  const toggleChain = (chainId: number) => {
    setSelectedChainIds(prev =>
      prev.includes(chainId)
        ? prev.filter(id => id !== chainId)
        : [...prev, chainId]
    );
  };

  if (!proposalInfo) return null;

  const domain = proposalInfo.dAppUrl ? new URL(proposalInfo.dAppUrl).hostname : 'Unknown';
  const isLoading = isApproving || isRejecting;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleReject}
    >
      <View className="flex-1 bg-black/60 justify-end">
        <View className="bg-wallet-bg rounded-t-3xl max-h-[90%]">
          {/* Header */}
          <View className="items-center py-6 border-b border-wallet-card">
            {/* dApp Icon */}
            {proposalInfo.dAppIcon ? (
              <Image
                source={{ uri: proposalInfo.dAppIcon }}
                style={{ width: 64, height: 64, borderRadius: 16 }}
                contentFit="cover"
              />
            ) : (
              <View className="w-16 h-16 rounded-2xl bg-wallet-card items-center justify-center">
                <Feather name="globe" size={32} color="#8B9A92" />
              </View>
            )}

            <Text className="text-wallet-text text-xl font-bold mt-4">
              {proposalInfo.dAppName}
            </Text>
            <Text className="text-wallet-text-secondary text-sm">
              {domain}
            </Text>
          </View>

          <ScrollView className="px-5 py-4" showsVerticalScrollIndicator={false}>
            {/* Connection Request */}
            <View className="bg-wallet-card rounded-xl p-4 mb-4">
              <View className="flex-row items-center gap-2 mb-2">
                <Feather name="link" size={16} color="#B8F25B" />
                <Text className="text-wallet-text font-semibold">
                  Connection Request
                </Text>
              </View>
              <Text className="text-wallet-text-secondary text-sm">
                {proposalInfo.dAppName} wants to connect to your wallet
              </Text>
            </View>

            {/* Select Networks */}
            <Text className="text-wallet-text font-semibold mb-3">
              Select Networks
            </Text>
            <View className="gap-2 mb-4">
              {supportedChainIds.map(chainId => {
                const isSelected = selectedChainIds.includes(chainId);
                const networkName = getNetworkNameForChainId(chainId);

                return (
                  <Pressable
                    key={chainId}
                    onPress={() => toggleChain(chainId)}
                    className={`flex-row items-center justify-between p-4 rounded-xl ${
                      isSelected ? 'bg-wallet-accent/20 border border-wallet-accent' : 'bg-wallet-card'
                    }`}
                  >
                    <Text className="text-wallet-text font-medium">
                      {networkName}
                    </Text>
                    {isSelected && (
                      <Feather name="check" size={18} color="#B8F25B" />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Permissions */}
            <Text className="text-wallet-text font-semibold mb-3">
              Permissions Requested
            </Text>
            <View className="bg-wallet-card rounded-xl p-4 mb-6">
              {['View your wallet address', 'Request transaction signatures', 'Request message signatures'].map((permission, index) => (
                <View
                  key={index}
                  className={`flex-row items-center gap-3 ${
                    index > 0 ? 'mt-3 pt-3 border-t border-wallet-card-light' : ''
                  }`}
                >
                  <Feather name="check-circle" size={16} color="#8B9A92" />
                  <Text className="text-wallet-text-secondary text-sm flex-1">
                    {permission}
                  </Text>
                </View>
              ))}
            </View>

            {/* Warning */}
            <View className="bg-wallet-warning/10 rounded-xl p-4 mb-6">
              <View className="flex-row items-start gap-3">
                <Feather name="alert-triangle" size={18} color="#FFB800" />
                <Text className="text-wallet-text-secondary text-sm flex-1">
                  Only connect to sites you trust. This site will be able to request
                  transactions but cannot execute them without your approval.
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Actions */}
          <View className="flex-row gap-4 px-5 pb-8 pt-4 border-t border-wallet-card">
            <Pressable
              onPress={handleReject}
              disabled={isLoading}
              className="flex-1 py-4 rounded-xl bg-wallet-card items-center active:opacity-70"
            >
              {isRejecting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="text-wallet-text font-semibold">Reject</Text>
              )}
            </Pressable>

            <Pressable
              onPress={handleApprove}
              disabled={isLoading || selectedChainIds.length === 0}
              className={`flex-1 py-4 rounded-xl items-center ${
                selectedChainIds.length > 0 && !isLoading
                  ? 'bg-wallet-accent active:opacity-70'
                  : 'bg-wallet-card-light'
              }`}
            >
              {isApproving ? (
                <ActivityIndicator color="#0A0A0A" />
              ) : (
                <Text
                  className={`font-semibold ${
                    selectedChainIds.length > 0 ? 'text-wallet-bg' : 'text-wallet-text-secondary'
                  }`}
                >
                  Connect
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
