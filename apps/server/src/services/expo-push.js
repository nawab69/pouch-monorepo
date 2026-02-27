import { removeInvalidPushToken } from './notifications.js';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

/**
 * Send a push notification via Expo Push API
 * @param {string} pushToken - Expo push token (ExponentPushToken[xxx])
 * @param {object} notification - { title, body, data }
 */
export async function sendPushNotification(pushToken, { title, body, data = {} }) {
  const message = {
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  };

  const headers = {
    'Content-Type': 'application/json',
  };

  // Add Expo access token if available (for enhanced rate limits)
  if (process.env.EXPO_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(message),
    });

    const result = await response.json();

    // Handle ticket response
    if (result.data) {
      const ticket = result.data;

      if (ticket.status === 'error') {
        console.error('Push notification error:', ticket.message);

        // Handle DeviceNotRegistered - remove invalid token
        if (ticket.details?.error === 'DeviceNotRegistered') {
          console.log('Removing invalid push token:', pushToken);
          await removeInvalidPushToken(pushToken);
        }

        return { success: false, error: ticket.message };
      }

      return { success: true, ticketId: ticket.id };
    }

    return { success: false, error: 'Unknown response format' };
  } catch (error) {
    console.error('Failed to send push notification:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notifications to multiple devices
 * @param {Array<{pushToken: string, title: string, body: string, data?: object}>} notifications
 */
export async function sendBatchPushNotifications(notifications) {
  const messages = notifications.map(({ pushToken, title, body, data = {} }) => ({
    to: pushToken,
    sound: 'default',
    title,
    body,
    data,
  }));

  const headers = {
    'Content-Type': 'application/json',
  };

  if (process.env.EXPO_ACCESS_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;
  }

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(messages),
    });

    const result = await response.json();

    // Process tickets and handle errors
    if (result.data && Array.isArray(result.data)) {
      const invalidTokens = [];

      result.data.forEach((ticket, index) => {
        if (ticket.status === 'error') {
          console.error('Push notification error:', ticket.message);

          if (ticket.details?.error === 'DeviceNotRegistered') {
            invalidTokens.push(notifications[index].pushToken);
          }
        }
      });

      // Remove invalid tokens
      for (const token of invalidTokens) {
        await removeInvalidPushToken(token);
      }

      return {
        success: true,
        sent: result.data.filter((t) => t.status === 'ok').length,
        failed: result.data.filter((t) => t.status === 'error').length,
      };
    }

    return { success: false, error: 'Unknown response format' };
  } catch (error) {
    console.error('Failed to send batch push notifications:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Format a transaction notification
 * @param {object} activity - Transaction activity from Alchemy webhook
 * @param {string} userAddress - The user's wallet address
 */
export function formatTransactionNotification(activity, userAddress) {
  const { fromAddress, toAddress, value, asset, network } = activity;
  const normalizedUserAddress = userAddress.toLowerCase();
  const isReceive = toAddress.toLowerCase() === normalizedUserAddress;

  // Format address for display (0x1234...5678)
  const formatAddress = (addr) => {
    if (!addr) return 'Unknown';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Format value (show up to 6 decimal places, trim trailing zeros)
  const formatValue = (val) => {
    if (!val) return '0';
    const num = parseFloat(val);
    if (num === 0) return '0';
    if (num >= 1) return num.toFixed(4).replace(/\.?0+$/, '');
    return num.toPrecision(4).replace(/\.?0+$/, '');
  };

  const assetSymbol = asset || 'ETH';
  const formattedValue = formatValue(value);

  if (isReceive) {
    return {
      title: `Received ${formattedValue} ${assetSymbol}`,
      body: `from ${formatAddress(fromAddress)}`,
      data: {
        type: 'transaction',
        direction: 'receive',
        fromAddress,
        toAddress,
        value,
        asset: assetSymbol,
        network,
      },
    };
  } else {
    return {
      title: `Sent ${formattedValue} ${assetSymbol}`,
      body: `to ${formatAddress(toAddress)}`,
      data: {
        type: 'transaction',
        direction: 'send',
        fromAddress,
        toAddress,
        value,
        asset: assetSymbol,
        network,
      },
    };
  }
}
