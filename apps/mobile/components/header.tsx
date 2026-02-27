import { View, Text, Pressable } from 'react-native';
import { WalletPill } from './wallet-pill';
import Feather from '@expo/vector-icons/Feather';

interface HeaderProps {
  walletAddress: string;
  showBackButton?: boolean;
  title?: string;
  unreadCount?: number;
  onBackPress?: () => void;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
  onWalletPress?: () => void;
}

export function Header({
  walletAddress,
  showBackButton = false,
  unreadCount = 0,
  onBackPress,
  onProfilePress,
  onNotificationPress,
  onWalletPress,
}: HeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5 py-3">
      {showBackButton ? (
        <Pressable
          onPress={onBackPress}
          className="w-10 h-10 items-center justify-center rounded-full bg-wallet-card"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>
      ) : (
        <Pressable
          onPress={onProfilePress}
          className="w-10 h-10 items-center justify-center rounded-full bg-wallet-card"
        >
          <Feather name="user" size={18} color="#8B9A92" />
        </Pressable>
      )}

      <WalletPill address={walletAddress} onPress={onWalletPress} />

      <Pressable
        onPress={onNotificationPress}
        className="w-10 h-10 items-center justify-center rounded-full bg-wallet-card"
      >
        <Feather name="bell" size={20} color="#8B9A92" />
        {unreadCount > 0 && (
          <View className="absolute -top-1 -right-1 bg-wallet-negative rounded-full min-w-[18px] h-[18px] items-center justify-center px-1">
            <Text className="text-white text-[10px] font-bold">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
