import { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { useNotifications } from '@/contexts/notification-context';
import { fetchNotificationHistory, markNotificationsAsRead } from '@/services/notifications/history';
import { NotificationItemRow } from '@/components/notifications';
import type { NotificationItem } from '@/types/notifications';

export default function NotificationsScreen() {
  const router = useRouter();
  const { deviceId, refreshUnreadCount } = useNotifications();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const loadNotifications = useCallback(async (cursor?: string) => {
    if (!deviceId) return;

    try {
      const result = await fetchNotificationHistory(deviceId, {
        limit: 20,
        before: cursor,
      });

      if (cursor) {
        setNotifications((prev) => [...prev, ...result.notifications]);
      } else {
        setNotifications(result.notifications);
      }
      setHasMore(result.hasMore);
      setNextCursor(result.nextCursor);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, [deviceId]);

  useEffect(() => {
    loadNotifications().finally(() => setIsLoading(false));
  }, [loadNotifications]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadNotifications();
    await refreshUnreadCount();
    setIsRefreshing(false);
  }, [loadNotifications, refreshUnreadCount]);

  const onEndReached = useCallback(async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return;
    setIsLoadingMore(true);
    await loadNotifications(nextCursor);
    setIsLoadingMore(false);
  }, [hasMore, isLoadingMore, nextCursor, loadNotifications]);

  const handleNotificationPress = useCallback(async (notification: NotificationItem) => {
    if (!notification.read && deviceId) {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n._id === notification._id ? { ...n, read: true } : n))
      );
      markNotificationsAsRead(deviceId, [notification._id]).catch(() => {
        // Revert on failure
        setNotifications((prev) =>
          prev.map((n) => (n._id === notification._id ? { ...n, read: false } : n))
        );
      });
      refreshUnreadCount();
    }
  }, [deviceId, refreshUnreadCount]);

  const handleMarkAllRead = useCallback(async () => {
    if (!deviceId) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));

    try {
      await markNotificationsAsRead(deviceId);
      await refreshUnreadCount();
    } catch {
      // Revert on failure
      await loadNotifications();
    }
  }, [deviceId, refreshUnreadCount, loadNotifications]);

  const hasUnread = notifications.some((n) => !n.read);

  return (
    <SafeAreaView className="flex-1 bg-wallet-bg" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable
          onPress={() => router.back()}
          className="w-10 h-10 items-center justify-center rounded-full bg-wallet-card"
        >
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </Pressable>

        <Text className="text-lg font-bold text-wallet-text">Notifications</Text>

        {hasUnread ? (
          <Pressable
            onPress={handleMarkAllRead}
            className="px-3 py-2 rounded-full bg-wallet-card"
          >
            <Text className="text-xs text-wallet-accent font-medium">Mark All Read</Text>
          </Pressable>
        ) : (
          <View className="w-10" />
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B8F25B" />
        </View>
      ) : notifications.length === 0 ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-wallet-card items-center justify-center mb-4">
            <Feather name="bell" size={28} color="#8B9A92" />
          </View>
          <Text className="text-wallet-text font-bold text-lg mb-2">No notifications yet</Text>
          <Text className="text-wallet-text-secondary text-center">
            Transaction notifications will appear here when you send or receive crypto.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <NotificationItemRow notification={item} onPress={handleNotificationPress} />
          )}
          ItemSeparatorComponent={() => (
            <View className="h-px bg-wallet-card mx-5" />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#B8F25B"
            />
          }
          onEndReached={onEndReached}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            isLoadingMore ? (
              <View className="py-4">
                <ActivityIndicator size="small" color="#B8F25B" />
              </View>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}
