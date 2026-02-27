import { memo } from 'react';
import { View, Text, Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { NotificationItem as NotificationItemType } from '@/types/notifications';

interface NotificationItemProps {
  notification: NotificationItemType;
  onPress: (notification: NotificationItemType) => void;
}

function getTimeAgo(dateString: string): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString();
}

export const NotificationItemRow = memo(function NotificationItemRow({
  notification,
  onPress,
}: NotificationItemProps) {
  const isReceive = notification.direction === 'receive';

  return (
    <Pressable
      onPress={() => onPress(notification)}
      className="flex-row items-center gap-3 px-5 py-4 active:opacity-70"
    >
      {/* Direction icon */}
      <View
        className="w-10 h-10 rounded-full items-center justify-center"
        style={{
          backgroundColor: isReceive ? 'rgba(52, 199, 89, 0.15)' : 'rgba(255, 69, 58, 0.15)',
        }}
      >
        <Feather
          name={isReceive ? 'arrow-down-left' : 'arrow-up-right'}
          size={18}
          color={isReceive ? '#34C759' : '#FF453A'}
        />
      </View>

      {/* Content */}
      <View className="flex-1">
        <Text className="text-wallet-text font-medium" numberOfLines={1}>
          {notification.title}
        </Text>
        <Text className="text-wallet-text-secondary text-sm mt-0.5" numberOfLines={2}>
          {notification.body}
        </Text>
      </View>

      {/* Time + unread dot */}
      <View className="items-end gap-1">
        <Text className="text-wallet-text-secondary text-xs">
          {getTimeAgo(notification.createdAt)}
        </Text>
        {!notification.read && (
          <View className="w-2 h-2 rounded-full bg-wallet-accent" />
        )}
      </View>
    </Pressable>
  );
});
