import { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Account, Network, NetworkType } from '@/types/blockchain';
import { NetworkBadge } from '@/components/network-badge';

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedAccount: Account | null;
  walletAddress: string;
  selectedNetwork: Network;
  networkType: NetworkType;
  totalBalanceUsd: number;
}

export function ProfileSheet({
  visible,
  onClose,
  selectedAccount,
  walletAddress,
  selectedNetwork,
  networkType,
  totalBalanceUsd,
}: ProfileSheetProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async () => {
    await Clipboard.setStringAsync(walletAddress);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const navigateTo = (route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const quickLinks: { icon: React.ComponentProps<typeof Feather>['name']; label: string; route: string }[] = [
    { icon: 'settings', label: 'Settings', route: '/(tabs)/settings' },
    { icon: 'lock', label: 'Security', route: '/app-lock' },
    { icon: 'book', label: 'Address Book', route: '/address-book' },
    { icon: 'link', label: 'WalletConnect', route: '/walletconnect' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable
        className="flex-1 bg-black/60 justify-end"
        onPress={onClose}
      >
        <Pressable
          className="bg-wallet-card rounded-t-3xl"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="p-5">
            {/* Header */}
            <View className="flex-row items-center justify-between mb-5">
              <Text className="text-xl font-bold text-wallet-text">Profile</Text>
              <Pressable
                onPress={onClose}
                className="w-8 h-8 rounded-full bg-wallet-card-light items-center justify-center"
              >
                <Feather name="x" size={18} color="#8E8E93" />
              </Pressable>
            </View>

            {/* Account Info */}
            <View className="items-center mb-5">
              {/* Avatar */}
              <View className="w-16 h-16 rounded-full bg-wallet-accent items-center justify-center mb-3">
                <Text className="text-2xl font-bold text-wallet-bg">
                  {selectedAccount ? selectedAccount.name.charAt(0).toUpperCase() : 'W'}
                </Text>
              </View>

              {/* Account Name */}
              <Text className="text-lg font-bold text-wallet-text mb-1">
                {selectedAccount?.name ?? 'Wallet'}
              </Text>

              {/* Network Badge */}
              <NetworkBadge
                network={selectedNetwork}
                networkType={networkType}
                size="small"
              />
            </View>

            {/* Address with copy */}
            <Pressable
              onPress={handleCopyAddress}
              className="flex-row items-center justify-center gap-2 bg-wallet-card-light rounded-xl px-4 py-3 mb-4"
            >
              <Text className="text-wallet-text-secondary text-sm font-mono flex-1 text-center" numberOfLines={1}>
                {walletAddress}
              </Text>
              <Feather
                name={copied ? 'check' : 'copy'}
                size={16}
                color={copied ? '#B8F25B' : '#8E8E93'}
              />
            </Pressable>

            {copied && (
              <Text className="text-wallet-accent text-xs text-center -mt-2 mb-3">Copied!</Text>
            )}

            {/* USD Balance */}
            <Text className="text-2xl font-bold text-wallet-text text-center mb-5">
              ${totalBalanceUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Text>

            {/* Divider */}
            <View className="h-px bg-wallet-card-light mb-3" />

            {/* Quick Links */}
            <View className="gap-1">
              {quickLinks.map((link) => (
                <Pressable
                  key={link.route}
                  onPress={() => navigateTo(link.route)}
                  className="flex-row items-center gap-3 px-3 py-3.5 rounded-xl active:bg-wallet-card-light"
                >
                  <View className="w-9 h-9 rounded-full bg-wallet-card-light items-center justify-center">
                    <Feather name={link.icon} size={18} color="#8B9A92" />
                  </View>
                  <Text className="text-wallet-text font-medium flex-1">{link.label}</Text>
                  <Feather name="chevron-right" size={18} color="#8E8E93" />
                </Pressable>
              ))}
            </View>

            <View className="h-6" />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
