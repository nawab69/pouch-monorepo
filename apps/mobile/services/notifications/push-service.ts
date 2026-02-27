import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Configure how notifications are displayed when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permissions
 * Returns true if permissions were granted
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();

  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

/**
 * Get the current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * Get the Expo push token for this device
 * Returns null if unable to get token (permissions denied, not a physical device, etc.)
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  try {
    // Check permissions first
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('Notification permissions not granted');
      return null;
    }

    // Get project ID from app config
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      console.warn('EAS project ID not configured in app.json');
      // Try without project ID (works in development)
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

/**
 * Get a unique device identifier
 * Uses a combination of device info to create a stable ID
 */
export function getDeviceId(): string {
  // Use Constants.installationId which is stable per app installation
  // Falls back to a combination of device info
  const installationId = Constants.installationId;

  if (installationId) {
    return installationId;
  }

  // Fallback: create ID from device info
  const deviceInfo = [
    Device.brand,
    Device.modelName,
    Device.osName,
    Platform.OS,
  ].filter(Boolean).join('-');

  return `device-${deviceInfo}-${Date.now()}`;
}

/**
 * Get the platform type (ios or android)
 */
export function getPlatform(): 'ios' | 'android' {
  return Platform.OS as 'ios' | 'android';
}

/**
 * Schedule a local notification (for testing)
 */
export async function scheduleLocalNotification({
  title,
  body,
  data = {},
}: {
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null, // Immediate
  });

  return id;
}

/**
 * Add a listener for received notifications (foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add a listener for notification responses (taps)
 */
export function addNotificationResponseReceivedListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.EventSubscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

/**
 * Get the last notification response (for cold start handling)
 */
export async function getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
  return Notifications.getLastNotificationResponseAsync();
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Set badge count (iOS only)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (Platform.OS === 'ios') {
    await Notifications.setBadgeCountAsync(count);
  }
}
