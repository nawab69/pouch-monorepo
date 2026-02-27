import { Router } from 'express';
import crypto from 'crypto';
import { getDevicesByAddress, storeNotification } from '../services/notifications.js';
import {
  sendPushNotification,
  formatTransactionNotification,
} from '../services/expo-push.js';
import { getSigningKey } from '../services/alchemy-webhooks.js';

const router = Router();

// Simple in-memory deduplication cache (key -> timestamp)
// Prevents duplicate notifications for same transaction+address combo
const recentNotifications = new Map();
const DEDUP_TTL_MS = 60 * 1000; // 60 seconds

function isDuplicateNotification(hash, address) {
  if (!hash || !address) return false;

  // Key is hash + address, so same tx can notify both sender and receiver
  const key = `${hash}:${address.toLowerCase()}`;
  const now = Date.now();

  // Clean old entries
  for (const [k, timestamp] of recentNotifications) {
    if (now - timestamp > DEDUP_TTL_MS) {
      recentNotifications.delete(k);
    }
  }

  // Check if we've sent this notification recently
  if (recentNotifications.has(key)) {
    return true;
  }

  // Mark as sent
  recentNotifications.set(key, now);
  return false;
}

/**
 * Validate Alchemy webhook signature
 * Alchemy uses HMAC-SHA256 with the signing key
 */
function validateAlchemySignature(body, signature, signingKey) {
  if (!signingKey || !signature) return false;

  const hmac = crypto.createHmac('sha256', signingKey);
  hmac.update(body, 'utf8');
  const expectedSignature = hmac.digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

/**
 * POST /webhooks/alchemy
 * Receive Alchemy ADDRESS_ACTIVITY webhook events
 *
 * Alchemy webhook payload structure:
 * {
 *   webhookId: string,
 *   id: string,
 *   createdAt: string,
 *   type: "ADDRESS_ACTIVITY",
 *   event: {
 *     network: string,
 *     activity: [{
 *       fromAddress: string,
 *       toAddress: string,
 *       value: number,
 *       asset: string,
 *       category: string, // "external" | "internal" | "erc20" | "erc721" | "erc1155"
 *       rawContract: { ... },
 *       log: { ... },
 *       hash: string
 *     }]
 *   }
 * }
 */
router.post('/alchemy', async (req, res) => {
  try {
    // Get raw body for signature validation
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers['x-alchemy-signature'];
    const webhookId = req.body?.webhookId;

    // Get signing key for this webhook
    const signingKey = getSigningKey(webhookId);

    // Validate signature if signing key is configured
    if (signingKey) {
      if (!validateAlchemySignature(rawBody, signature, signingKey)) {
        console.error('Invalid Alchemy webhook signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
    } else {
      console.warn('No signing key configured for webhook, skipping signature validation');
    }

    const { type, event } = req.body;

    // Only process ADDRESS_ACTIVITY events
    if (type !== 'ADDRESS_ACTIVITY') {
      console.log(`Ignoring webhook type: ${type}`);
      return res.json({ success: true, message: 'Ignored non-activity event' });
    }

    const { network, activity } = event || {};

    if (!activity || !Array.isArray(activity)) {
      return res.json({ success: true, message: 'No activity in event' });
    }

    console.log(`Processing ${activity.length} activities from ${network}`);

    // Process each activity
    let notificationsSent = 0;
    let skippedDuplicates = 0;

    for (const txActivity of activity) {
      const { fromAddress, toAddress, value, asset, category, hash } = txActivity;

      // Skip zero-value transactions (unless it's a token transfer)
      if ((!value || value === 0) && category === 'external') {
        continue;
      }

      // Build a map of deviceId -> Set of involved addresses
      // This ensures if a device has both sender and receiver addresses,
      // they get notifications for both (send AND receive)
      const deviceAddressMap = new Map();

      const fromLower = fromAddress?.toLowerCase();
      const toLower = toAddress?.toLowerCase();

      // Find devices for sender address
      if (fromLower) {
        const senderDevices = await getDevicesByAddress(fromLower);
        for (const device of senderDevices) {
          if (!deviceAddressMap.has(device.deviceId)) {
            deviceAddressMap.set(device.deviceId, { device, addresses: new Set() });
          }
          deviceAddressMap.get(device.deviceId).addresses.add(fromLower);
        }
      }

      // Find devices for receiver address
      if (toLower) {
        const receiverDevices = await getDevicesByAddress(toLower);
        for (const device of receiverDevices) {
          if (!deviceAddressMap.has(device.deviceId)) {
            deviceAddressMap.set(device.deviceId, { device, addresses: new Set() });
          }
          deviceAddressMap.get(device.deviceId).addresses.add(toLower);
        }
      }

      // Send notifications - one per address per device
      for (const { device, addresses } of deviceAddressMap.values()) {
        for (const userAddress of addresses) {
          // Skip if we already sent this notification (dedup pending + confirmed)
          if (isDuplicateNotification(hash, userAddress)) {
            skippedDuplicates++;
            continue;
          }

          // Format the notification based on which address this is
          const notification = formatTransactionNotification(
            {
              fromAddress,
              toAddress,
              value: value?.toString(),
              asset: asset || (category === 'external' ? 'ETH' : undefined),
              network,
            },
            userAddress
          );

          // Add transaction hash to data
          notification.data.hash = hash;

          // Send push notification
          const result = await sendPushNotification(device.pushToken, notification);

          if (result.success) {
            notificationsSent++;
          }
          storeNotification({
            deviceId: device.deviceId,
            address: userAddress,
            type: 'transaction',
            direction: notification.data.direction,
            title: notification.title,
            body: notification.body,
            data: notification.data,
          }).catch(err => console.error('Failed to store notification:', err.message));
        }
      }
    }

    console.log(`Sent ${notificationsSent} notifications, skipped ${skippedDuplicates} duplicates`);

    res.json({
      success: true,
      processed: activity.length,
      notificationsSent,
      skippedDuplicates,
    });
  } catch (error) {
    console.error('Webhook processing error:', error.message);
    // Return 200 to prevent Alchemy from retrying
    res.json({ success: false, error: error.message });
  }
});

/**
 * GET /webhooks/test
 * Test endpoint to verify webhook route is working
 */
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is working',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /webhooks/test-notification
 * Send a test push notification to a registered address
 *
 * Body: {
 *   address: string,        // Wallet address to send notification to
 *   type?: "receive" | "send",  // Transaction type (default: receive)
 *   amount?: string,        // Amount (default: "0.1")
 *   asset?: string          // Asset symbol (default: "ETH")
 * }
 */
router.post('/test-notification', async (req, res) => {
  try {
    const {
      address,
      type = 'receive',
      amount = '0.1',
      asset = 'ETH'
    } = req.body;

    if (!address) {
      return res.status(400).json({ error: 'Missing address parameter' });
    }

    // Find devices monitoring this address
    const devices = await getDevicesByAddress(address);

    if (devices.length === 0) {
      return res.status(404).json({
        error: 'No devices registered for this address',
        hint: 'Make sure notifications are enabled in the app'
      });
    }

    // Create fake transaction activity
    const fakeActivity = {
      fromAddress: type === 'receive' ? '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00' : address,
      toAddress: type === 'receive' ? address : '0x742d35Cc6634C0532925a3b844Bc9e7595f8fE00',
      value: amount,
      asset,
      network: 'ETH_MAINNET',
    };

    // Send notification to all devices
    const results = [];
    for (const device of devices) {
      const notification = formatTransactionNotification(fakeActivity, address);
      notification.data.test = true;

      const result = await sendPushNotification(device.pushToken, notification);
      storeNotification({
        deviceId: device.deviceId,
        address,
        type: 'transaction',
        direction: type === 'receive' ? 'receive' : 'send',
        title: notification.title,
        body: notification.body,
        data: notification.data,
      }).catch(err => console.error('Failed to store test notification:', err.message));
      results.push({
        deviceId: device.deviceId,
        success: result.success,
        error: result.error,
      });
    }

    const successCount = results.filter(r => r.success).length;

    res.json({
      success: successCount > 0,
      message: `Sent ${successCount}/${devices.length} notifications`,
      results,
    });
  } catch (error) {
    console.error('Test notification error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

export default router;
