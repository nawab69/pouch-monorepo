import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import {
  requestNotificationPermissions,
  getExpoPushToken,
  getDeviceId,
  getPlatform,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  getLastNotificationResponse,
} from '@/services/notifications/push-service';
import {
  registerDevice,
  unregisterDevice,
  addAddresses,
} from '@/services/notifications/registration';
import { fetchUnreadCount } from '@/services/notifications/history';

const NOTIFICATIONS_ENABLED_KEY = '@pouch/notifications_enabled';
const DEVICE_ID_KEY = '@pouch/notification_device_id';

interface NotificationContextType {
  isEnabled: boolean;
  isLoading: boolean;
  permissionStatus: Notifications.PermissionStatus | null;
  pushToken: string | null;
  deviceId: string | null;
  unreadCount: number;
  refreshUnreadCount: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  registerAddresses: (addresses: string[]) => Promise<void>;
  addNewAddress: (address: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState<Notifications.PermissionStatus | null>(null);
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  // Load saved state on mount
  useEffect(() => {
    loadSavedState();
  }, []);

  // Set up notification listeners
  useEffect(() => {
    // Foreground notification handler
    notificationListener.current = addNotificationReceivedListener((notification) => {
      console.log('Notification received:', notification.request.content);
      setUnreadCount((prev) => prev + 1);
    });

    // Notification tap handler
    responseListener.current = addNotificationResponseReceivedListener((response) => {
      handleNotificationTap(response);
    });

    // Check for notification that opened the app (cold start)
    getLastNotificationResponse().then((response) => {
      if (response) {
        handleNotificationTap(response);
      }
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  // Re-register when app comes to foreground (in case token changed)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [isEnabled, pushToken]);

  const refreshUnreadCount = useCallback(async () => {
    if (!deviceId) return;
    try {
      const count = await fetchUnreadCount(deviceId);
      setUnreadCount(count);
    } catch (error) {
      console.warn('Failed to fetch unread count:', error);
    }
  }, [deviceId]);

  // Fetch unread count when enabled and deviceId is available
  useEffect(() => {
    if (isEnabled && deviceId) {
      refreshUnreadCount();
    }
  }, [isEnabled, deviceId, refreshUnreadCount]);

  const handleAppStateChange = async (nextState: AppStateStatus) => {
    if (nextState === 'active' && isEnabled && pushToken) {
      // Refresh token on app foreground
      const newToken = await getExpoPushToken();
      if (newToken && newToken !== pushToken) {
        console.log('Push token changed, re-registering');
        setPushToken(newToken);
        // Registration will happen automatically via effect
      }
    }
  };

  const handleNotificationTap = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data;

    if (data?.type === 'transaction') {
      // Navigate to relevant screen based on transaction type
      // For now, just go to home which shows transaction history
      console.log('Notification tapped, transaction data:', data);
      // Could navigate to: router.push(`/transaction/${data.hash}`);
    }
  };

  const loadSavedState = async () => {
    try {
      const [enabledValue, savedDeviceId] = await Promise.all([
        AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY),
        AsyncStorage.getItem(DEVICE_ID_KEY),
      ]);

      const enabled = enabledValue === 'true';
      setIsEnabled(enabled);

      // Get or create device ID
      let currentDeviceId = savedDeviceId;
      if (!currentDeviceId) {
        currentDeviceId = getDeviceId();
        await AsyncStorage.setItem(DEVICE_ID_KEY, currentDeviceId);
      }
      setDeviceId(currentDeviceId);

      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      // If enabled, get push token
      if (enabled && status === 'granted') {
        const token = await getExpoPushToken();
        setPushToken(token);
      }
    } catch (error) {
      console.warn('Error loading notification state:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    try {
      // Request permissions
      const granted = await requestNotificationPermissions();

      if (!granted) {
        console.log('Notification permissions denied');
        setPermissionStatus(Notifications.PermissionStatus.DENIED);
        return false;
      }

      setPermissionStatus(Notifications.PermissionStatus.GRANTED);

      // Get push token
      const token = await getExpoPushToken();
      if (!token) {
        console.error('Failed to get push token');
        return false;
      }

      setPushToken(token);
      setIsEnabled(true);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'true');

      return true;
    } catch (error) {
      console.error('Failed to enable notifications:', error);
      return false;
    }
  }, []);

  const disableNotifications = useCallback(async (): Promise<void> => {
    try {
      // Unregister from backend
      if (deviceId) {
        await unregisterDevice(deviceId);
      }

      setIsEnabled(false);
      setPushToken(null);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, 'false');
    } catch (error) {
      console.error('Failed to disable notifications:', error);
    }
  }, [deviceId]);

  const registerAddresses = useCallback(async (addresses: string[]): Promise<void> => {
    if (!isEnabled || !pushToken || !deviceId) {
      console.log('Notifications not enabled, skipping registration');
      return;
    }

    if (addresses.length === 0) {
      console.log('No addresses to register');
      return;
    }

    try {
      const result = await registerDevice({
        deviceId,
        pushToken,
        platform: getPlatform(),
        addresses,
      });

      if (result.success) {
        console.log('Successfully registered addresses for notifications');
      } else {
        console.error('Failed to register addresses:', result.error);
      }
    } catch (error) {
      console.error('Error registering addresses:', error);
    }
  }, [isEnabled, pushToken, deviceId]);

  const addNewAddress = useCallback(async (address: string): Promise<void> => {
    if (!isEnabled || !deviceId) {
      console.log('Notifications not enabled, skipping address add');
      return;
    }

    try {
      const result = await addAddresses(deviceId, [address]);

      if (result.success) {
        console.log('Successfully added address for notifications');
      } else {
        console.error('Failed to add address:', result.error);
      }
    } catch (error) {
      console.error('Error adding address:', error);
    }
  }, [isEnabled, deviceId]);

  return (
    <NotificationContext.Provider
      value={{
        isEnabled,
        isLoading,
        permissionStatus,
        pushToken,
        deviceId,
        unreadCount,
        refreshUnreadCount,
        enableNotifications,
        disableNotifications,
        registerAddresses,
        addNewAddress,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
